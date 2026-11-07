const { randomUUID } = require("node:crypto");

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
  res.set("X-Incident-Id", incidentId);
  return res.status(500).json({ message: "An unexpected server error occurred." });
};

module.exports = { notFound, errorHandler };
