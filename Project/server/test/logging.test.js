// Structured logging: key events are recorded, linked by request ID, and contain
// no passwords, tokens, full email addresses or attacker-controlled log lines.
const test = require("node:test");
const assert = require("node:assert/strict");
const https = require("https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const winston = require("winston");

process.env.JWT_SECRET = "test-only-jwt-secret-that-is-not-used-in-production";

const app = require("../app");
const User = require("../models/User");
const Gig = require("../models/Gig");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const ApiUsage = require("../models/ApiUsage");
const accountLockout = require("../services/accountLockout");
const { logger, sanitize, maskEmail, isCloudLoggingEnabled } = require("../utils/logger");
const { errorHandler } = require("../middleware/errorMiddleware");
const { createHttpsServer, readSslCredentials } = require("../config/https");

ApiUsage.create = async () => ({});
accountLockout.getLockStatus = async () => ({ locked: false });
accountLockout.recordFailedLogin = async () => ({ locked: false, failedCount: 2, attemptsRemaining: 3 });
accountLockout.clearFailedLogins = async () => {};

// Capture what the logger writes instead of printing it.
const entries = [];
class CaptureTransport extends winston.Transport {
  log(info, callback) {
    entries.push(info);
    callback();
  }
}
const capture = new CaptureTransport();

const IDS = { client: "64b000000000000000000001", freelancer: "64b000000000000000000002", gig: "64b0000000000000000000a1" };
const originals = { findById: User.findById, findOne: User.findOne, gigFindOne: Gig.findOne, bookingCreate: Booking.create, bookingExists: Booking.exists, txCreate: Transaction.create };
let server;
let port;
let originalSilent;

const request = ({ path, method = "GET", body, headers = {} }) => new Promise((resolve, reject) => {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const req = https.request({
    hostname: "127.0.0.1", port, path, method, rejectUnauthorized: false,
    headers: { ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}), ...headers }
  }, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null }));
  });
  req.on("error", reject);
  req.end(payload);
});

const loginAs = (role, id) => {
  User.findById = () => ({ select: async () => ({ _id: id, role, isActive: true, tokenVersion: 0 }) });
  return { Cookie: `token=${jwt.sign({ id, role, tv: 0 }, process.env.JWT_SECRET, { expiresIn: "5m" })}` };
};

const find = (event) => entries.filter((entry) => entry.event === event);
// The access-log line is written when the response finishes; give it a moment.
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

