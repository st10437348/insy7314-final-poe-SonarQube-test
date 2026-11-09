const test = require('node:test');
const assert = require('node:assert/strict');
const Gig = require('../models/Gig');
const User = require('../models/User');
const Booking = require('../models/Booking');
const ApiUsage = require('../models/ApiUsage');
const Transaction = require('../models/Transaction');
const admin = require('../controllers/adminController');

const methods = [
  [Gig, 'countDocuments'], [Gig, 'find'], [Gig, 'findByIdAndUpdate'],
  [Gig, 'findOneAndUpdate'], [Gig, 'exists'], [Gig, 'updateOne'],
  [User, 'countDocuments'], [User, 'find'], [User, 'findById'],
  [Booking, 'countDocuments'], [Booking, 'find'], [Booking, 'findById'],
  [ApiUsage, 'countDocuments'], [ApiUsage, 'find'],
  [Transaction, 'aggregate'], [Transaction, 'updateOne']
];
const originals = methods.map(([model, name]) => model[name]);
test.afterEach(() => methods.forEach(([model, name], index) => { model[name] = originals[index]; }));

const call = async (handler, req = {}) => {
  const result = { status: 200, body: null, cookie: null };
  const res = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; },
    clearCookie(name, options) { result.cookie = { name, options }; return this; }
  };
  await handler(req, res, (error) => { throw error; });
  return result;
};

test('admin dashboard and analytics summarize live counts and completed platform fees', async () => {
  User.countDocuments = async (filter) => filter?.role === 'Freelancer' ? 3 : filter?.role === 'Client' ? 5 : 8;
  Gig.countDocuments = async () => 4;
  Booking.countDocuments = async (filter) => filter?.status === 'completed' ? 2 : 7;
  ApiUsage.countDocuments = async () => 19;
  Transaction.aggregate = async () => [{ totalRevenue: 120 }];

  const dashboard = await call(admin.getAdminDashboard);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.dashboard.totalUsers, 8);
  assert.equal(dashboard.body.dashboard.platformRevenue, 120);
  assert.equal(dashboard.body.dashboard.completedBookings, 2);

  const analytics = await call(admin.getAdminAnalytics);
  assert.equal(analytics.status, 200);
  assert.equal(analytics.body.analytics[0].activeUsers, 8);
  assert.equal(analytics.body.analytics[0].apiRequests, 19);
  assert.equal(analytics.body.analytics[0].revenue, 120);
});

test('API usage aggregates successful and failed requests by date, method and endpoint', async () => {
  const date = new Date('2026-11-07T10:00:00Z');
  ApiUsage.find = () => ({ sort() { return this; }, limit: async () => [
    { date, method: 'GET', endpoint: '/api/gigs', successful: true },
    { date, method: 'GET', endpoint: '/api/gigs', successful: false },
    { date, method: 'POST', endpoint: '/api/gigs', successful: true }
  ] });
  const result = await call(admin.getAdminApiUsage);
  assert.equal(result.status, 200);
  assert.equal(result.body.usage.length, 2);
  const gets = result.body.usage.find((row) => row.method === 'GET');
  assert.deepEqual([gets.requests, gets.successful, gets.failed], [2, 1, 1]);
});

