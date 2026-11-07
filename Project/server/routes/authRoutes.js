const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser
} = require("../controllers/authController");

const validateRegistration = require("../middleware/validateRegistration");
const validateLogin = require("../middleware/validateLogin");
const {protect} = require("../middleware/authMiddleware");

// POST /api/auth/register
router.post("/register", validateRegistration, registerUser);

// POST /api/auth/login
router.post("/login", validateLogin, loginUser);

// POST /api/auth/me
router.get("/me", protect, getCurrentUser);

// POST /api/auth/logout
router.post("/logout", logoutUser);

module.exports = router;
