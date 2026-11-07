const fs = require("fs");
const path = require("path");
const https = require("https");

const defaultCertificateDirectory = path.join(__dirname, "..", "certificates");
const projectRoot = path.resolve(__dirname, "../..");
const configuredPath = (value, fallback) => value
  ? (path.isAbsolute(value) ? value : path.resolve(projectRoot, value))
  : fallback;

// Read certificate paths from the environment, with local-development defaults.
const readSslCredentials = () => {
  const keyPath = configuredPath(process.env.SSL_KEY_PATH,
    path.join(defaultCertificateDirectory, "localhost-key.pem"));
  const certPath = configuredPath(process.env.SSL_CERT_PATH,
    path.join(defaultCertificateDirectory, "localhost-cert.pem"));

  try {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
  } catch (error) {
    throw new Error(
      `Unable to load the HTTPS certificate. Run "npm run generate-cert" or check SSL_KEY_PATH and SSL_CERT_PATH. (${error.code || "read error"})`
    );
  }
};

// Keeping server creation in one function makes the real HTTPS setup testable.
const createHttpsServer = (app, credentials = readSslCredentials()) =>
  https.createServer(credentials, app);

module.exports = { createHttpsServer, readSslCredentials };
