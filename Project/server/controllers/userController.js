const User = require("../models/User");
const { logEvent } = require("../utils/logger");
const bcrypt = require("bcryptjs");

// GET ALL USERS
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("_id name email role createdAt");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// CREATE USER
const createUser = async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role === "Freelancer" ? "Freelancer" : "Client",
      password: hashedPassword
    });

    const savedUser = await user.save();

    res.status(201).json({
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// GET CURRENT USER PROFILE
const getUserProfile = async (req, res, next) => {
  try {
    // Support both req.user.id and req.user._id
    const userId = req.user?.id || req.user?._id || req.query.userId;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// UPDATE USER PROFILE
const updateUserProfile = async (req, res, next) => {
  try {
    // Support both req.user.id and req.user._id
    const userId = req.user.id;
    const { fullName, phone, bio, skills, location, profilePicture } = req.body || {};
    if ((fullName !== undefined && (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.length > 100 || /[<>]/.test(fullName))) ||
        (phone !== undefined && (typeof phone !== "string" || phone.length > 30 || /[<>]/.test(phone))) ||
        (bio !== undefined && (typeof bio !== "string" || bio.length > 2000 || /[<>]/.test(bio))) ||
        (skills !== undefined && (!Array.isArray(skills) || skills.length > 30 || skills.some(s => typeof s !== "string" || s.length > 80 || /[<>]/.test(s)))) ||
        (location !== undefined && (typeof location !== "string" || location.length > 200 || /[<>]/.test(location))) ||
        (profilePicture !== undefined && profilePicture !== null && profilePicture !== "" &&
          (typeof profilePicture !== "string" || profilePicture.length > 500 || !/^https?:\/\//i.test(profilePicture)))) {
      return res.status(400).json({ message: "Invalid profile details." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName) user.name = fullName.trim();
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (location !== undefined) user.location = location;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        phone: updatedUser.phone,
        location: updatedUser.location
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET PUBLIC PROFILE
const getPublicUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name role profilePicture bio skills location createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};


//Delete Profile
const deleteProfile = async(req, res, next) => {
  try{
    const userId = req.user.id;
    const user = await User.findById(userId);

    if(!user) return res.status(404).json({message: "User not found."});

    user.isActive = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    logEvent("warn", "user.account.deactivated", req, { targetUserId: user._id, by: "self", sessionsRevoked: true });

    res.status(200).json({message: "Account deleted successfully."});
  }

  catch(error){next(error);}
}

//deleteUser
const deleteUser = async(req, res, next) => {
  try{
    const { id } = req.params;

    const user = await User.findById(id);

    if(!user) return res.status(404).json({message: "User not found."});

    if(req.user.id.toString() === user._id.toString()) return res.status(400).json({message: "You can't delete your own admin account"})

      user.isActive = false;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
      logEvent("warn", "user.account.deactivated", req, { targetUserId: user._id, by: "admin", sessionsRevoked: true });

    res.status(200).json({message: "User deleted successfully."});
  }

  catch(error){next(error);}
}

module.exports = {
  getUsers,
  createUser,
  getUserProfile,
  updateUserProfile,
  getPublicUserProfile,
  deleteProfile,
  deleteUser
};
