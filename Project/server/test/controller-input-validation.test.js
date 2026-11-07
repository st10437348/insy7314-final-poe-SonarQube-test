const test = require('node:test');
const assert = require('node:assert/strict');
const { registerUser } = require('../controllers/authController');
const { createBooking } = require('../controllers/bookingController');

const response = () => {
  const result = { status: 200, body: null };
  return {
    result,
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; }
  };
};

test('registration controller rejects an object email even without route validation', async () => {
  const res = response();
  await registerUser(
    { body: { name: 'Test User', email: { $ne: null }, password: 'Password123!', role: 'Client' } },
    res,
    (error) => { throw error; }
  );
  assert.equal(res.result.status, 400);
  assert.equal(res.result.body.message, 'A valid email is required.');
});

test('booking controller rejects an object gig ID even without route validation', async () => {
  const res = response();
  await createBooking(
    { body: { gigId: { $ne: null } }, user: { _id: '64b000000000000000000001' } },
    res,
    (error) => { throw error; }
  );
  assert.equal(res.result.status, 400);
  assert.equal(res.result.body.message, 'Choose a valid gig and booking date.');
});
