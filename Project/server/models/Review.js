const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    gigId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gig",
        required: true
    },

    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },

    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    freelancerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    comment: {
        type: String,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);