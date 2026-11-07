const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const certificateDirectory = path.join(__dirname, "..", "certificates");
const keyPath = path.join(certificateDirectory, "localhost-key.pem");
const certPath = path.join(certificateDirectory, "localhost-cert.pem");
const configPath = path.join(__dirname, "localhost.cnf");

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log(`Using the existing local HTTPS certificate in ${certificateDirectory}`);
} else {
  // Check common locations as Git for Windows includes OpenSSL.
  const candidates = [
    process.env.OPENSSL_PATH,
    "openssl",
    "C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
    "C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe"
  ].filter(Boolean);

  const openssl = candidates.find((candidate) => {
    const result = spawnSync(candidate, ["version"], { stdio: "ignore" });
    return !result.error && result.status === 0;
  });

  if (!openssl) {
    console.error("OpenSSL was not found. Install OpenSSL or set OPENSSL_PATH, then try again.");
    process.exitCode = 1;
  } else {
    fs.mkdirSync(certificateDirectory, { recursive: true });

    const result = spawnSync(
      openssl,
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-sha256",
        "-nodes",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-days",
        "365",
        "-config",
        configPath
      ],
      { stdio: "inherit" }
    );

    if (result.status !== 0) {
      console.error("The local HTTPS certificate could not be generated.");
      process.exitCode = result.status || 1;
    } else {
      console.log(`Local HTTPS certificate created in ${certificateDirectory}`);
    }
  }
}
