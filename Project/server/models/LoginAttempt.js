const mongoose = require("mongoose");

// Tracks failed sign-ins per email address for account lockout.
// `key` is a SHA-256 hash of the normalised email, so the collection never stores
// the address itself. Documents remove themselves when `expiresAt` passes (TTL index).
const loginAttemptSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  failedCount: { type: Number, default: 0 },
  firstFailedAt: { type: Date, required: true },
  lockedUntil: { type: Date, default: null },
  expiresAt: { type: Date, required: true }
});

loginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);
