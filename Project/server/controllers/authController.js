const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Generate salt -> hash  password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create + save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role === "Client" ? "Client" : "Freelancer"
    });

    await newUser.save();

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

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user || !user.isActive || !user.password) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    // Compare submitted password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from environment variables.");
    }
    
    // Build the JWT payload — never put the password or other secrets in here
    const payload = {
      id: user._id,
      role: user.role
    };

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
const logoutUser = (req, res) => {
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
