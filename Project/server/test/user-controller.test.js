const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const controller = require('../controllers/userController');

const accountId = '64b000000000000000000001';
const adminId = '64b000000000000000000002';
const originals = { find: User.find, findById: User.findById, save: User.prototype.save };

test.afterEach(() => {
  User.find = originals.find;
  User.findById = originals.findById;
  User.prototype.save = originals.save;
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

test('admin user listing returns only selected account data', async () => {
  let selected;
  User.find = () => ({ select: async (fields) => {
    selected = fields;
    return [{ _id: accountId, name: 'Alex', email: 'alex@example.com', role: 'Client' }];
  } });
  const result = await call(controller.getUsers, {});
  assert.equal(result.body[0].name, 'Alex');
  assert.equal(selected, '_id name email role createdAt');
});

test('admin-created users hash passwords and cannot assign an Admin role', async () => {
  let saved;
  User.prototype.save = async function save() { saved = this; return this; };
  const result = await call(controller.createUser, {
    body: { name: 'Alex', email: 'alex@example.com', password: 'Password123!', role: 'Admin' }
  });
  assert.equal(result.status, 201);
  assert.equal(result.body.role, 'Client');
  assert.equal(await bcrypt.compare('Password123!', saved.password), true);
  assert.equal('password' in result.body, false);
});

test('profile reads return a user without selecting the password and handle missing users', async () => {
  let selected;
  User.findById = () => ({ select: async (fields) => {
    selected = fields;
    return { _id: accountId, name: 'Alex' };
  } });
  const found = await call(controller.getUserProfile, { user: { id: accountId } });
  assert.equal(found.body.user.name, 'Alex');
  assert.equal(selected, '-password');

  User.findById = () => ({ select: async () => null });
  const missing = await call(controller.getUserProfile, { user: { id: accountId } });
  assert.equal(missing.status, 404);
});

test('profile updates reject unsafe fields and persist normalized details', async () => {
  const invalid = await call(controller.updateUserProfile, {
    user: { id: accountId }, body: { fullName: '<script>' }
  });
  assert.equal(invalid.status, 400);

  const account = {
    _id: accountId, name: 'Old', email: 'alex@example.com', role: 'Client',
    async save() { return this; }
  };
  User.findById = async () => account;
  const updated = await call(controller.updateUserProfile, {
    user: { id: accountId },
    body: { fullName: ' Alex ', phone: '123', bio: 'Designer', skills: ['Design'], location: 'Pretoria', profilePicture: 'https://example.com/avatar.png' }
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.user.name, 'Alex');
  assert.deepEqual(updated.body.user.skills, ['Design']);
  assert.equal(account.location, 'Pretoria');
});

test('public profiles expose selected fields and return 404 when absent', async () => {
  let fields;
  User.findById = () => ({ select: async (value) => {
    fields = value;
    return { name: 'Alex', role: 'Freelancer' };
  } });
  const found = await call(controller.getPublicUserProfile, { params: { id: accountId } });
  assert.equal(found.body.user.role, 'Freelancer');
  assert.ok(fields.includes('name role'));
  User.findById = () => ({ select: async () => null });
  assert.equal((await call(controller.getPublicUserProfile, { params: { id: accountId } })).status, 404);
});

test('profile deletion deactivates an account', async () => {
  const account = { isActive: true, async save() { return this; } };
  User.findById = async () => account;
  const result = await call(controller.deleteProfile, { user: { id: accountId } });
  assert.equal(result.status, 200);
  assert.equal(account.isActive, false);
});

test('admins cannot delete themselves but can deactivate another user', async () => {
  const account = { _id: accountId, isActive: true, async save() { return this; } };
  User.findById = async () => account;
  const self = await call(controller.deleteUser, { params: { id: accountId }, user: { id: accountId } });
  assert.equal(self.status, 400);
  assert.equal(account.isActive, true);

  const other = await call(controller.deleteUser, { params: { id: accountId }, user: { id: adminId } });
  assert.equal(other.status, 200);
  assert.equal(account.isActive, false);
});
