const test = require('node:test');
const assert = require('node:assert/strict');
const Transaction = require('../models/Transaction');
const controller = require('../controllers/transactionController');

const originals = { find: Transaction.find, findById: Transaction.findById };
test.afterEach(() => {
  Transaction.find = originals.find;
  Transaction.findById = originals.findById;
});

const call = async (handler, req) => {
  const result = { status: 200, body: null };
  const res = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; }
  };
  await handler(req, res, (error) => { throw error; });
  return result;
};

const queryFor = (value) => ({
  populate() { return this; },
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); }
});

test('transaction history includes records for the signed-in client or freelancer', async () => {
  let filter;
  Transaction.find = (value) => {
    filter = value;
    return { populate() { return this; }, sort: async () => [{ _id: 't1' }] };
  };
  const result = await call(controller.getMyTransactions, { user: { id: 'u1' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.count, 1);
  assert.deepEqual(filter, { $or: [{ clientId: 'u1' }, { freelancerId: 'u1' }] });
});

test('invoice details enforce participant access', async () => {
  const record = { _id: 't1', clientId: { _id: 'u1' }, freelancerId: { _id: 'u2' } };
  Transaction.findById = () => queryFor(record);
  const stranger = await call(controller.getTransactionById, { params: { id: 't1' }, user: { id: 'u3', role: 'Client' } });
  assert.equal(stranger.status, 403);
  const client = await call(controller.getTransactionById, { params: { id: 't1' }, user: { id: 'u1', role: 'Client' } });
  assert.equal(client.status, 200);
  assert.equal(client.body.transaction._id, 't1');
  const admin = await call(controller.getTransactionById, { params: { id: 't1' }, user: { id: 'u3', role: 'Admin' } });
  assert.equal(admin.status, 200);
  Transaction.findById = () => queryFor(null);
  assert.equal((await call(controller.getTransactionById, { params: { id: 'missing' }, user: { id: 'u1', role: 'Client' } })).status, 404);
});

test('payout requires an unpaid completed booking and records the payout date', async () => {
  const record = {
    status: 'pending', bookingId: { status: 'completed' }, payoutDate: null,
    async save() { return this; }
  };
  Transaction.findById = () => queryFor(record);
  assert.equal((await call(controller.processPayout, { params: { id: 't1' } })).status, 409);
  record.status = 'completed';
  const paid = await call(controller.processPayout, { params: { id: 't1' } });
  assert.equal(paid.status, 200);
  assert.ok(record.payoutDate instanceof Date);
  assert.equal((await call(controller.processPayout, { params: { id: 't1' } })).status, 409);
  Transaction.findById = () => queryFor(null);
  assert.equal((await call(controller.processPayout, { params: { id: 'missing' } })).status, 404);
});
