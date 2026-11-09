const Gig = require("../models/Gig");
const User = require("../models/User");
const Booking = require("../models/Booking");
const ApiUsage = require("../models/ApiUsage");
const Transaction = require("../models/Transaction");
const { logEvent } = require("../utils/logger");
const { completeGig } = require("../services/gigAvailability");

const validEmail = (value) => {
  if (typeof value !== "string" || value.length > 254 || /\s/.test(value)) return false;
  const at = value.indexOf("@");
  if (at < 1 || at !== value.lastIndexOf("@")) return false;
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  return dot > 0 && dot < domain.length - 1;
};

//Admin dashboard
exports.getAdminDashboard = async(req, res, next) => {
  try{
    const[
      totalUsers, totalFreelancers, totalClients,
      activeGigs, totalBookings, completedBookings, apiRequests, revenueResult
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({role: "Freelancer"}),
      User.countDocuments({role: "Client"}),
      Gig.countDocuments({status: "active"}),
      Booking.countDocuments(),
      Booking.countDocuments({status: "completed"}),
      ApiUsage.countDocuments(),
      Transaction.aggregate([
                {
                    $match: {
                        status: "completed"
                    }
                },
                { $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } },
                { $match: { "booking.status": "completed" } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: "$platformFee"
                        }
                    }
                }
            ])
    ]);
const platformRevenue = revenueResult.length >0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      dashboard: {
        totalUsers, totalFreelancers, totalClients
        ,activeGigs, totalBookings, completedBookings, platformRevenue: platformRevenue,
        apiRequests: apiRequests
      }
    });
  }catch(error){next(error);}
};

//Get all users
exports.getAdminUsers = async (req, res, next)=>{
  try{
    const users = await User.find().select("_id name email role provider isActive createdAt")
    .sort({createdAt: -1});

    res.status(200).json({users});
  }
  catch(error){next(error);}
}

// Get one user

exports.getAdminUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.status(200).json({
            user
        });
    } catch (error) {
        next(error);
    }
};

//Update user
exports.updateAdminUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            name,
            email,
            role,
            bio,
            skills,
            isActive
        } = req.body || {};

        if ((name !== undefined && (typeof name !== "string" || name.trim().length < 2 || name.length > 100 || /[<>]/.test(name))) ||
            (email !== undefined && !validEmail(email)) ||
            (role !== undefined && !["Client", "Freelancer", "Admin"].includes(role)) ||
            (bio !== undefined && (typeof bio !== "string" || bio.length > 2000 || /[<>]/.test(bio))) ||
            (skills !== undefined && (!Array.isArray(skills) || skills.length > 30 || skills.some(s => typeof s !== "string" || s.length > 80 || /[<>]/.test(s)))) ||
            (isActive !== undefined && typeof isActive !== "boolean")) {
            return res.status(400).json({ message: "Invalid user details." });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Prevent admin from changing their own
        // account into another role accidentally.
        if (
            req.user.id.toString() ===
            user._id.toString() &&
            role &&
            role !== "Admin"
        ) {
            return res.status(400).json({
                message:
                    "You cannot remove your own Admin role."
            });
        }

        if (name !== undefined) {
            user.name = name.trim();
        }

        if (email !== undefined) {
            user.email = email.trim().toLowerCase();
        }

        // Security feature 2: a role change or deactivation ends the user's existing sessions.
        const roleChanged = role !== undefined && role !== user.role;
        const deactivated = isActive === false && user.isActive !== false;

        if (role !== undefined) {
            user.role = role;
        }

        if (bio !== undefined) {
            user.bio = bio;
        }

        if (skills !== undefined) {
            user.skills = skills;
        }

        if (isActive !== undefined) {
            user.isActive = isActive;
        }

        if (roleChanged || deactivated) {
            user.tokenVersion = (user.tokenVersion || 0) + 1;
        }

        const updatedUser = await user.save();
        logEvent(roleChanged || deactivated ? "warn" : "info", "admin.user.updated", req, {
            targetUserId: updatedUser._id,
            changedFields: Object.keys({ name, email, role, bio, skills, isActive })
                .filter((field) => ({ name, email, role, bio, skills, isActive })[field] !== undefined),
            newRole: roleChanged ? updatedUser.role : undefined,
            deactivated,
            sessionsRevoked: roleChanged || deactivated
        });

        res.status(200).json({
            message: "User updated successfully.",
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                bio: updatedUser.bio,
                skills: updatedUser.skills,
                isActive: updatedUser.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

//Analytics
exports.getAdminAnalytics = async (req, res, next) => {
    try {
      const [
            totalUsers,
            totalBookings,
            apiRequests,
            revenueResult
          ] = await Promise.all([
            User.countDocuments(),
            Booking.countDocuments(),
            ApiUsage.countDocuments(),
            Transaction.aggregate([
              {
                $match:{status: "completed"}
              },
              { $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } },
              { $match: { "booking.status": "completed" } },
              {
                $group: {_id: null, totalRevenue: {$sum: "$platformFee"}}
              }
          ])
        ]);

        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        const analytics = [
            {
                date: new Date(),
                activeUsers: totalUsers,
                apiRequests,
                bookings: totalBookings,
                revenue: totalRevenue
            }
        ];

        res.status(200).json({
            analytics
        });
    } catch (error) {
        next(error);
    }
};

//Api usage
exports.getAdminApiUsage = async (req, res, next) => {
    try {
      
        const usage = await ApiUsage.find()
            .sort({ date: -1 })
            .limit(500);

        const groupedUsage = {};

        usage.forEach((item) => {
            const date = item.date
                .toISOString()
                .split("T")[0];

            const key = `${date}-${item.method}-${item.endpoint}`;

            if (!groupedUsage[key]) {
                groupedUsage[key] = {
                    date: item.date,
                    endpoint: item.endpoint,
                    method: item.method,
                    requests: 0,
                    successful: 0,
                    failed: 0
                };
            }

            groupedUsage[key].requests += 1;

            if (item.successful) {
                groupedUsage[key].successful += 1;
            } else {
                groupedUsage[key].failed += 1;
            }
        });

        res.status(200).json({
            usage: Object.values(groupedUsage)
        });
    } catch (error) {
        next(error);
    }
};

//Bookings
exports.getAdminBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate(
                "gigId",
                "title price"
            )
            .populate(
                "clientId",
                "name email"
            )
            .populate(
                "freelancerId",
                "name email"
            )
            .sort({ requestedAt: -1 });

        res.status(200).json({
            bookings
        });
    } catch (error) {
        next(error);
    }
};

