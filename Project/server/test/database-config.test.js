const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const connectDB = require('../config/database');

test('database name follows the selected environment and rejects missing settings', () => {
  const original = {
    NODE_ENV: process.env.NODE_ENV,
    MONGO_DB_DEV: process.env.MONGO_DB_DEV,
    MONGO_DB_PROD: process.env.MONGO_DB_PROD
  };
  try {
    process.env.NODE_ENV = 'development';
    process.env.MONGO_DB_DEV = 'hustlehub_test';
    assert.equal(connectDB.getDatabaseName(), 'hustlehub_test');
    delete process.env.MONGO_DB_DEV;
    assert.throws(() => connectDB.getDatabaseName(), /MONGO_DB_DEV is missing/);

    process.env.NODE_ENV = 'production';
    process.env.MONGO_DB_PROD = 'hustlehub_prod';
    assert.equal(connectDB.getDatabaseName(), 'hustlehub_prod');
    delete process.env.MONGO_DB_PROD;
    assert.throws(() => connectDB.getDatabaseName(), /MONGO_DB_PROD is missing/);

    process.env.NODE_ENV = 'test';
    assert.throws(() => connectDB.getDatabaseName(), /Unsupported NODE_ENV: test/);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('database connection uses the selected name and reports connection failures', async () => {
  const originalConnect = mongoose.connect;
  const originalEnvironment = process.env.NODE_ENV;
  const originalName = process.env.MONGO_DB_DEV;
  const originalUri = process.env.MONGO_URI;
  const originalLog = console.log;
  let received;
  try {
    process.env.NODE_ENV = 'development';
    process.env.MONGO_DB_DEV = 'hustlehub_test';
    process.env.MONGO_URI = 'mongodb://localhost:27017';
    console.log = () => {};
    mongoose.connect = async (uri, options) => {
      received = { uri, options };
      return { connection: { name: 'hustlehub_test', host: 'localhost' } };
    };
    assert.equal((await connectDB()).connection.name, 'hustlehub_test');
    assert.deepEqual(received, { uri: 'mongodb://localhost:27017', options: { dbName: 'hustlehub_test' } });

    mongoose.connect = async () => { throw new Error('connection refused'); };
    await assert.rejects(connectDB(), /MongoDB connection failed: connection refused/);
  } finally {
    mongoose.connect = originalConnect;
    console.log = originalLog;
    for (const [key, value] of Object.entries({ NODE_ENV: originalEnvironment, MONGO_DB_DEV: originalName, MONGO_URI: originalUri })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
