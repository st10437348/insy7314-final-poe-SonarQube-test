const { randomUUID } = require("node:crypto");
const { logEvent, routeLabel } = require("../utils/logger");

// Return a predictable response for URLs that do not match an API route.
const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found." });
};

// Central error handling prevents stack traces and internal error messages leaking.
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "The request body contains invalid JSON." });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "The request body is too large." });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: "The supplied data is invalid." });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "A record with those details already exists." });
  }

  // Keep client-controlled URLs and error names out of logs; use this ID to match reports.
  const incidentId = randomUUID();
  console.error("Unexpected server error", { incidentId });
  // Structured copy for the log platform: only the generated ID, the route pattern
  // and the error class, never the error message or the raw URL.
  logEvent("error", "server.error", req, {
    incidentId,
    method: req.method,
    route: routeLabel(req),
    // Class names only (e.g. TypeError, MongoServerError); anything unusual becomes "Error".
    errorType: /^[A-Za-z]{1,40}$/.test(error?.name || "") ? error.name : "Error"
  });
  res.set("X-Incident-Id", incidentId);
  return res.status(500).json({ message: "An unexpected server error occurred." });
};

module.exports = { notFound, errorHandler };
