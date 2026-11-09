const Gig = require("../models/Gig");
const Booking = require("../models/Booking");
const { unavailableGigIds, hasActiveBooking } = require("../services/gigAvailability");

// @desc    Get all active gigs (with search, category, and price filters)
// @route   GET /api/gigs
exports.getGigs = async (req, res, next) => {
  try {
    // Only fixed values reach MongoDB. HTTP filters are applied to the results.
    const gigs = await Gig.find({ status: "active", isActive: true })
      .populate("freelancerId", "name profilePicture rating")
      .sort({ createdAt: -1 });
    const bookedIds = new Set((await unavailableGigIds()).map(String));
    const { search, category, minPrice, maxPrice } = req.query;
    const searchText = typeof search === "string" ? search.trim().slice(0, 80).toLowerCase() : "";
    const selectedCategory = typeof category === "string" && category !== "All" ? category : null;
    const minimum = typeof minPrice === "string" && minPrice.trim() && Number.isFinite(Number(minPrice))
      ? Number(minPrice) : null;
    const maximum = typeof maxPrice === "string" && maxPrice.trim() && Number.isFinite(Number(maxPrice))
      ? Number(maxPrice) : null;
    const availableGigs = gigs.filter((gig) =>
      !bookedIds.has(String(gig._id)) &&
      (!searchText || gig.title?.toLowerCase().includes(searchText)) &&
      (!selectedCategory || gig.category === selectedCategory) &&
      (minimum === null || gig.price >= minimum) &&
      (maximum === null || gig.price <= maximum)
    );

    res.status(200).json({ success: true, count: availableGigs.length, gigs: availableGigs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gig by ID
// @route   GET /api/gigs/:id
exports.getGigById = async (req, res, next) => {
  try {
    if (await hasActiveBooking(req.params.id)) {
      return res.status(404).json({ message: "Gig not found" });
    }
    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, status: "active", isActive: true },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("freelancerId", "name profilePicture bio location rating");

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// Booking participants and the gig owner can still view non-public gig details.
exports.getGigHistory = async (req, res, next) => {
  try {
    const gig = await Gig.findOne({
      _id: req.params.id,
      status: { $ne: "deleted" }
    }).populate("freelancerId", "name profilePicture bio location rating");
    if (!gig) return res.status(404).json({ message: "Gig not found." });

    const ownerId = String(gig.freelancerId?._id || gig.freelancerId);
    if (req.user.role !== "Admin" && ownerId !== req.user.id) {
      const booking = await Booking.exists({
        gigId: gig._id,
        $or: [{ clientId: req.user.id }, { freelancerId: req.user.id }]
      });
      if (!booking) return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json({ success: true, gig });
  } catch (error) { next(error); }
};

// A freelancer can load their own paused gig for editing without exposing it publicly.
exports.getMyGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findOne({
      _id: req.params.id,
      freelancerId: req.user.id,
      status: { $ne: "deleted" }
    });
    if (!gig) return res.status(404).json({ message: "Gig not found." });
    res.status(200).json({ success: true, gig });
  } catch (error) { next(error); }
};

// @desc    Create a new gig
// @route   POST /api/gigs
exports.createGig = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      price,
      deliveryDays,
      location,
      imageUrl
    } = req.body;

    // Fixed: Supports both req.user.id and req.user._id
    const freelancerId = req.user.id;

    if (!freelancerId) {
      return res.status(400).json({ message: "Freelancer ID is required." });
    }

    const gig = await Gig.create({
      freelancerId,
      title,
      description,
      category,
      price,
      deliveryDays,
      location,
      imageUrl: imageUrl || ""
    });

    res.status(201).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing gig
// @route   PUT /api/gigs/:id
exports.updateGig = async (req, res, next) => {
  try {
    const { title, description, category, price, deliveryDays, location, imageUrl, status } = req.body;
    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, freelancerId: req.user.id, status: { $in: ["active", "paused"] } },
      { title, description, category, price, deliveryDays, location,
        imageUrl: imageUrl || "", status, isActive: status !== "paused" },
      { new: true, runValidators: true }
    );

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a gig
// @route   DELETE /api/gigs/:id
exports.deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, freelancerId: req.user.id, status: { $ne: "completed" } },
      { status: "deleted", isActive: false }, { new: true }
    );

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    res.status(200).json({ success: true, message: "Gig removed successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get gigs created by the logged-in freelancer
// @route   GET /api/gigs/my-gigs
exports.getMyGigs = async (req, res, next) => {
  try {
    // Fixed: Supports both req.user.id and req.user._id
    const freelancerId = req.user.id;

    const gigs = await Gig.find({ freelancerId, status: { $ne: "deleted" } }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, gigs });
  } catch (error) {
    next(error);
  }
};
