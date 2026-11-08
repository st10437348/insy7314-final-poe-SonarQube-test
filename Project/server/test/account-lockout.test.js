// Security feature 1: per-account lockout after repeated failed sign-ins.
const test = require("node:test");
const assert = require("node:assert/strict");
const https = require("https");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "test-only-jwt-secret-that-is-not-used-in-production";

const app = require("../app");
const User = require("../models/User");
const ApiUsage = require("../models/ApiUsage");
const LoginAttempt = require("../models/LoginAttempt");
const accountLockout = require("../services/accountLockout");
const { createHttpsServer, readSslCredentials } = require("../config/https");

ApiUsage.create = async () => ({});

// In-memory stand-in for the LoginAttempt collection, supporting the queries the service uses.
const store = new Map();
const matches = (doc, filter) => Object.entries(filter).every(([field, condition]) => {
  if (condition && typeof condition === "object" && "$gte" in condition) {
    return doc[field] >= condition.$gte;
  }
  return doc[field] === condition;
});
const applyUpdate = (doc, update) => {
  for (const [field, amount] of Object.entries(update.$inc || {})) doc[field] = (doc[field] || 0) + amount;
  Object.assign(doc, update.$set || {});
  return doc;
};
LoginAttempt.findOne = (filter) => ({
  lean: async () => {
    const doc = store.get(filter.key);
    return doc && matches(doc, filter) ? { ...doc } : null;
  }
});
LoginAttempt.findOneAndUpdate = async (filter, update, options = {}) => {
  let doc = store.get(filter.key);
  if (!doc || !matches(doc, filter)) {
    if (!options.upsert) return null;
    doc = doc || { key: filter.key, failedCount: 0, lockedUntil: null };
    store.set(filter.key, doc);
  }
  return { ...applyUpdate(doc, update) };
};
LoginAttempt.updateOne = async (filter, update) => {
  const doc = store.get(filter.key);
  if (doc) applyUpdate(doc, update);
};
LoginAttempt.deleteOne = async (filter) => { store.delete(filter.key); };

const originalFindOne = User.findOne;
let server;
let port;
let passwordHash;

const request = (body) => new Promise((resolve, reject) => {
  const payload = JSON.stringify(body);
  const req = https.request({
    hostname: "127.0.0.1", port, path: "/api/auth/login", method: "POST", rejectUnauthorized: false,
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
  }, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }));
  });
  req.on("error", reject);
  req.end(payload);
});

test.before(async () => {
  passwordHash = await bcrypt.hash("CorrectPass1!", 4);
  server = createHttpsServer(app, readSslCredentials());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

test.after(async () => {
  User.findOne = originalFindOne;
  await new Promise((resolve) => server.close(resolve));
});

test.beforeEach(() => {
  store.clear();
  User.findOne = async (filter) => (filter.email.$eq === "victim@example.com"
    ? { _id: "507f1f77bcf86cd799439011", email: "victim@example.com", role: "Client", isActive: true, password: passwordHash, tokenVersion: 0 }
    : null);
});

test("the service locks an account after five failures inside the window", async () => {
  const now = new Date("2026-11-08T10:00:00Z");
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const result = await accountLockout.recordFailedLogin("user@example.com", now);
    assert.equal(result.locked, false);
    assert.equal(result.attemptsRemaining, 5 - attempt);
  }
  const fifth = await accountLockout.recordFailedLogin("user@example.com", now);
  assert.equal(fifth.locked, true);
  assert.equal(fifth.retryAfterSeconds, 15 * 60);

  const status = await accountLockout.getLockStatus("USER@example.com ", new Date(now.getTime() + 60_000));
  assert.equal(status.locked, true, "email case and spaces must not bypass the lock");
  assert.equal(status.retryAfterSeconds, 14 * 60);
});

test("a lock expires on its own and a new attempt window starts", async () => {
  const now = new Date("2026-11-08T10:00:00Z");
  for (let i = 0; i < 5; i += 1) await accountLockout.recordFailedLogin("user@example.com", now);
  const later = new Date(now.getTime() + 16 * 60 * 1000);
  assert.deepEqual(await accountLockout.getLockStatus("user@example.com", later), { locked: false });
  const next = await accountLockout.recordFailedLogin("user@example.com", later);
  assert.equal(next.failedCount, 1);
  assert.equal(next.locked, false);
});

test("failures outside the 15-minute window are not added together", async () => {
  const start = new Date("2026-11-08T10:00:00Z");
  for (let i = 0; i < 4; i += 1) await accountLockout.recordFailedLogin("user@example.com", start);
  const later = await accountLockout.recordFailedLogin("user@example.com", new Date(start.getTime() + 20 * 60 * 1000));
  assert.equal(later.failedCount, 1);
  assert.equal(later.locked, false);
});

test("the email address itself is never stored, only a SHA-256 hash", async () => {
  await accountLockout.recordFailedLogin("private.person@example.com");
  const [key] = [...store.keys()];
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify([...store.values()]), /private\.person/);
});

test("the limits can be configured with environment variables", () => {
  process.env.LOGIN_MAX_FAILED_ATTEMPTS = "3";
  process.env.LOGIN_LOCKOUT_MINUTES = "30";
  try {
    assert.deepEqual(accountLockout.settings(), { maxFailedAttempts: 3, windowMs: 15 * 60 * 1000, lockoutMs: 30 * 60 * 1000 });
  } finally {
    delete process.env.LOGIN_MAX_FAILED_ATTEMPTS;
    delete process.env.LOGIN_LOCKOUT_MINUTES;
  }
});

test("login returns 401 four times, then 429 with Retry-After on the fifth wrong password", async () => {
  for (let i = 0; i < 4; i += 1) {
    const res = await request({ email: "victim@example.com", password: "WrongPass1!" });
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { message: "Invalid email or password." });
  }
  const fifth = await request({ email: "victim@example.com", password: "WrongPass1!" });
  assert.equal(fifth.status, 429);
  assert.deepEqual(fifth.body, { message: accountLockout.LOCKED_MESSAGE });
  assert.equal(fifth.headers["retry-after"], "900");
});

test("the correct password is refused while the account is locked", async () => {
  for (let i = 0; i < 5; i += 1) await request({ email: "victim@example.com", password: "WrongPass1!" });
  const res = await request({ email: "victim@example.com", password: "CorrectPass1!" });
  assert.equal(res.status, 429);
  assert.equal(res.headers["set-cookie"], undefined, "no session may be issued while locked");
});

test("a successful login resets the counter", async () => {
  for (let i = 0; i < 4; i += 1) await request({ email: "victim@example.com", password: "WrongPass1!" });
  const ok = await request({ email: "victim@example.com", password: "CorrectPass1!" });
  assert.equal(ok.status, 200);
  assert.equal(store.size, 0);
  const afterReset = await request({ email: "victim@example.com", password: "WrongPass1!" });
  assert.equal(afterReset.status, 401);
});

test("unknown emails lock the same way, so lockout cannot reveal which accounts exist", async () => {
  const responses = [];
  for (let i = 0; i < 5; i += 1) responses.push(await request({ email: "nobody@example.com", password: "WrongPass1!" }));
  assert.deepEqual(responses.map((r) => r.status), [401, 401, 401, 401, 429]);
  assert.deepEqual(responses[4].body, { message: accountLockout.LOCKED_MESSAGE });
});