test.before(async () => {
  Booking.exists = async () => null;
  originalSilent = logger.silent;
  logger.silent = false;
  logger.transports.forEach((transport) => { transport.silent = true; });
  logger.add(capture);
  server = createHttpsServer(app, readSslCredentials());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

test.after(async () => {
  logger.remove(capture);
  logger.silent = originalSilent;
  User.findById = originals.findById;
  User.findOne = originals.findOne;
  Gig.findOne = originals.gigFindOne;
  Booking.create = originals.bookingCreate;
  Booking.exists = originals.bookingExists;
  Transaction.create = originals.txCreate;
  await new Promise((resolve) => server.close(resolve));
});

test.beforeEach(() => { entries.length = 0; });

test("sanitize strips control characters, redacts secrets and limits length", () => {
  const cleaned = sanitize({
    note: "line one\r\nFORGED ENTRY",
    password: "Secret1!",
    nested: { authToken: "abc", keep: "ok" },
    long: "x".repeat(500)
  });
  assert.doesNotMatch(cleaned.note, /[\r\n]/);
  assert.equal(cleaned.password, "[redacted]");
  assert.equal(cleaned.nested.authToken, "[redacted]");
  assert.equal(cleaned.nested.keep, "ok");
  assert.ok(cleaned.long.length <= 201);
});

test("email addresses are masked before they are logged", () => {
  assert.equal(maskEmail("Alex.Smith@Example.com"), "a***@example.com");
  assert.equal(maskEmail(undefined), undefined);
});

test("every request gets an ID in X-Request-Id and an access-log entry with the route", async () => {
  const res = await request({ path: "/api/test" });
  await settle();
  assert.match(res.headers["x-request-id"], /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i);
  const [entry] = find("http.request");
  assert.equal(entry.requestId, res.headers["x-request-id"]);
  assert.equal(entry.route, "/api/test");
  assert.equal(entry.status, 200);
  assert.equal(entry.level, "info");
  assert.equal(typeof entry.durationMs, "number");
});

test("IDs and other user-controlled path segments are replaced in the route label", async () => {
  await request({ path: "/api/gigs/64b0000000000000000000a1?search=<script>", headers: { } });
  await settle();
  const [entry] = find("http.request");
  assert.equal(entry.route, "/api/gigs/:param");
  assert.doesNotMatch(JSON.stringify(entries), /64b0000000000000000000a1|script/);
});

test("the access log never records query strings or unmatched URLs", async () => {
  await request({ path: "/api/does-not-exist?resetToken=abc123" });
  await settle();
  const [entry] = find("http.request");
  assert.equal(entry.route, "unmatched");
  assert.equal(entry.level, "warn");
  assert.doesNotMatch(JSON.stringify(entries), /abc123|does-not-exist/);
});

test("a failed login is logged with a reason and masked email, never the password", async () => {
  User.findOne = async () => null;
  await request({ path: "/api/auth/login", method: "POST", body: { email: "attacker.target@example.com", password: "Guess123!" } });
  const [entry] = find("auth.login.failed");
  assert.equal(entry.level, "warn");
  assert.equal(entry.reason, "unknown_email");
  assert.equal(entry.email, "a***@example.com");
  assert.equal(entry.failedCount, 2);
  assert.match(entry.accountKey, /^[a-f0-9]{16}$/);
  assert.ok(entry.ip);
  assert.doesNotMatch(JSON.stringify(entries), /Guess123|attacker\.target/);
});

test("a successful login is logged with the user ID and role", async () => {
  const password = await bcrypt.hash("CorrectPass1!", 4);
  User.findOne = async () => ({ _id: IDS.client, email: "client@example.com", role: "Client", isActive: true, password, tokenVersion: 0 });
  const res = await request({ path: "/api/auth/login", method: "POST", body: { email: "client@example.com", password: "CorrectPass1!" } });
  assert.equal(res.status, 200);
  const [entry] = find("auth.login.success");
  assert.equal(entry.targetUserId, IDS.client);
  assert.equal(entry.targetUserRole, "Client");
  assert.doesNotMatch(JSON.stringify(entries), /CorrectPass1|token=/);
});

test("a booking logs booking.created and transaction.created with the amounts", async () => {
  Gig.findOne = async () => ({ _id: IDS.gig, freelancerId: IDS.freelancer, price: 1000, location: { address: "Cape Town" } });
  Booking.create = async (doc) => ({ _id: "64b0000000000000000000b1", ...doc });
  Transaction.create = async (doc) => ({ _id: "64b0000000000000000000c1", ...doc });
  const res = await request({
    path: "/api/bookings",
    method: "POST",
    body: { gigId: IDS.gig, bookingDate: new Date(Date.now() + 7 * 86400000).toISOString() },
    headers: loginAs("Client", IDS.client)
  });
  assert.equal(res.status, 201);
  const [booking] = find("booking.created");
  assert.equal(booking.userId, IDS.client);
  assert.equal(booking.freelancerId, IDS.freelancer);
  assert.equal(booking.agreedPrice, 1000);
  const [transaction] = find("transaction.created");
  assert.equal(transaction.amount, 1000);
  assert.equal(transaction.platformFee, 100);
  assert.equal(transaction.freelancerAmount, 900);
  assert.equal(transaction.requestId, booking.requestId, "both events share the request ID");
});

test("a role violation is logged as access.denied.role", async () => {
  await request({ path: "/api/gigs", method: "POST", body: {}, headers: loginAs("Client", IDS.client) });
  const [entry] = find("access.denied.role");
  assert.equal(entry.userId, IDS.client);
  assert.deepEqual(entry.requiredRoles, ["Freelancer"]);
});

test("an invalid JWT is logged as auth.token.invalid", async () => {
  await request({ path: "/api/auth/me", headers: { Cookie: "token=forged.token.value" } });
  assert.equal(find("auth.token.invalid").length, 1);
});

test("a cross-site write is logged with a cleaned origin", async () => {
  await request({ path: "/api/auth/logout", method: "POST", headers: { Origin: "https://evil.example.com" } });
  const [entry] = find("security.origin.blocked");
  assert.equal(entry.origin, "https://evil.example.com");
});

test("unexpected errors log an incident ID and error class, never the message", () => {
  const error = new Error("private database details");
  error.name = "BadError\r\nFORGED LOG ENTRY";
  const res = {
    headersSent: false,
    set(name, value) { this.headers = { ...this.headers, [name]: value }; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    errorHandler(error, { method: "GET", baseUrl: "" }, res, () => {});
  } finally {
    console.error = originalError;
  }
  const [entry] = find("server.error");
  assert.equal(entry.level, "error");
  assert.equal(entry.incidentId, res.headers["X-Incident-Id"]);
  assert.equal(entry.errorType, "Error");
  assert.doesNotMatch(JSON.stringify(entry), /FORGED|private database details/);
});

test("cloud logging stays off unless the Better Stack settings are provided", () => {
  assert.equal(isCloudLoggingEnabled(), false);
});

// Kept last: it uses up the login rate limit for this test process.
test("hitting the login rate limit is logged as a security event", async () => {
  for (let i = 0; i < 31; i += 1) {
    await request({ path: "/api/auth/login", method: "POST", body: {} });
  }
  assert.ok(find("security.rate_limit.auth").length >= 1);
});
