const ApiUsage = require("../models/ApiUsage");

const apiUsageMiddleware = (req, res, next) => {
    res.on("finish", async () => {
        try {
            const statusCode = res.statusCode;

            await ApiUsage.create({
                date: new Date(),
                endpoint: req.originalUrl,
                method: req.method,
                statusCode,
                successful: statusCode >= 200 && statusCode < 400
            });
        } catch (error) {
            console.error(
                "Failed to record API usage:",
                error.message
            );
        }
    });

    next();
};

module.exports = apiUsageMiddleware;