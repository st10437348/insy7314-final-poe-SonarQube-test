const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true
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

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        platformFee: {
            type: Number,
            required: true,
            min: 0
        },

        freelancerAmount: {
            type: Number,
            required: true,
            min: 0
        },

        taxAmount: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "pending",
                "completed",
                "refunded",
                "failed"
            ],
            default: "pending"
        },
        payoutDate: {
            type: Date,
            default: null
        },

        invoiceNumber: {
            type: String,
            default: ""
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

transactionSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
