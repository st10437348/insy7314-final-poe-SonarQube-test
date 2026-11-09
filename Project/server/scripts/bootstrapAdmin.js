const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/database");
const User = require("../models/User");
const { clearFailedLogins } = require("../services/accountLockout");

const email = process.argv[2]?.trim().toLowerCase();

async function readPassword() {
  if (process.stdin.isTTY) {
    throw new Error("Pipe the new password to standard input.");
  }

  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
    if (Buffer.byteLength(input, "utf8") > 512) {
      throw new Error("Password input is too long.");
    }
  }
  return input.replace(/\r?\n$/, "");
}

async function bootstrapAdmin() {
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Provide a valid admin email as the first argument.");
  }

  const password = await readPassword();
  if (
    password.length < 8 ||
    password.length > 128 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password) ||
    !/[@$!%*?&]/.test(password)
  ) {
    throw new Error("Password must be 8–128 characters with uppercase, lowercase, a number, and @$!%*?&.");
  }

  try {
    await connectDB();
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (existingUser && existingUser.role !== "Admin") {
      throw new Error("That email belongs to a non-admin account. Choose another email.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (existingUser) {
      existingUser.password = passwordHash;
      existingUser.provider = "local";
      existingUser.isActive = true;
      existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1;
      await existingUser.save();
      console.log(`Admin password reset for ${email}.`);
    } else {
      await User.create({
        name: "System Administrator",
        email,
        password: passwordHash,
        role: "Admin",
        provider: "local",
        isActive: true
      });
      console.log(`Admin account created for ${email}.`);
    }

    await clearFailedLogins(email);
  } finally {
    await mongoose.disconnect();
  }
}

bootstrapAdmin().catch((error) => {
  console.error(`Admin setup failed: ${error.message}`);
  process.exitCode = 1;
});
