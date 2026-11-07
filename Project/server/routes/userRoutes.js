const express = require("express");

const router = express.Router();

const {
    getUsers,
    createUser,
    getUserProfile,
    updateUserProfile,
    getPublicUserProfile,
    deleteUser,
    deleteProfile
} = require("../controllers/userController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validateRegistration = require("../middleware/validateRegistration");

// GET USERS (requires a valid JWT)
router.get("/", protect, authorizeRoles("Admin"), getUsers);

// CREATE USER
router.post("/", validateRegistration, createUser);

// USER PROFILE ROUTES
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/:id", protect, getPublicUserProfile);
router.delete("/profile", protect, deleteProfile);
router.delete("/:id", protect, authorizeRoles("Admin"), deleteUser);
module.exports = router;
