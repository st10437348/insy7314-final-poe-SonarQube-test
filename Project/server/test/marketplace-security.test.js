// Part 2 backend unit tests: RBAC, ownership, booking/transaction logic,
// input sanitisation, security headers and rate limiting.
// Database calls are replaced with stubs so the tests run without MongoDB.
const test = require("node:test");
const assert = require("node:assert/strict");
const https = require("https");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-jwt-secret-that-is-not-used-in-production";

const app = require("../app");
const User = require("../models/User");
const Gig = require("../models/Gig");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const ApiUsage = require("../models/ApiUsage");
const { createHttpsServer, readSslCredentials } = require("../config/https");

const IDS = {
  client: "64b000000000000000000001",
  freelancer: "64b000000000000000000002",
  otherFreelancer: "64b000000000000000000003",
  admin: "64b000000000000000000004",
  gig: "64b0000000000000000000a1",
  booking: "64b0000000000000000000b1",
  transaction: "64b0000000000000000000c1"
};

const originals = {
  userFindById: User.findById,
  gigCreate: Gig.create,
  gigFind: Gig.find,
  gigFindOne: Gig.findOne,
  gigFindOneAndUpdate: Gig.findOneAndUpdate,
  gigUpdateOne: Gig.updateOne,
  bookingCreate: Booking.create,
  bookingFindById: Booking.findById,
  bookingDistinct: Booking.distinct,
  bookingExists: Booking.exists,
  transactionCreate: Transaction.create,
  transactionFindById: Transaction.findById,
  transactionUpdateOne: Transaction.updateOne
};

ApiUsage.create = async () => ({});

let server;
let port;

const request = ({ path, method = "GET", body, headers = {} }) =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        rejectUnauthorized: false,
        headers: {
          ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers
        }
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        }));
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

// Signs a JWT and makes the auth middleware find an active user with that role.
const loginAs = (role, id) => {
  User.findById = () => ({ select: async () => ({ _id: id, role, isActive: true }) });
  return { Cookie: `token=${jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "5m" })}` };
};

const validGig = {
  title: "Logo Design",
  description: "Professional logo design for small businesses.",
  category: "Design",
  price: 1000,
  deliveryDays: 3,
  location: { address: "Cape Town" }
};

const futureDate = () => new Date(Date.now() + 7 * 86400000).toISOString();

test.before(async () => {
  server = createHttpsServer(app, readSslCredentials());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
});

test.beforeEach(() => {
  Booking.distinct = async () => [];
  Booking.exists = async () => null;
});

test.afterEach(() => {
  User.findById = originals.userFindById;
  Gig.create = originals.gigCreate;
  Gig.find = originals.gigFind;
  Gig.findOne = originals.gigFindOne;
  Gig.findOneAndUpdate = originals.gigFindOneAndUpdate;
  Gig.updateOne = originals.gigUpdateOne;
  Booking.create = originals.bookingCreate;
  Booking.findById = originals.bookingFindById;
  Booking.distinct = originals.bookingDistinct;
  Booking.exists = originals.bookingExists;
  Transaction.create = originals.transactionCreate;
  Transaction.findById = originals.transactionFindById;
  Transaction.updateOne = originals.transactionUpdateOne;
});

// ---------- Security headers ----------

test("Helmet security headers and a restrictive CSP are sent", async () => {
  const res = await request({ path: "/" });
  const csp = res.headers["content-security-policy"];

  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /script-src 'self'/);
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.ok(res.headers["strict-transport-security"]);
  assert.ok(res.headers["x-frame-options"]);
  assert.equal(res.headers["x-powered-by"], undefined);
});

test("state-changing requests from a foreign origin are rejected (CSRF defence)", async () => {
  const res = await request({
    path: "/api/gigs",
    method: "POST",
    body: validGig,
    headers: { ...loginAs("Freelancer", IDS.freelancer), Origin: "https://evil.example.com" }
  });
  assert.equal(res.status, 403);
  assert.deepEqual(res.body, { message: "Request origin is not allowed." });
});

// ---------- RBAC ----------

test("unauthenticated users cannot create gigs (401)", async () => {
  const res = await request({ path: "/api/gigs", method: "POST", body: validGig });
  assert.equal(res.status, 401);
});

test("a Client cannot create a gig (403)", async () => {
  const res = await request({
    path: "/api/gigs", method: "POST", body: validGig, headers: loginAs("Client", IDS.client)
  });
  assert.equal(res.status, 403);
});

