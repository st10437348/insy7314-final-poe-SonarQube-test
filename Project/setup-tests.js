// One-time setup for the Part 2 test tooling.
// Run from the Project folder:  node setup-tests.js
// It installs the test packages and ADDS the test scripts to package.json
// (existing scripts and dependencies are kept).
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const run = (cmd, cwd) => {
  console.log(`\n> ${cmd}   (in ${path.relative(root, cwd) || "Project"})`);
  execSync(cmd, { cwd, stdio: "inherit" });
};

const addScripts = (dir, scripts) => {
  const file = path.join(dir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  pkg.scripts = { ...(pkg.scripts || {}), ...scripts };
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`Added scripts to ${path.relative(root, file) || "package.json"}: ${Object.keys(scripts).join(", ")}`);
};

const clientDir = path.join(root, "client");
const serverDir = path.join(root, "server");

// 1. Root (Newman)
run("npm install", root);
run("npm install -D newman newman-reporter-htmlextra", root);
addScripts(root, {
  "test:server": "npm test --prefix server",
  "test:client": "npm test --prefix client",
  "test:all": "npm run test:server && npm run test:client",
  "test:api": "newman run \"../PostmanCollection/HustleHub Part 2 - Secure Marketplace API.postman_collection.json\" --insecure -r cli,htmlextra --reporter-htmlextra-export ../NewmanReports/newman-report.html --reporter-htmlextra-title \"HustleHub Part 2 - Newman Report\"",
  "test:ratelimit": "newman run \"../PostmanCollection/HustleHub Part 2 - Rate Limit Demo.postman_collection.json\" -n 35 --insecure -r cli,htmlextra --reporter-htmlextra-export ../NewmanReports/newman-ratelimit-report.html",
  "seed": "npm run seed --prefix server"
});

// 2. Server
run("npm install", serverDir);

// 3. Client (Vitest + React Testing Library)
run("npm install", clientDir);
run("npm install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom", clientDir);
addScripts(clientDir, { test: "vitest run", "test:watch": "vitest" });

console.log("\nDone. Next: npm run test:server  and  npm run test:client");
