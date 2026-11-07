const express = require("express");
const router = express.Router();

const {
  getAllAdminGigs,
  updateAdminGigStatus,
  deleteAdminGig,
  getAdminDashboard,
  getAdminUsers,
  getAdminUser,
  updateAdminUser,
  getAdminAnalytics,
  getAdminApiUsage,
  getAdminBookings,
  updateAdminBooking
} = require("../controllers/adminController");

const {protect, authorizeRoles} = require("../middleware/authMiddleware");
const { validateId } = require("../middleware/validateMarketplace");

router.use(protect);
router.use(authorizeRoles("Admin"));

// Mount routes
router.get("/gigs", getAllAdminGigs);
router.put("/gigs/:id", updateAdminGigStatus);
router.delete("/gigs/:id", deleteAdminGig);

//Admin Dashboard
router.get("/", getAdminDashboard);

//Users
router.get("/users", getAdminUsers);
router.get("/users/:id", validateId, getAdminUser);
router.put("/users/:id", validateId, updateAdminUser);

//Analytics
router.get("/analytics", getAdminAnalytics);

//Api usage
router.get("/api-usage", getAdminApiUsage);

//Bookings
router.get("/bookings", getAdminBookings);
router.put("/bookings/:id", validateId, updateAdminBooking);

module.exports = router;