test('admin user lookup and update protect missing accounts and own Admin role', async () => {
  User.find = () => ({ select() { return this; }, sort: async () => [{ name: 'Alex' }] });
  assert.equal((await call(admin.getAdminUsers)).body.users[0].name, 'Alex');
  User.findById = () => ({ select: async () => null });
  assert.equal((await call(admin.getAdminUser, { params: { id: 'u1' } })).status, 404);

  const account = {
    _id: 'u1', name: 'Alex', email: 'alex@example.com', role: 'Admin',
    async save() { return this; }
  };
  User.findById = async () => account;
  const blocked = await call(admin.updateAdminUser, {
    params: { id: 'u1' }, user: { id: 'u1' }, body: { role: 'Client' }
  });
  assert.equal(blocked.status, 400);
  assert.equal(account.role, 'Admin');

  const updated = await call(admin.updateAdminUser, {
    params: { id: 'u1' }, user: { id: 'admin2' },
    body: { name: ' Alex Smith ', email: 'Alex@Example.com', role: 'Freelancer', bio: 'Designer', skills: ['Design'], isActive: false }
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.user.name, 'Alex Smith');
  assert.equal(updated.body.user.email, 'alex@example.com');
  assert.equal(updated.body.user.isActive, false);
});

test('admin booking updates synchronize transaction state', async () => {
  const booking = { _id: 'b1', gigId: '64b0000000000000000000a1', status: 'pending', async save() { return this; } };
  Booking.findById = async () => booking;
  const updates = [];
  Transaction.updateOne = async (_filter, value) => { updates.push(value.status); };
  let completedGig;
  Gig.updateOne = async (_filter, update) => { completedGig = update; };

  assert.equal((await call(admin.updateAdminBooking, { params: { id: 'b1' }, body: { status: 'invalid' } })).status, 400);
  for (const [status, transactionStatus] of [['completed', 'completed'], ['cancelled', 'refunded'], ['accepted', 'pending']]) {
    booking.status = 'pending';
    const result = await call(admin.updateAdminBooking, { params: { id: 'b1' }, body: { status } });
    assert.equal(result.status, 200);
    assert.equal(booking.status, status);
    assert.equal(updates.at(-1), transactionStatus);
  }
  assert.deepEqual(completedGig, { $set: { status: 'completed', isActive: false } });
  booking.status = 'completed';
  assert.equal((await call(admin.updateAdminBooking, { params: { id: 'b1' }, body: { status: 'pending' } })).status, 409);
  Booking.findById = async () => null;
  assert.equal((await call(admin.updateAdminBooking, { params: { id: 'missing' }, body: { status: 'completed' } })).status, 404);
});

test('admin gig moderation updates visibility and soft deletes gigs', async () => {
  Gig.find = () => ({ populate: async () => [{ title: 'Logo design' }] });
  assert.equal((await call(admin.getAllAdminGigs)).body.gigs[0].title, 'Logo design');

  const changes = [];
  Gig.findOneAndUpdate = async (_filter, update) => {
    changes.push(update);
    return { _id: 'g1', ...update };
  };
  const paused = await call(admin.updateAdminGigStatus, { params: { id: 'g1' }, body: { status: 'paused' } });
  assert.equal(paused.status, 200);
  assert.equal(paused.body.gig.isActive, false);
  assert.equal((await call(admin.deleteAdminGig, { params: { id: 'g1' } })).status, 200);
  assert.deepEqual(changes.at(-1), { status: 'deleted', isActive: false });

  Gig.findOneAndUpdate = async () => null;
  Gig.exists = async () => null;
  assert.equal((await call(admin.updateAdminGigStatus, { params: { id: 'missing' }, body: { status: 'active' } })).status, 404);
  assert.equal((await call(admin.deleteAdminGig, { params: { id: 'missing' } })).status, 404);
  Gig.exists = async () => ({ _id: 'g1' });
  assert.equal((await call(admin.updateAdminGigStatus, { params: { id: 'g1' }, body: { status: 'active' } })).status, 409);
  assert.equal((await call(admin.deleteAdminGig, { params: { id: 'g1' } })).status, 409);
});

test('session endpoint returns basic identity and logout clears the secure cookie', async () => {
  User.findById = () => ({ select: async () => ({ _id: 'u1', name: 'Alex', email: 'alex@example.com', role: 'Client' }) });
  const current = await call(admin.getCurrentUser, { user: { id: 'u1' } });
  assert.equal(current.body.user.role, 'Client');
  const loggedOut = await call(admin.logoutUser);
  assert.equal(loggedOut.status, 200);
  assert.equal(loggedOut.cookie.name, 'token');
  assert.equal(loggedOut.cookie.options.httpOnly, true);
});
