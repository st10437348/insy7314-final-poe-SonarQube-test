const Gig = require("../models/Gig");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get all active gigs (with search, category, and price filters)
// @route   GET /api/gigs
exports.getGigs = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;

    let query = { status: "active", isActive: true };

    if (typeof search === "string" && search.trim()) {
      query.title = { $regex: escapeRegex(search.trim().slice(0, 80)), $options: "i" };
    }

    if (typeof category === "string" && category !== "All") {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && Number.isFinite(Number(minPrice))) query.price.$gte = Number(minPrice);
      if (maxPrice && Number.isFinite(Number(maxPrice))) query.price.$lte = Number(maxPrice);
    }

    const gigs = await Gig.find(query)
      .populate("freelancerId", "name profilePicture rating")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: gigs.length, gigs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gig by ID
// @route   GET /api/gigs/:id
exports.getGigById = async (req, res, next) => {
  try {
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
      { _id: req.params.id, freelancerId: req.user.id, status: { $ne: "deleted" } },
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
      { _id: req.params.id, freelancerId: req.user.id },
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
