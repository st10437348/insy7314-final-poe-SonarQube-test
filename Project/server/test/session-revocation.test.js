// Security feature 2: server-side session revocation with a per-user token version.
const test = require("node:test");
const assert = require("node:assert/strict");
const https = require("https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-jwt-secret-that-is-not-used-in-production";

const app = require("../app");
const User = require("../models/User");
const ApiUsage = require("../models/ApiUsage");
const accountLockout = require("../services/accountLockout");
const { updateAdminUser } = require("../controllers/adminController");
const { createHttpsServer, readSslCredentials } = require("../config/https");

ApiUsage.create = async () => ({});
accountLockout.getLockStatus = async () => ({ locked: false });
accountLockout.recordFailedLogin = async () => ({ locked: false, failedCount: 1 });
accountLockout.clearFailedLogins = async () => {};

const USER_ID = "507f1f77bcf86cd799439011";
const originals = { findById: User.findById, findOne: User.findOne, updateOne: User.updateOne };
let account;
let server;
let port;

const sign = (tv) => jwt.sign({ id: USER_ID, role: "Client", ...(tv === undefined ? {} : { tv }) },
  process.env.JWT_SECRET, { expiresIn: "5m" });

const request = ({ path, method = "GET", body, cookie }) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : undefined;
  const req = https.request({
    hostname: "127.0.0.1", port, path, method, rejectUnauthorized: false,
    headers: {
      ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
      ...(cookie ? { Cookie: `token=${cookie}` } : {})
    }
  }, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null }));
  });
  req.on("error", reject);
  req.end(payload);
});

test.before(async () => {
  server = createHttpsServer(app, readSslCredentials());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

test.after(async () => {
  Object.assign(User, originals);
  await new Promise((resolve) => server.close(resolve));
});

test.beforeEach(() => {
  account = { _id: USER_ID, name: "Test", email: "client@example.com", role: "Client", isActive: true, tokenVersion: 0 };
  User.findById = (id) => ({
    select: async () => (String(id) === USER_ID ? { ...account } : null)
  });
  User.updateOne = async (filter, update) => {
    if (String(filter._id.$eq) === USER_ID) account.tokenVersion += update.$inc.tokenVersion;
    return { modifiedCount: 1 };
  };
});

test("login puts the user's current token version in the JWT", async () => {
  account.tokenVersion = 3;
  account.password = await bcrypt.hash("CorrectPass1!", 4);
  User.findOne = async () => ({ ...account });
  const res = await request({ path: "/api/auth/login", method: "POST", body: { email: "client@example.com", password: "CorrectPass1!" } });
  assert.equal(res.status, 200);
  const token = /token=([^;]+)/.exec(res.headers["set-cookie"].join(";"))[1];
  assert.equal(jwt.decode(token).tv, 3);
});

test("a token with the current version is accepted", async () => {
  const res = await request({ path: "/api/auth/me", cookie: sign(0) });
  assert.notEqual(res.status, 401);
});

test("tokens issued before this feature (no version) still work until the next logout", async () => {
  const res = await request({ path: "/api/auth/me", cookie: sign(undefined) });
  assert.notEqual(res.status, 401);
});

test("logout revokes the token on the server, so a copied token stops working", async () => {
  const stolenCopy = sign(0);

  const logout = await request({ path: "/api/auth/logout", method: "POST", cookie: stolenCopy });
  assert.equal(logout.status, 200);
  assert.match(logout.headers["set-cookie"].join(";"), /token=;/);
  assert.equal(account.tokenVersion, 1);

  const reuse = await request({ path: "/api/auth/me", cookie: stolenCopy });
  assert.equal(reuse.status, 401);
  assert.deepEqual(reuse.body, { message: "Session has ended. Please log in again." });
});

test("logout without a valid token still clears the cookie and revokes nothing", async () => {
  const res = await request({ path: "/api/auth/logout", method: "POST", cookie: "not-a-real-token" });
  assert.equal(res.status, 200);
  assert.equal(account.tokenVersion, 0);
});

test("a revoked token cannot reach role-protected routes either", async () => {
  account.tokenVersion = 2;
  const res = await request({ path: "/api/bookings/my-bookings", cookie: sign(1) });
  assert.equal(res.status, 401);
});

const fakeResponse = () => ({
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

const adminUpdate = async (target, body) => {
  User.findById = async () => target;
  const res = fakeResponse();
  await updateAdminUser(
    { params: { id: USER_ID }, body, user: { id: "507f1f77bcf86cd7994390aa", role: "Admin" } },
    res,
    (error) => { throw error; }
  );
  return res;
};

const editableUser = (overrides = {}) => ({
  _id: USER_ID, name: "Alex", email: "alex@example.com", role: "Client", isActive: true, tokenVersion: 0,
  async save() { return this; },
  ...overrides
});

test("an admin role change ends the user's existing sessions", async () => {
  const target = editableUser();
  const res = await adminUpdate(target, { role: "Freelancer" });
  assert.equal(res.statusCode, 200);
  assert.equal(target.tokenVersion, 1);
});

test("an admin deactivating a user ends their sessions", async () => {
  const target = editableUser();
  await adminUpdate(target, { isActive: false });
  assert.equal(target.tokenVersion, 1);
});

test("editing only profile details does not log the user out", async () => {
  const target = editableUser();
  await adminUpdate(target, { name: "Alex Smith", role: "Client" });
  assert.equal(target.tokenVersion, 0);
});