test("a Freelancer can create a gig and it is owned by the logged-in freelancer", async () => {
  let saved;
  Gig.create = async (doc) => { saved = doc; return { _id: IDS.gig, ...doc }; };

  const res = await request({
    path: "/api/gigs",
    method: "POST",
    // Attempt to spoof the owner - the server must ignore this.
    body: { ...validGig, freelancerId: IDS.otherFreelancer },
    headers: loginAs("Freelancer", IDS.freelancer)
  });

  assert.equal(res.status, 201);
  assert.equal(saved.freelancerId, IDS.freelancer);
});

test("a Freelancer cannot update a gig they do not own", async () => {
  let filter;
  Gig.findOneAndUpdate = async (f) => { filter = f; return null; };

  const res = await request({
    path: `/api/gigs/${IDS.gig}`,
    method: "PUT",
    body: validGig,
    headers: loginAs("Freelancer", IDS.otherFreelancer)
  });

  assert.equal(res.status, 404);
  assert.equal(filter.freelancerId, IDS.otherFreelancer);
});

test("a Freelancer cannot delete a gig they do not own", async () => {
  let filter;
  Gig.findOneAndUpdate = async (f) => { filter = f; return null; };

  const res = await request({
    path: `/api/gigs/${IDS.gig}`,
    method: "DELETE",
    headers: loginAs("Freelancer", IDS.otherFreelancer)
  });

  assert.equal(res.status, 404);
  assert.equal(filter.freelancerId, IDS.otherFreelancer);
});

test("a Freelancer cannot create a booking (403)", async () => {
  const res = await request({
    path: "/api/bookings",
    method: "POST",
    body: { gigId: IDS.gig, bookingDate: futureDate() },
    headers: loginAs("Freelancer", IDS.freelancer)
  });
  assert.equal(res.status, 403);
});

test("Clients and Freelancers cannot reach admin routes (403)", async () => {
  for (const [role, id] of [["Client", IDS.client], ["Freelancer", IDS.freelancer]]) {
    const res = await request({ path: "/api/admin", headers: loginAs(role, id) });
    assert.equal(res.status, 403);
  }
});

test("a Client cannot view freelancer income (403)", async () => {
  const res = await request({ path: "/api/income", headers: loginAs("Client", IDS.client) });
  assert.equal(res.status, 403);
});

test("users cannot view a transaction that is not theirs", async () => {
  const tx = {
    clientId: { _id: IDS.client },
    freelancerId: { _id: IDS.freelancer }
  };
  const chain = { populate() { return this; }, then: (r) => r(tx) };
  Transaction.findById = () => chain;

  const res = await request({
    path: `/api/transactions/${IDS.transaction}`,
    headers: loginAs("Freelancer", IDS.otherFreelancer)
  });
  assert.equal(res.status, 403);
});

// ---------- Booking + transaction ----------

test("a booking uses the gig price from the database and creates a transaction", async () => {
  let booking;
  let transaction;
  let gigFilter;
  Gig.findOne = async (filter) => {
    gigFilter = filter;
    return {
    _id: IDS.gig, freelancerId: IDS.freelancer, price: 1000, location: { address: "Cape Town" }
    };
  };
  Booking.create = async (doc) => { booking = { _id: IDS.booking, ...doc }; return booking; };
  Transaction.create = async (doc) => { transaction = doc; return doc; };

  const res = await request({
    path: "/api/bookings",
    method: "POST",
    // A tampered price must be ignored.
    body: { gigId: IDS.gig, bookingDate: futureDate(), agreedPrice: 1 },
    headers: loginAs("Client", IDS.client)
  });

  assert.equal(res.status, 201);
  assert.equal(gigFilter._id.toHexString(), IDS.gig);
  assert.equal(booking.agreedPrice, 1000);
  assert.equal(booking.clientId, IDS.client);
  assert.equal(transaction.amount, 1000);
  assert.equal(transaction.platformFee, 100);
  assert.equal(transaction.taxAmount, 0);
  assert.equal(transaction.freelancerAmount, 900);
  assert.equal(transaction.freelancerId, IDS.freelancer);
  assert.equal(transaction.status, "pending");
});

