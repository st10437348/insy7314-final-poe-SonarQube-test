const Booking = require("../models/Booking");
const Gig = require("../models/Gig");
const mongoose = require("mongoose");

// A completed gig never returns to the marketplace.
const unavailableStatuses = ["pending", "accepted", "in_progress", "completed"];

const unavailableGigIds = () => Booking.distinct("gigId", {
  status: { $in: unavailableStatuses }
});

const hasActiveBooking = (gigId) => Booking.exists({
  gigId,
  status: { $in: unavailableStatuses }
});

const toObjectId = (value) => {
  const text = String(value);
  if (!/^[0-9a-f]{24}$/i.test(text)) throw new TypeError("Invalid gig ID.");
  return new mongoose.Types.ObjectId(text);
};

const completeGig = (gigId) => Gig.updateOne(
  { _id: toObjectId(gigId), status: { $ne: "deleted" } },
  { $set: { status: "completed", isActive: false } }
);

// Bring gigs completed before this change into the same permanent state.
const syncCompletedGigs = async () => {
  const gigIds = await Booking.distinct("gigId", { status: "completed" });
  for (const value of gigIds) {
    const id = String(value);
    if (!/^[0-9a-f]{24}$/i.test(id)) continue;
    await Gig.updateOne(
      { _id: new mongoose.Types.ObjectId(id), status: { $nin: ["completed", "deleted"] } },
      { $set: { status: "completed", isActive: false } }
    );
  }
};

module.exports = { unavailableGigIds, hasActiveBooking, completeGig, syncCompletedGigs };
