require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const connectDB = require("./config/database");
const { syncCompletedGigs } = require("./services/gigAvailability");
const app = require("./app");
const { createHttpsServer } = require("./config/https");
const { logEvent, flushLogs, isCloudLoggingEnabled } = require("./utils/logger");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "127.0.0.1";

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error("Set MONGO_URI and JWT_SECRET in Project/.env before starting the API.");
    }
    // Load the certificate first so configuration problems are reported immediately.
    const server = createHttpsServer(app);

    // Connect before accepting traffic so requests never use an unavailable database.
    await connectDB();
    await syncCompletedGigs();

    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(PORT, HOST, () => {
        server.off("error", reject);
        console.log(`HTTPS server running on https://localhost:${PORT}`);
        logEvent("info", "server.started", null, {
          port: Number(PORT),
          nodeVersion: process.version,
          cloudLogging: isCloudLoggingEnabled() ? "better-stack" : "disabled"
        });
        resolve();
      });
    });

    return server;
  } catch (error) {
    console.error("Server failed to start:", error.message);
    logEvent("error", "server.start_failed", null, { errorType: error.name });
    await flushLogs();
    process.exitCode = 1;
    return null;
  }
};

// Record crashes and shutdowns, and send buffered logs to the cloud before exiting.
const registerProcessLogging = () => {
  process.on("unhandledRejection", (reason) => {
    logEvent("error", "server.unhandled_rejection", null, { errorType: reason?.name || "Unknown" });
  });
  process.on("uncaughtException", async (error) => {
    logEvent("error", "server.uncaught_exception", null, { errorType: error.name });
    await flushLogs();
    process.exit(1);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => {
      logEvent("info", "server.stopping", null, { signal });
      await flushLogs();
      process.exit(0);
    });
  }
};

if (require.main === module) {
  registerProcessLogging();
  startServer().catch((error) => {
    console.error("Server failed to start:", error);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
