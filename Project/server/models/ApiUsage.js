const mongoose = require("mongoose");

const apiUsageSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            default: Date.now,
            index: true
        },

        endpoint: {
            type: String,
            required: true,
            trim: true
        },

        method: {
            type: String,
            required: true,
            uppercase: true
        },

        statusCode: {
            type: Number,
            required: true
        },

        successful: {
            type: Boolean,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ApiUsage",
    apiUsageSchema
);