//Update Booking
exports.updateAdminBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        const allowedStatuses = [
            "pending",
            "accepted",
            "in_progress",
            "completed",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid booking status."
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (booking.status === "completed" && status !== "completed") {
            return res.status(409).json({ message: "A completed booking cannot be reopened." });
        }

        booking.status = status;
        booking.completedAt = status === "completed" ? new Date() : null;

        const updatedBooking =
            await booking.save();
        if (status === "completed") await completeGig(booking.gigId);
        await Transaction.updateOne({ bookingId: booking._id },
            { status: status === "cancelled" ? "refunded" : status === "completed" ? "completed" : "pending" });

        res.status(200).json({
            message: "Booking updated successfully.",
            booking: updatedBooking
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Get all gigs for admin management
// @route   GET /api/admin/gigs
exports.getAllAdminGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find().populate("freelancerId", "name email");
    res.status(200).json({ success: true, gigs });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gig status
// @route   PUT /api/admin/gigs/:id
exports.updateAdminGigStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["active", "paused", "deleted"].includes(status)) {
      return res.status(400).json({ message: "Invalid gig status." });
    }
    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: "completed" } },
      { status, isActive: status === "active" },
      { new: true, runValidators: true }
    );

    if (!gig) {
      if (await Gig.exists({ _id: req.params.id, status: "completed" })) {
        return res.status(409).json({ message: "Completed gigs cannot be changed." });
      }
      return res.status(404).json({ message: "Gig not found" });
    }

    res.status(200).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a gig
// @route   DELETE /api/admin/gigs/:id
exports.deleteAdminGig = async (req, res, next) => {
  try {
    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: "completed" } },
      { status: "deleted", isActive: false }, { new: true });

    if (!gig) {
      if (await Gig.exists({ _id: req.params.id, status: "completed" })) {
        return res.status(409).json({ message: "Completed gigs cannot be deleted." });
      }
      return res.status(404).json({ message: "Gig not found" });
    }

    res.status(200).json({ success: true, message: "Gig removed successfully" });
  } catch (error) {
    next(error);
  }
};


///api/auth/me
exports.getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

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

//Logout
exports.logoutUser = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });

    res.status(200).json({
        message: "Logged out successfully."
    });
};
