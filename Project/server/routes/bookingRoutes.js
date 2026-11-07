const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus
} = require("../controllers/bookingController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { validateBooking, validateId } = require("../middleware/validateMarketplace");

router.use(protect);
router.post("/", authorizeRoles("Client"), validateBooking, createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/:id", validateId, getBookingById);
router.patch("/:id/status", validateId, updateBookingStatus);

module.exports = router;
