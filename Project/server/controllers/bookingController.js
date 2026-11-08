const Booking = require("../models/Booking");
const Gig = require("../models/Gig");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");
const { logEvent } = require("../utils/logger");

const isParty = (booking, user) => user.role === "Admin" ||
  booking.clientId.toString() === user.id || booking.freelancerId.toString() === user.id;

// Payment is simulated. All financial values come from the gig, never the request.
exports.createBooking = async (req, res, next) => {
  try {
    const rawGigId = req.body?.gigId;
    if (typeof rawGigId !== "string" || !mongoose.isValidObjectId(rawGigId)) {
      return res.status(400).json({ message: "Choose a valid gig and booking date." });
    }
    const gigId = new mongoose.Types.ObjectId(rawGigId);
    const gig = await Gig.findOne({ _id: gigId, status: "active", isActive: true });
    if (!gig) {
      logEvent("warn", "booking.create.rejected", req, { reason: "gig_unavailable", gigId });
      return res.status(404).json({ message: "This gig is unavailable." });
    }
    if (gig.freelancerId.toString() === req.user.id) {
      logEvent("warn", "booking.create.rejected", req, { reason: "own_gig", gigId: gig._id });
      return res.status(403).json({ message: "You cannot book your own gig." });
    }
    const booking = await Booking.create({
      gigId: gig._id,
      clientId: req.user.id,
      freelancerId: gig.freelancerId,
      location: gig.location,
      agreedPrice: gig.price,
      bookingDate: new Date(req.body.bookingDate)
    });
    try {
      const amount = Math.round(gig.price * 100) / 100;
      const platformFee = Math.round(amount * 0.1 * 100) / 100;
      // The platform does not withhold income tax. The dashboard estimates
      // personal tax over the tax year from completed earnings.
      const taxAmount = 0;
      const freelancerAmount = Math.round((amount - platformFee) * 100) / 100;
      const transaction = await Transaction.create({
        bookingId: booking._id,
        clientId: booking.clientId,
        freelancerId: booking.freelancerId,
        amount, platformFee, taxAmount, freelancerAmount,
        status: "pending",
        invoiceNumber: `INV-${booking._id}`
      });
      logEvent("info", "booking.created", req, {
        bookingId: booking._id,
        gigId: gig._id,
        clientId: booking.clientId,
        freelancerId: booking.freelancerId,
        agreedPrice: booking.agreedPrice
      });
      logEvent("info", "transaction.created", req, {
        transactionId: transaction._id,
        bookingId: booking._id,
        invoiceNumber: transaction.invoiceNumber,
        amount, platformFee, freelancerAmount,
        status: transaction.status
      });
      return res.status(201).json({ success: true, booking, transaction });
    } catch (error) {
      await Booking.findByIdAndDelete(booking._id);
      logEvent("error", "transaction.create.failed", req, { bookingId: booking._id, rolledBack: true });
      throw error;
    }
  } catch (error) { next(error); }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }]
    })
      .populate("gigId", "title category price imageUrl")
      .populate("clientId", "name email profilePicture")
      .populate("freelancerId", "name email profilePicture")
      .sort({ requestedAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) { next(error); }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (!isParty(booking, req.user)) {
      logEvent("warn", "access.denied.booking", req, { bookingId: booking._id, action: "view" });
      return res.status(403).json({ message: "Access denied." });
    }
    await booking.populate("gigId", "title category price imageUrl");
    res.json({ success: true, booking });
  } catch (error) { next(error); }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    const { status } = req.body || {};
    const freelancer = req.user.role === "Freelancer" &&
      booking.freelancerId.toString() === req.user.id;
    const client = req.user.role === "Client" &&
      booking.clientId.toString() === req.user.id;
    const transitions = {
      pending: ["accepted", "cancelled"],
      accepted: ["in_progress", "cancelled"],
      in_progress: ["completed"],
      completed: [], cancelled: []
    };
    if (!transitions[booking.status]?.includes(status)) {
      logEvent("warn", "booking.status.rejected", req, { bookingId: booking._id, from: booking.status, requested: Object.hasOwn(transitions, status) ? status : "invalid" });
      return res.status(400).json({ message: "Invalid booking status change." });
    }
    if (!(freelancer || (client && status === "cancelled"))) {
      logEvent("warn", "access.denied.booking", req, { bookingId: booking._id, action: "status_change" });
      return res.status(403).json({ message: "Access denied." });
    }
    const previousStatus = booking.status;
    booking.status = status;
    if (status === "completed") booking.completedAt = new Date();
    await booking.save();
    logEvent("info", "booking.status.changed", req, { bookingId: booking._id, from: previousStatus, to: status });
    if (status === "cancelled" || status === "completed") {
      const transactionStatus = status === "completed" ? "completed" : "refunded";
      await Transaction.updateOne({ bookingId: booking._id },
        { status: transactionStatus });
      logEvent("info", "transaction.status.changed", req, { bookingId: booking._id, to: transactionStatus });
    }
    res.json({ success: true, booking });
  } catch (error) { next(error); }
};
