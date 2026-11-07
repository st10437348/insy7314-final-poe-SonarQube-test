const test = require("node:test");
const assert = require("node:assert/strict");
const { errorHandler } = require("../middleware/errorMiddleware");

test("unexpected errors log a generated incident ID without request-controlled text", () => {
  const error = new Error("private database details");
  error.name = "BadError\r\nFORGED LOG ENTRY";
  const req = { method: "GET", originalUrl: "/api/test%0d%0aFORGED-URL" };
  const response = {
    headersSent: false,
    set(name, value) {
      this.headers = { ...this.headers, [name]: value };
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  const originalError = console.error;
  let logged;

  try {
    console.error = (...args) => { logged = args; };
    errorHandler(error, req, response, () => { throw new Error("unexpected next call"); });
  } finally {
    console.error = originalError;
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { message: "An unexpected server error occurred." });
  assert.match(response.headers["X-Incident-Id"], /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i);
  assert.deepEqual(logged, ["Unexpected server error", { incidentId: response.headers["X-Incident-Id"] }]);
  assert.doesNotMatch(JSON.stringify(logged), /FORGED|private database details|api\/test/);
});
