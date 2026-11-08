const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const accountLockout = require("../services/accountLockout");
const { logEvent, maskEmail, hashIdentifier } = require("../utils/logger");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    // Keep the database filter scalar even if this controller is reused without
    // the route's validation middleware.
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "A valid email is required." });
    }
    const safeEmail = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email: { $eq: safeEmail } });
    if (existingUser) {
      logEvent("warn", "auth.register.duplicate", req, { email: maskEmail(safeEmail) });
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Generate salt -> hash  password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create + save user
    const newUser = new User({
      name,
      email: safeEmail,
      password: hashedPassword,
      role: role === "Client" ? "Client" : "Freelancer"
    });

    await newUser.save();
    logEvent("info", "auth.register.success", req, {
      newUserId: newUser._id,
      newUserRole: newUser.role,
      email: maskEmail(newUser.email)
    });

    //  success message (excluding sensitive data)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & return JWT
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email

    const normalizedEmail = email.trim().toLowerCase();
    const logDetails = { email: maskEmail(normalizedEmail), accountKey: hashIdentifier(normalizedEmail) };

    // Security feature 1: refuse sign-in while this account is locked out.
    const lock = await accountLockout.getLockStatus(normalizedEmail);
    if (lock.locked) {
      logEvent("warn", "auth.login.blocked_locked", req, { ...logDetails, retryAfterSeconds: lock.retryAfterSeconds });
      res.set("Retry-After", String(lock.retryAfterSeconds));
      return res.status(429).json({ message: accountLockout.LOCKED_MESSAGE });
    }

    const user = await User.findOne({
      email: { $eq: normalizedEmail }
    });

    // Every failure gets the same generic message; the reason is only written to the log.
    const failLogin = async (reason) => {
      const result = await accountLockout.recordFailedLogin(normalizedEmail);
      logEvent("warn", "auth.login.failed", req, {
        ...logDetails,
        reason,
        failedCount: result.failedCount,
        targetUserId: user?._id
      });
      if (result.locked) {
        logEvent("error", "auth.account.locked", req, {
          ...logDetails,
          failedCount: result.failedCount,
          lockedForSeconds: result.retryAfterSeconds,
          targetUserId: user?._id
        });
        res.set("Retry-After", String(result.retryAfterSeconds));
        return res.status(429).json({ message: accountLockout.LOCKED_MESSAGE });
      }
      return res.status(401).json({ message: "Invalid email or password." });
    };

    if (!user) return failLogin("unknown_email");
    if (!user.isActive) return failLogin("inactive_account");
    if (!user.password) return failLogin("no_local_password");

    // Compare submitted password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return failLogin("wrong_password");

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from environment variables.");
    }
    
    // Build the JWT payload — never put the password or other secrets in here
    // `tv` (token version) lets the server revoke this token later (security feature 2).
    const payload = {
      id: user._id,
      role: user.role,
      tv: user.tokenVersion || 0
    };

    // A correct password resets the failed-attempt counter for this account.
    await accountLockout.clearFailedLogins(normalizedEmail);
    logEvent("info", "auth.login.success", req, {
      ...logDetails,
      targetUserId: user._id,
      targetUserRole: user.role
    });

    const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: SESSION_DURATION
});

res.status(200).json({
    message: "Login successful",
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
});

  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged-in user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res, next) => {
  try {

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
// Security feature 2: logging out revokes the token on the server. Increasing the
// user's tokenVersion makes every JWT issued before now invalid, so a copied or
// stolen token stops working immediately instead of when it expires.
const logoutUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token && process.env.JWT_SECRET) {
      let decoded = null;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        // An expired or invalid token has nothing to revoke; still clear the cookie.
      }
      if (decoded?.id && mongoose.isValidObjectId(decoded.id)) {
        await User.updateOne({ _id: { $eq: String(decoded.id) } }, { $inc: { tokenVersion: 1 } });
        logEvent("info", "auth.logout", req, { targetUserId: decoded.id, sessionsRevoked: true });
      }
    }
  } catch (error) {
    return next(error);
  }

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
  });

  res.status(200).json({
    message: "Logged out successfully."
  });
};


module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser
};
