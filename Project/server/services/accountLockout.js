const { createHash } = require("node:crypto");
const LoginAttempt = require("../models/LoginAttempt");

// Security feature 1: per-account lockout.
// The IP rate limiter stops one machine sending many requests. This stops a
// distributed attack (many IPs) guessing the password of ONE account:
// after MAX_FAILED_ATTEMPTS wrong passwords inside the window, that email
// address is locked for LOCKOUT_MINUTES. Unknown emails are counted the same
// way, so the lockout response cannot be used to discover which emails exist.

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const settings = () => ({
  maxFailedAttempts: toPositiveInt(process.env.LOGIN_MAX_FAILED_ATTEMPTS, 5),
  windowMs: toPositiveInt(process.env.LOGIN_ATTEMPT_WINDOW_MINUTES, 15) * 60 * 1000,
  lockoutMs: toPositiveInt(process.env.LOGIN_LOCKOUT_MINUTES, 15) * 60 * 1000
});

const LOCKED_MESSAGE =
  "Too many failed sign-in attempts. This account is temporarily locked. Try again later.";

const keyFor = (email) => createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex");

const secondsUntil = (date, now) => Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1000));

// Returns whether the account is currently locked and for how long.
const getLockStatus = async (email, now = new Date()) => {
  const attempt = await LoginAttempt.findOne({ key: keyFor(email) }).lean();
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: secondsUntil(attempt.lockedUntil, now) };
  }
  return { locked: false };
};

// Counts a failed attempt and locks the account when the limit is reached.
const recordFailedLogin = async (email, now = new Date()) => {
  const { maxFailedAttempts, windowMs, lockoutMs } = settings();
  const key = keyFor(email);
  const windowStart = new Date(now.getTime() - windowMs);
  const expiresAt = new Date(now.getTime() + windowMs);

  // Add to an attempt window that is still open...
  let attempt = await LoginAttempt.findOneAndUpdate(
    { key, firstFailedAt: { $gte: windowStart } },
    { $inc: { failedCount: 1 }, $set: { expiresAt } },
    { new: true }
  );

  // ...or start a new window (also clears an expired lock).
  if (!attempt) {
    try {
      attempt = await LoginAttempt.findOneAndUpdate(
        { key },
        { $set: { failedCount: 1, firstFailedAt: now, lockedUntil: null, expiresAt } },
        { new: true, upsert: true }
      );
    } catch (error) {
      // Two simultaneous first failures can race on the unique key; count this one in the new window.
      if (error.code !== 11000) throw error;
      attempt = await LoginAttempt.findOneAndUpdate(
        { key }, { $inc: { failedCount: 1 }, $set: { expiresAt } }, { new: true }
      );
    }
  }

  if (attempt.failedCount >= maxFailedAttempts) {
    const lockedUntil = new Date(now.getTime() + lockoutMs);
    await LoginAttempt.updateOne(
      { key },
      { $set: { lockedUntil, expiresAt: new Date(lockedUntil.getTime() + windowMs) } }
    );
    return {
      locked: true,
      failedCount: attempt.failedCount,
      retryAfterSeconds: secondsUntil(lockedUntil, now)
    };
  }

  return {
    locked: false,
    failedCount: attempt.failedCount,
    attemptsRemaining: maxFailedAttempts - attempt.failedCount
  };
};

// A successful sign-in clears the counter.
const clearFailedLogins = async (email) => {
  await LoginAttempt.deleteOne({ key: keyFor(email) });
};

module.exports = {
  LOCKED_MESSAGE,
  getLockStatus,
  recordFailedLogin,
  clearFailedLogins,
  settings
};
