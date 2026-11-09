const Booking = require("../models/Booking");
const Gig = require("../models/Gig");

// A completed gig never returns to the marketplace.
const unavailableStatuses = ["pending", "accepted", "in_progress", "completed"];

const unavailableGigIds = () => Booking.distinct("gigId", {
  status: { $in: unavailableStatuses }
});

const hasActiveBooking = (gigId) => Booking.exists({
  gigId,
  status: { $in: unavailableStatuses }
});

const completeGig = (gigId) => Gig.updateOne(
  { _id: gigId, status: { $ne: "deleted" } },
  { $set: { status: "completed", isActive: false } }
);

// Bring gigs completed before this change into the same permanent state.
const syncCompletedGigs = async () => {
  const gigIds = await Booking.distinct("gigId", { status: "completed" });
  if (gigIds.length === 0) return;
  await Gig.updateMany(
    { _id: { $in: gigIds }, status: { $nin: ["completed", "deleted"] } },
    { $set: { status: "completed", isActive: false } }
  );
};

module.exports = { unavailableGigIds, hasActiveBooking, completeGig, syncCompletedGigs };
