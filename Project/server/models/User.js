const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: false
    },

    role: {
      type: String,
      enum: ["Client", "Freelancer", "Admin"],
      default: "Client"
    },

    profilePicture: {
      type: String,
      default: null
    },

    bio: {
      type: String,
      default: ""
    },

    skills: {
      type: [String],
      default: []
    },
    phone: {
      type: String,
      default: ""
    },

    location: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Increased on logout, deactivation and role change. Every JWT carries the
    // version it was issued with; a mismatch means the token has been revoked.
    tokenVersion: {
      type: Number,
      default: 0
    },

    provider: {
      type: String,
      enum: ["local", "google", "microsoft"],
      default: "local"
    },

    lastLogin: {
      type: Date,
      default: null
    },
    
    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
);

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("User", userSchema);