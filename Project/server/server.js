require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const connectDB = require("./config/database");
const app = require("./app");
const { createHttpsServer } = require("./config/https");

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

    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(PORT, HOST, () => {
        server.off("error", reject);
        console.log(`HTTPS server running on https://localhost:${PORT}`);
        resolve();
      });
    });

    return server;
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exitCode = 1;
    return null;
  }
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server failed to start:", error);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
