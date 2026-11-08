const path = require("node:path");
const { createHash } = require("node:crypto");
const winston = require("winston");

// Structured security and audit logger.
// Every entry is a single JSON object, so it can be searched and filtered in the
// cloud log platform (Better Stack) and attacker-supplied text cannot forge extra lines.

const SENSITIVE_KEY = /pass(word)?|token|secret|cookie|authorization|jwt|session/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const MAX_STRING_LENGTH = 200;
const MAX_DEPTH = 3;

// Under `node --test` the logger is silent unless LOG_LEVEL is set explicitly.
const isTestRun = Boolean(process.env.NODE_TEST_CONTEXT);
const level = process.env.LOG_LEVEL || "info";
const silent = isTestRun && !process.env.LOG_LEVEL;

// Remove control characters, cap length and redact anything that looks like a credential.
const sanitize = (value, depth = 0) => {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(CONTROL_CHARS, " ");
    return cleaned.length > MAX_STRING_LENGTH ? `${cleaned.slice(0, MAX_STRING_LENGTH)}…` : cleaned;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toHexString === "function") return value.toHexString();
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  if (typeof value === "object") {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(item, depth + 1);
    }
    return output;
  }
  return String(value);
};

// Logs never contain a full email address: keep the first letter and the domain.
const maskEmail = (email) => {
  if (typeof email !== "string" || !email.includes("@")) return undefined;
  const [local, domain] = email.trim().toLowerCase().split("@");
  return sanitize(`${local.slice(0, 1)}***@${domain}`);
};

// A loggable route label such as "/api/bookings/:param/status". Only lowercase
// word segments are kept; IDs and any other user-controlled text become ":param",
// and the query string is dropped. Requests that matched no route are "unmatched".
const SAFE_SEGMENT = /^[a-z][a-z-]{0,30}$/;
const routeLabel = (req) => {
  if (!req?.route) return "unmatched";
  const path = String(req.originalUrl || "").split("?")[0];
  const segments = path.split("/").filter(Boolean).slice(0, 8)
    .map((segment) => (SAFE_SEGMENT.test(segment) ? segment : ":param"));
  return `/${segments.join("/")}`;
};

// A stable, non-reversible ID for correlating repeated attempts against one account.
const hashIdentifier = (value) =>
  createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex").slice(0, 16);

const transports = [
  new winston.transports.Console({
    format: process.env.LOG_FORMAT === "pretty"
      ? winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level: lvl, message, ...meta }) =>
          `${timestamp} ${lvl} ${message} ${JSON.stringify(meta)}`)
      )
      : winston.format.json()
  })
];

// Local JSON log files (rotated at 5 MB, five files kept). Disabled during tests.
if (process.env.LOG_TO_FILE !== "false" && !isTestRun) {
  const logDirectory = process.env.LOG_DIR || path.resolve(__dirname, "../logs");
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, "app.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, "security.log"),
      level: "warn",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    })
  );
}

// Cloud logging: ships every entry to Better Stack when both settings are present.
let cloudClient = null;
const sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN;
const ingestingHost = process.env.BETTER_STACK_INGESTING_HOST;
if (sourceToken && ingestingHost && !isTestRun) {
  const { Logtail } = require("@logtail/node");
  const { LogtailTransport } = require("@logtail/winston");
  cloudClient = new Logtail(sourceToken, { endpoint: ingestingHost, ignoreExceptions: true });
  transports.push(new LogtailTransport(cloudClient));
}

const logger = winston.createLogger({
  level,
  silent,
  defaultMeta: {
    service: "hustlehub-api",
    environment: process.env.NODE_ENV || "development"
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }),
    winston.format.json()
  ),
  transports
});

// Records one named event. `event` uses the form "area.action.result",
// e.g. "auth.login.failed", so dashboards can filter by prefix.
const logEvent = (level, event, req, details = {}) => {
  const context = {};
  if (req) {
    if (req.id) context.requestId = req.id;
    if (req.ip) context.ip = req.ip;
    if (req.user?.id) {
      context.userId = req.user.id;
      context.userRole = req.user.role;
    }
  }
  logger.log({
    level,
    message: event,
    event,
    category: event.split(".")[0],
    ...context,
    ...sanitize(details)
  });
};

// Sends any buffered cloud entries before the process exits.
const flushLogs = async () => {
  if (cloudClient) await cloudClient.flush();
};

module.exports = {
  logger,
  logEvent,
  flushLogs,
  maskEmail,
  hashIdentifier,
  routeLabel,
  sanitize,
  isCloudLoggingEnabled: () => Boolean(cloudClient)
};
