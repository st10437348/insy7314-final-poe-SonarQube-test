const test = require("node:test");
const assert = require("node:assert/strict");
const https = require("https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-jwt-secret-that-is-not-used-in-production";

const app = require("../app");
const User = require("../models/User");
const ApiUsage = require("../models/ApiUsage");
const { createHttpsServer, readSslCredentials } = require("../config/https");

let server;
let port;
let originalFindOne;
let originalFind;
let originalSave;
let originalFindById;

// API usage logging writes to MongoDB; stub it so unit tests run without a database.
ApiUsage.create = async () => ({});

// Account lockout is tested in account-lockout.test.js; here it never locks.
const accountLockout = require("../services/accountLockout");
accountLockout.getLockStatus = async () => ({ locked: false });
accountLockout.recordFailedLogin = async () => ({ locked: false, failedCount: 1, attemptsRemaining: 4 });
accountLockout.clearFailedLogins = async () => {};

// The auth middleware loads the user from the database; this fakes an active account.
const mockActiveUser = (role) => {
  User.findById = () => ({
    select: async () => ({ _id: "507f1f77bcf86cd799439011", role, isActive: true })
  });
};

// Send requests through Node's HTTPS client so the encryption layer is tested too.
const request = ({ path, method = "GET", body, headers = {} }) =>
  new Promise((resolve, reject) => {
    const payload = body === undefined
      ? undefined
      : typeof body === "string"
        ? body
        : JSON.stringify(body);

    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        rejectUnauthorized: false,
        headers: {
          ...(payload ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          } : {}),
          ...headers
        }
      },
      (res) => {
        let responseBody = "";
        const encrypted = res.socket.encrypted === true;
        const certificate = res.socket.getPeerCertificate();
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseBody ? JSON.parse(responseBody) : null,
            encrypted,
            certificate
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

test.before(async () => {
  originalFindOne = User.findOne;
  originalFind = User.find;
  originalSave = User.prototype.save;
  originalFindById = User.findById;
  server = createHttpsServer(app, readSslCredentials());

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  port = server.address().port;
});

test.after(async () => {
  User.findOne = originalFindOne;
  User.find = originalFind;
  User.prototype.save = originalSave;
  User.findById = originalFindById;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test.afterEach(() => {
  User.findOne = originalFindOne;
  User.find = originalFind;
  User.prototype.save = originalSave;
  User.findById = originalFindById;
});

test("health endpoint is served over HTTPS", async () => {
  const response = await request({ path: "/" });

  assert.equal(response.status, 200);
  assert.equal(response.encrypted, true);
  assert.equal(response.certificate.subject.CN, "localhost");
  assert.match(response.certificate.subjectaltname, /DNS:localhost/);
  assert.match(response.certificate.subjectaltname, /IP Address:127\.0\.0\.1/);
  assert.deepEqual(response.body, { message: "API Running" });
});

test("unknown routes return a controlled 404 response", async () => {
  const response = await request({ path: "/api/does-not-exist" });

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { message: "Route not found." });
});

test("malformed JSON returns a controlled 400 response", async () => {
  const response = await request({
    path: "/api/auth/login",
    method: "POST",
    body: "{not-valid-json"
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { message: "The request body contains invalid JSON." });
});

test("registration validation does not echo the submitted password", async () => {
  const rejectedPassword = "weakPassword123";
  const response = await request({
    path: "/api/auth/register",
    method: "POST",
    body: {
      name: "Test User",
      email: "test@example.com",
      password: rejectedPassword,
      role: "Client"
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Validation failed.");
  assert.equal(JSON.stringify(response.body).includes(rejectedPassword), false);
  assert.equal(response.body.errors[0].path, "password");
});

test("registration reports all required fields without echoing values", async () => {
  const response = await request({
    path: "/api/auth/register",
    method: "POST",
    body: {}
  });

  const paths = response.body.errors.map((error) => error.path);
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Validation failed.");
  assert.equal(paths.includes("name"), true);
  assert.equal(paths.includes("email"), true);
  assert.equal(paths.includes("password"), true);
});

test("registration rejects non-text field values", async () => {
  const response = await request({
    path: "/api/auth/register",
    method: "POST",
    body: {
      name: { unexpected: "object" },
      email: ["test@example.com"],
      password: 12345678,
      role: { unexpected: "object" }
    }
  });

  const paths = response.body.errors.map((error) => error.path);
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Validation failed.");
  assert.deepEqual(new Set(paths), new Set(["name", "email", "password", "role"]));
});

test("registration hashes a valid password before saving", async () => {
  const password = "SecurePass1!";
  let storedPassword;

  User.findOne = async () => null;
  User.prototype.save = async function saveForTest() {
    storedPassword = this.password;
    return this;
  };

  const response = await request({
    path: "/api/auth/register",
    method: "POST",
    body: {
      name: "Test User",
      email: "register@example.com",
      password,
      role: "Client"
    }
  });

  assert.equal(response.status, 201);
  assert.equal(await bcrypt.compare(password, storedPassword), true);
  assert.equal(JSON.stringify(response.body).includes(storedPassword), false);
  assert.equal("password" in response.body.user, false);
});

test("registration rejects a duplicate email", async () => {
  let filter;
  User.findOne = async (query) => {
    filter = query;
    return { _id: "507f1f77bcf86cd799439011" };
  };

  const response = await request({
    path: "/api/auth/register",
    method: "POST",
    body: {
      name: "Duplicate User",
      email: "duplicate@example.com",
      password: "SecurePass1!",
      role: "Client"
    }
  });

  assert.equal(response.status, 409);
  assert.deepEqual(filter, { email: { $eq: "duplicate@example.com" } });
  assert.deepEqual(response.body, { message: "User with this email already exists." });
});

test("a duplicate detected while saving receives a controlled 409 response", async () => {
  User.findOne = async () => null;
  User.prototype.save = async function rejectDuplicateSave() {
    const error = new Error("internal duplicate index details");
    error.code = 11000;
    throw error;
  };

  const response = await request({
    path: "/api/auth/register",
    method: "POST",
    body: {
      name: "Race Condition User",
      email: "race@example.com",
      password: "SecurePass1!",
      role: "Client"
    }
  });

  assert.equal(response.status, 409);
  assert.deepEqual(response.body, {
    message: "A record with those details already exists."
  });
  assert.equal(JSON.stringify(response.body).includes("index"), false);
});

test("login rejects invalid credentials without revealing which field was wrong", async () => {
  User.findOne = async () => null;

  const response = await request({
    path: "/api/auth/login",
    method: "POST",
    body: { email: "unknown@example.com", password: "Password1!" }
  });

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { message: "Invalid email or password." });
});

test("login sets the JWT in a secure httpOnly cookie for valid credentials", async () => {
  const password = "Password1!";
  User.findOne = async () => ({
    _id: "507f1f77bcf86cd799439011",
    name: "Test User",
    email: "test@example.com",
    role: "Client",
    isActive: true,
    password: await bcrypt.hash(password, 4)
  });

  const response = await request({
    path: "/api/auth/login",
    method: "POST",
    body: { email: "test@example.com", password }
  });

  const cookie = (response.headers["set-cookie"] || []).join(";");
  assert.equal(response.status, 200);
  assert.match(cookie, /token=[^;]+/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  // The token is never exposed to JavaScript through the response body.
  assert.equal("token" in response.body, false);
  assert.equal("password" in response.body.user, false);
});

test("database failures do not expose internal details", async () => {
  User.findOne = async () => {
    throw new Error("mongodb://admin:secret@internal-host/private-db");
  };

  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const response = await request({
      path: "/api/auth/login",
      method: "POST",
      body: { email: "test@example.com", password: "Password1!" }
    });

    assert.equal(response.status, 500);
    assert.deepEqual(response.body, { message: "An unexpected server error occurred." });
    assert.equal(JSON.stringify(response.body).includes("internal-host"), false);
  } finally {
    console.error = originalConsoleError;
  }
});

test("oversized JSON receives a controlled response", async () => {
  const response = await request({
    path: "/api/auth/login",
    method: "POST",
    body: JSON.stringify({
      email: "test@example.com",
      password: `Password1!${"x".repeat(110000)}`
    })
  });

  assert.equal(response.status, 413);
  assert.deepEqual(response.body, { message: "The request body is too large." });
});

test("protected routes reject requests without a JWT", async () => {
  const response = await request({ path: "/api/users" });

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { message: "Not authorized, no token provided." });
});

test("protected routes reject malformed and expired JWTs", async () => {
  const expiredToken = jwt.sign(
    { id: "507f1f77bcf86cd799439011", role: "Client" },
    process.env.JWT_SECRET,
    { expiresIn: -1 }
  );
  const forgedToken = jwt.sign(
    { id: "507f1f77bcf86cd799439011", role: "Admin" },
    "attacker-guessed-secret"
  );

  for (const token of ["not-a-valid-token", expiredToken, forgedToken]) {
    const response = await request({
      path: "/api/users",
      headers: { Cookie: `token=${token}` }
    });

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {
      message: "Not authorized, invalid or expired token."
    });
  }
});

test("protected routes accept a valid JWT cookie for an authorised role", async () => {
  mockActiveUser("Admin");
  User.find = () => ({ select: async () => [] });
  const token = jwt.sign(
    { id: "507f1f77bcf86cd799439011", role: "Admin" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  const response = await request({
    path: "/api/users",
    headers: { Cookie: `token=${token}` }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, []);
});

test("admin user deletion route deactivates an account and revokes its sessions", async () => {
  const adminId = "507f1f77bcf86cd799439011";
  const targetId = "507f1f77bcf86cd799439012";
  let saved = false;
  const target = {
    _id: targetId, isActive: true, tokenVersion: 2,
    async save() { saved = true; return this; }
  };
  User.findById = (id) => id === adminId
    ? { select: async () => ({ _id: adminId, role: "Admin", isActive: true }) }
    : Promise.resolve(id === targetId ? target : null);
  const token = jwt.sign({ id: adminId, role: "Admin" }, process.env.JWT_SECRET);

  const response = await request({
    path: `/api/admin/users/${targetId}`, method: "DELETE",
    headers: { Cookie: `token=${token}` }
  });

  assert.equal(response.status, 200);
  assert.equal(saved, true);
  assert.equal(target.isActive, false);
  assert.equal(target.tokenVersion, 3);
});

test("a valid JWT for the wrong role receives 403 Forbidden", async () => {
  mockActiveUser("Client");
  const token = jwt.sign(
    { id: "507f1f77bcf86cd799439011", role: "Client" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  const response = await request({
    path: "/api/users",
    headers: { Cookie: `token=${token}` }
  });

  assert.equal(response.status, 403);
  assert.deepEqual(response.body, {
    message: "You do not have permission to perform this action."
  });
});
