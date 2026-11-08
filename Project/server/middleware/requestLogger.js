const { randomUUID } = require("node:crypto");
const { logEvent, routeLabel } = require("../utils/logger");

// Gives every request an ID (returned in X-Request-Id) and writes one access-log
// entry when the response finishes. A cleaned route label (e.g. /api/bookings/:param/status)
// is logged instead of the raw URL, so IDs, query strings and attacker-supplied text
// never reach the logs.
const requestLogger = (req, res, next) => {
  req.id = randomUUID();
  res.set("X-Request-Id", req.id);
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const route = routeLabel(req);
    let level = "info";
    if (res.statusCode >= 500) level = "error";
    else if (res.statusCode >= 400) level = "warn";

    logEvent(level, "http.request", req, {
      method: req.method,
      route,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10
    });
  });

  next();
};

module.exports = requestLogger;