test("a gig with a pending or accepted booking is hidden and cannot be booked directly", async () => {
  let availabilityFilter;
  let marketplaceFilter;
  Booking.distinct = async (field, filter) => {
    assert.equal(field, "gigId");
    availabilityFilter = filter;
    return [IDS.gig];
  };
  const availableId = "64b0000000000000000000a2";
  Gig.find = (filter) => {
    marketplaceFilter = filter;
    return {
      populate() { return this; },
      sort: async () => [
        { _id: IDS.gig, title: "Booked gig", category: "Design", price: 100 },
        { _id: availableId, title: "Available gig", category: "Design", price: 100 }
      ]
    };
  };

  const list = await request({ path: "/api/gigs" });
  assert.equal(list.status, 200);
  assert.deepEqual(availabilityFilter, { status: { $in: ["pending", "accepted", "in_progress", "completed"] } });
  assert.deepEqual(marketplaceFilter, { status: "active", isActive: true });
  assert.deepEqual(list.body.gigs.map((gig) => gig._id), [availableId]);

  Booking.exists = async () => ({ _id: IDS.booking });
  Gig.findOneAndUpdate = () => { throw new Error("Unavailable gig must not be loaded"); };
  const detail = await request({ path: `/api/gigs/${IDS.gig}` });
  assert.equal(detail.status, 404);

  Gig.findOne = async () => ({
    _id: IDS.gig, freelancerId: IDS.freelancer, price: 1000,
    location: { address: "Cape Town" }
  });
  for (const clientId of [IDS.client, IDS.otherFreelancer]) {
    const booking = await request({
      path: "/api/bookings", method: "POST",
      body: { gigId: IDS.gig, bookingDate: futureDate() },
      headers: loginAs("Client", clientId)
    });
    assert.equal(booking.status, 409);
    assert.match(booking.body.message, /already has a booking/);
  }
});

test("simultaneous bookings return a conflict when the unique reservation index rejects one", async () => {
  const reservationIndex = Booking.schema.indexes().find(([fields]) => fields.gigId === 1);
  assert.equal(reservationIndex[1].unique, true);
  assert.deepEqual(reservationIndex[1].partialFilterExpression, {
    status: { $in: ["pending", "accepted", "in_progress"] }
  });
  Gig.findOne = async () => ({
    _id: IDS.gig, freelancerId: IDS.freelancer, price: 1000,
    location: { address: "Cape Town" }
  });
  Booking.create = async () => {
    const error = new Error("duplicate key");
    error.code = 11000;
    throw error;
  };

  const response = await request({
    path: "/api/bookings", method: "POST",
    body: { gigId: IDS.gig, bookingDate: futureDate() },
    headers: loginAs("Client", IDS.client)
  });
  assert.equal(response.status, 409);
  assert.match(response.body.message, /already has a booking/);
});

test("completing a booking permanently marks its gig completed", async () => {
  const booking = {
    _id: IDS.booking, gigId: IDS.gig, clientId: IDS.client,
    freelancerId: IDS.freelancer, status: "in_progress",
    async save() { return this; }
  };
  Booking.findById = async () => booking;
  let gigUpdate;
  Gig.updateOne = async (filter, update) => { gigUpdate = { filter, update }; return { modifiedCount: 1 }; };
  let transactionStatus;
  Transaction.updateOne = async (_filter, update) => { transactionStatus = update.status; };

  const response = await request({
    path: `/api/bookings/${IDS.booking}/status`, method: "PATCH",
    body: { status: "completed" },
    headers: loginAs("Freelancer", IDS.freelancer)
  });
  assert.equal(response.status, 200);
  assert.equal(booking.status, "completed");
  assert.equal(transactionStatus, "completed");
  assert.equal(gigUpdate.filter._id.toString(), IDS.gig);
  assert.deepEqual(gigUpdate.update, { $set: { status: "completed", isActive: false } });
});

test("booking participants can view a completed gig while unrelated users cannot", async () => {
  Gig.findOne = () => ({ populate: async () => ({
    _id: IDS.gig, title: "Logo Design", status: "completed", isActive: false,
    freelancerId: { _id: IDS.freelancer, name: "Alex" }
  }) });
  Booking.exists = async (filter) => filter.$or?.some(({ clientId }) => clientId === IDS.client)
    ? { _id: IDS.booking } : null;

  const path = `/api/gigs/history/${IDS.gig}`;
  assert.equal((await request({ path })).status, 401);
  assert.equal((await request({ path, headers: loginAs("Client", IDS.otherFreelancer) })).status, 403);
  const client = await request({ path, headers: loginAs("Client", IDS.client) });
  assert.equal(client.status, 200);
  assert.equal(client.body.gig.status, "completed");
  assert.equal((await request({ path, headers: loginAs("Freelancer", IDS.freelancer) })).status, 200);
});

test("completed gigs cannot be edited or deleted by their freelancer", async () => {
  let updateFilter;
  Gig.findOneAndUpdate = async (filter) => { updateFilter = filter; return null; };
  const headers = loginAs("Freelancer", IDS.freelancer);
  const edit = await request({
    path: `/api/gigs/${IDS.gig}`, method: "PUT",
    body: { ...validGig, status: "active" }, headers
  });
  assert.equal(edit.status, 404);
  assert.deepEqual(updateFilter.status.$in, ["active", "paused"]);

  const remove = await request({ path: `/api/gigs/${IDS.gig}`, method: "DELETE", headers });
  assert.equal(remove.status, 404);
  assert.equal(updateFilter.status.$ne, "completed");
});

