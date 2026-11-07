const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { updateAdminUser } = require('../controllers/adminController');

const callUpdate = async (email) => {
  const result = { status: 200, body: null };
  const response = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; }
  };
  await updateAdminUser(
    { params: { id: '64b000000000000000000001' }, body: { email }, user: { id: '64b000000000000000000002' } },
    response,
    (error) => { throw error; }
  );
  return result;
};

test('admin user updates reject malformed email without querying MongoDB', async () => {
  const originalFindById = User.findById;
  User.findById = () => { throw new Error('Invalid email reached the database'); };
  try {
    for (const email of [
      { $ne: null },
      'a'.repeat(255) + '@example.com',
      'name @example.com',
      'example.com',
      '@example.com',
      'a@@example.com',
      'a@example',
      'a@.com',
      'a@example.'
    ]) {
      const result = await callUpdate(email);
      assert.equal(result.status, 400, String(email));
      assert.equal(result.body.message, 'Invalid user details.');
    }
  } finally {
    User.findById = originalFindById;
  }
});

test('admin user updates accept a valid email and normalize it', async () => {
  const originalFindById = User.findById;
  const user = {
    _id: '64b000000000000000000001',
    name: 'Test User', role: 'Client', bio: '', skills: [], isActive: true,
    async save() { return this; }
  };
  User.findById = async () => user;
  try {
    const result = await callUpdate('Person@Example.com');
    assert.equal(result.status, 200);
    assert.equal(user.email, 'person@example.com');
    assert.equal(result.body.user.email, 'person@example.com');
  } finally {
    User.findById = originalFindById;
  }
});
