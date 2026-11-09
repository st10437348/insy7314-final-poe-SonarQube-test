const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        gigId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gig",
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

        location: {
            address: {
                type: String,
                required: true,
                trim: true
            }
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "in_progress",
                "completed",
                "cancelled"
            ],
            default: "pending"
        },

        agreedPrice: {
            type: Number,
            required: true,
            min: 0
        },

        bookingDate: {
            type: Date,
            required: true
        },

        requestedAt: {
            type: Date,
            default: Date.now
        },

        completedAt: {
            type: Date,
            default: null
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
);

bookingSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

// One live reservation per gig, including simultaneous booking requests.
bookingSchema.index(
    { gigId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["pending", "accepted", "in_progress"] }
        }
    }
);

module.exports = mongoose.model("Booking", bookingSchema);