test("previously completed bookings are synchronized to permanent gig status", async () => {
  const { syncCompletedGigs } = require("../services/gigAvailability");
  Booking.distinct = async (field, filter) => {
    assert.equal(field, "gigId");
    assert.deepEqual(filter, { status: "completed" });
    return [IDS.gig, { $ne: null }];
  };
  const updates = [];
  Gig.updateOne = async (filter, update) => { updates.push({ filter, update }); };
  await syncCompletedGigs();
  assert.equal(updates.length, 1);
  assert.equal(updates[0].filter._id.toString(), IDS.gig);
  assert.deepEqual(updates[0].filter.status.$nin, ["completed", "deleted"]);
  assert.deepEqual(updates[0].update, { $set: { status: "completed", isActive: false } });
});

test("a booking with an invalid gig ID or past date is rejected (400)", async () => {
  const headers = loginAs("Client", IDS.client);
  for (const body of [
    { gigId: "not-an-id", bookingDate: futureDate() },
    { gigId: IDS.gig, bookingDate: "2000-01-01" },
    { gigId: { $gt: "" }, bookingDate: futureDate() }
  ]) {
    const res = await request({ path: "/api/bookings", method: "POST", body, headers });
    assert.equal(res.status, 400);
  }
});

// ---------- Validation / sanitisation ----------

test("gig input containing HTML/script tags is rejected", async () => {
  const res = await request({
    path: "/api/gigs",
    method: "POST",
    body: { ...validGig, title: "<script>alert('xss')</script>" },
    headers: loginAs("Freelancer", IDS.freelancer)
  });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { message: "Invalid gig details." });
});

test("gig input with wrong types (NoSQL injection objects) is rejected", async () => {
  const res = await request({
    path: "/api/gigs",
    method: "POST",
    body: { ...validGig, price: { $gt: 0 }, category: { $ne: null } },
    headers: loginAs("Freelancer", IDS.freelancer)
  });
  assert.equal(res.status, 400);
});

test("gig search treats request values as literal filters outside MongoDB", async () => {
  let filter;
  Gig.find = (baseFilter) => {
    filter = baseFilter;
    return {
      populate() { return this; },
      sort: async () => [
        { _id: IDS.gig, title: "(a+)+ logo", category: "Design", price: 150 },
        { _id: "64b0000000000000000000a2", title: "aaaa", category: "Design", price: 150 },
        { _id: "64b0000000000000000000a3", title: "(a+)+ writing", category: "Writing", price: 150 }
      ]
    };
  };

  const res = await request({
    path: "/api/gigs?search=%28a%2B%29%2B&category=Design&minPrice=100&maxPrice=200"
  });

  assert.equal(res.status, 200);
  assert.deepEqual(filter, { status: "active", isActive: true });
  assert.deepEqual(res.body.gigs.map((gig) => gig.title), ["(a+)+ logo"]);

  const injected = await request({
    path: "/api/gigs?search%5B%24ne%5D=x&category%5B%24ne%5D=x&minPrice%5B%24gt%5D=0"
  });
  assert.equal(injected.status, 200);
  assert.deepEqual(filter, { status: "active", isActive: true });
  assert.equal(injected.body.gigs.length, 3);
});

test("invalid record IDs are rejected before reaching the database", async () => {
  const res = await request({ path: "/api/gigs/not-a-valid-id" });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { message: "Invalid record ID." });
});

// ---------- Rate limiting (kept last: it exhausts the limits) ----------

test("auth endpoints advertise their rate limit and return 429 when exceeded", async () => {
  let res;
  for (let i = 0; i < 31; i += 1) {
    res = await request({ path: "/api/auth/login", method: "POST", body: {} });
    if (i === 0) assert.match(res.headers["ratelimit-policy"], /30;w=900/);
  }
  assert.equal(res.status, 429);
  assert.deepEqual(res.body, { message: "Too many authentication attempts. Try again later." });
});

test("the booking endpoint returns 429 after 20 bookings in an hour", async () => {
  let res;
  for (let i = 0; i < 21; i += 1) {
    res = await request({ path: "/api/bookings", method: "POST", body: {} });
  }
  assert.equal(res.status, 429);
  assert.deepEqual(res.body, { message: "Booking limit reached. Try again later." });
});
