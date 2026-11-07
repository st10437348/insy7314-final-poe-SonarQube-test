const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes"); 
const bookingRoutes = require("./routes/bookingRoutes");
const gigRoutes = require("./routes/gigRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const apiUsageMiddleware = require("./middleware/apiUsageMiddleware");

const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN || "https://localhost:5173";
app.disable("x-powered-by");

const isDevelopment = process.env.NODE_ENV === "development";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],

      scriptSrc: ["'self'"],

      styleSrc: isDevelopment ? ["'self'", "'unsafe-inline'"] : ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", clientOrigin, ...(isDevelopment ? ["wss:", "ws:"] : [])],

      workerSrc: isDevelopment ? ["'self'", "blob:"] : ["'self'"]
    }
  }
}));
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." }
});
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Booking limit reached. Try again later." }
});


app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
// Browsers attach an Origin to cross-site writes; reject other sites before cookies are used.
app.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin && req.headers.origin !== clientOrigin) {
    return res.status(403).json({ message: "Request origin is not allowed." });
  }
  next();
});

app.use(apiUsageMiddleware);

app.get("/", (req, res) => {
  res.json({ message: "API Running" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend connected successfully!" });
});

app.use("/api/users", (req, res, next) => req.method === "POST" ? loginLimiter(req, res, next) : next(), userRoutes);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", (req, res, next) => req.method === "POST" ? bookingLimiter(req, res, next) : next(), bookingRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/transactions", transactionRoutes);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
