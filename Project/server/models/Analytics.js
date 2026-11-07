const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({

    date: {
        type: Date,
        required: true,
        unique: true
    },

    activeUsers: {
        type: Number,
        default: 0
    },

    apiRequests: {
        type: Number,
        default: 0
    },

    bookings: {
        type: Number,
        default: 0
    },

    revenue: {
        type: Number,
        default: 0
    }

});

module.exports = mongoose.model("Analytics", analyticsSchema);