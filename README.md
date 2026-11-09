# HustleHub+: Secure MERN Freelance Marketplace

**INSY7314 POE, Part 3: Secure Stack** · Group 1

| Part 3 link | Location |
| --- | --- |
| Classroom50 repository | [HustleHub+ classroom repository](https://github.com/EMGPRS/insy7314-2026-insy7314-poe-classroom-st10437348) |
| SonarQube Cloud test repository | [HustleHub+ SonarQube test repository](https://github.com/st10437348/insy7314-final-poe-SonarQube-test) |
| Part 3 demonstration video | [Watch the Part 3 demonstration](https://youtu.be/3yA9BrSqaEk?si=3XDKGvWRwcZ-HgKo) |

HustleHub+ is a full-stack MERN (MongoDB, Express, React, Node.js) marketplace. **Freelancers** list services ("gigs"), **clients** browse and book them, and **admins** oversee the platform. Part 2 extended the Part 1 HTTPS and authentication backend into a secured application. Part 3 adds an income and tax dashboard, CI checks, and SonarQube Cloud analysis in a companion repository. The application includes:

- a marketplace API (gigs, bookings, transactions and income)
- role-based access control (RBAC)
- input validation and sanitisation
- rate limiting
- security headers with a Content Security Policy
- a React frontend
- automated backend and frontend tests
- tax-year income summaries and an indicative SARS-based tax estimate
- GitHub Actions checks for tests, builds, API integration, and static analysis

> The Part 1 architecture report, diagram and screenshots are kept in [`docs/Part1-Report.md`](docs/Part1-Report.md).


---

## Part 3 contributions

Part 3 work was split by marking criterion.

| Area (marks) | Owner | What was delivered | README section |
| --- | --- | --- | --- |
| Docker Backend and Frontend (10) | `Ruan Helgaard Hartman` | Backend and frontend Dockerfiles, Compose orchestration, and a required container smoke test in CI | [19](#19-docker-compose-and-container-ci) |
| Security Review in README (10) | `Ruan Helgaard Hartman` | Threats and implemented protections | [Security review](#security-review-report) |
| README Updates (5) | `Ruan Helgaard Hartman` | Project documentation and evidence | [README contents](#table-of-contents) |
| CI/CD Pipeline Backend && Frontend (20) | `Alexandro Ornelas` | GitHub Actions backend, frontend, Newman and build checks | [16](#16-part-3-income-ci-and-static-analysis) |
| Static Code Analysis (10) | `Alexandro Ornelas` | ESLint and backend syntax check here; SonarQube Cloud evidence in the companion repository | [16](#16-part-3-income-ci-and-static-analysis) |
| Logging (10) | `Caleb Forbes` | Structured request, business and security events with Better Stack transport and redaction | [17](#17-logging-and-monitoring) |
| 2 Security Features (15) | `Caleb Forbes` | Per-account login lockout and server-side session revocation | [18](#18-additional-security-features) |
| Tax + Income Dashboard (20) | `Clifford Naude` | SARS 2027 progressive estimate and responsive earnings dashboard | [16](#16-part-3-income-ci-and-static-analysis) |

---

## Table of contents

**Part 3**

- [Part 3 contributions](#part-3-contributions)
- [Part 3 income, CI and static analysis](#16-part-3-income-ci-and-static-analysis)
- [Logging and monitoring](#17-logging-and-monitoring)
- [Additional security features](#18-additional-security-features)
- [Docker Compose and container CI](#19-docker-compose-and-container-ci)
- [Security Review Report](#security-review-report)

**Part 2**

- [Team and contributions](#1-team-and-contributions)
- [Features](#2-features)
- [Tech stack](#3-tech-stack)
- [Project structure](#4-project-structure)
- [Getting started](#5-getting-started)
- [Backend API](#6-backend-api)
- [Role-based access control (RBAC)](#7-role-based-access-control-rbac)
- [API security: JWT, validation and sanitisation](#8-api-security-jwt-validation-and-sanitisation)
- [Rate limiting and security headers](#9-rate-limiting-and-security-headers)
- [React frontend](#10-react-frontend)
- [Testing](#11-testing)
- [Screenshots](#12-screenshots)
- [Demonstration video](#13-demonstration-video)
- [What changed from Part 1](#14-what-changed-from-part-1)
- [References](#15-references)

---

**Part 3**

## 16. Part 3 income, CI and static analysis

### Income and tax dashboard

The freelancer `/income` page uses completed bookings in the current South African tax year (1 March to 28 February). The API groups earnings by **booking completion date**, rather than booking creation date, and returns twelve monthly values plus gross earnings, platform fees, estimated taxable platform income, indicative tax and income after estimated tax. The dashboard shows the same figures and explains the calculation.

The estimate uses the [SARS 2027 individual tax brackets and primary rebate](https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/). It applies the progressive bracket to completed earnings less platform fees, subtracts the R17,820 primary rebate and floors the result at zero. For example, R120,000 completed earnings less R12,000 fees gives R108,000 taxable platform income; 18% is R19,440, less the rebate gives **R1,620 estimated tax**. It assumes an individual under 65 with no other income, expenses, deductions or tax credits. It is an estimate, not tax withheld or a final tax assessment. The fixed 2027 rates require review for future tax years.

New simulated transactions deduct the 10% platform fee and record zero tax withheld. Older transactions retain their recorded amounts; the income page shows any historical simulated tax deductions separately. The monthly chart shows earnings after platform fees and before estimated tax. The income cards and chart accommodate empty months, mobile screens and large currency values.

![Part 3 income and tax dashboard with tax-year summary cards and monthly chart](Screenshots/part3-income-tax-dashboard.png)

![Part 3 income breakdown and explanation of the SARS tax estimate](Screenshots/part3-income-tax-breakdown.png)

### Repository used for SonarQube Cloud

This is the Classroom50 repository. The Classroom50 organization blocked SonarQube Cloud access to it, and it could not be forked. A separate [HustleHub Part 3 SonarQube test repository](https://github.com/st10437348/insy7314-final-poe-SonarQube-test) was therefore created as a copy of the application so the GitHub Actions scan could run. The copy has its own commit history; it is not a fork or a SonarQube scan of this Classroom50 repository. Application fixes from the test repository were brought back here. All SonarQube Cloud results described below came from the **test repository's** Cloud project, not this repository.

The Classroom50 workflow retains a conditional SonarQube job, but the organization restriction means it is skipped by default. Its required backend, frontend, API integration, container smoke test and final status checks still run. The test repository's workflow runs the SonarQube job as a required check and waits for the Cloud quality gate.

### GitHub Actions pipelines and workflows

#### `CI and static analysis` in this Classroom50 repository

The [CI workflow](.github/workflows/ci.yml) runs for every push and pull request and can also be started manually. GitHub-hosted Ubuntu runners use Node.js 22 and lockfile-based `npm ci` installs. Its jobs run independently unless a dependency is stated:

| Job | Work performed | What makes it fail |
| --- | --- | --- |
| `backend` | Installs `Project/server` dependencies, checks high or critical **runtime** dependency advisories, runs the Node.js backend test suite, and parses every backend JavaScript file with `node --check`. | A dependency audit, test or syntax check fails. |
| `frontend` | Installs `Project/client` dependencies, checks high or critical runtime advisories, runs ESLint and Vitest, then builds the production React bundle with Vite. | An audit, lint rule, test or build fails. |
| `api-integration` | Starts a health-checked MongoDB 7 service, generates a temporary JWT secret, installs the root and backend packages, audits root runtime dependencies, creates the test HTTPS certificate, seeds only the `hustlehub_ci` database, starts the HTTPS API, waits for its health endpoint, and runs the Postman collection through Newman. | Installation, audit, database seed, API startup, health check or a Newman assertion fails. |
| `containers` | Builds the backend and production frontend Docker images, starts both with MongoDB through Compose, waits for all three health checks, then checks the direct API, the frontend route and the proxied API. Uploads container status and logs. | A build, startup, health check or HTTP smoke test fails. |
| `sonarqube` | When enabled, waits for `backend` and `frontend`, generates backend and frontend LCOV reports, checks for the Cloud credentials, runs `SonarSource/sonarqube-scan-action@v8.3.0`, and waits for the quality gate. | Required configuration is missing, analysis fails, or the Cloud quality gate fails. It is **skipped by default here** because the organization blocks the connection. |
| `ci-result` | Runs even when an earlier job fails. It requires `backend`, `frontend`, `api-integration` and `containers` to succeed. It requires `sonarqube` to have been skipped when disabled, or to succeed when enabled. | Any required result differs from the expected status. |

`api-integration` uploads the Newman HTML report as a `newman-report` artifact even when the test job fails; on failure it also uploads the API log. The MongoDB service and generated secret exist only for that CI run. The workflow does not deploy the application.

![Classroom50 CI run showing passing backend, frontend, API integration, Docker Compose smoke test and final check, with SonarQube Cloud skipped](Screenshots/part3-ci-classroom-successful-run.png)


#### `CI and static analysis` in the SonarQube test repository

The [test repository](https://github.com/st10437348/insy7314-final-poe-SonarQube-test) has the same backend, frontend, Newman integration and container checks. Its `sonarqube` job is **required** rather than conditional. It starts only after backend and frontend checks succeed, installs both packages, creates their LCOV coverage reports, and scans the source with the official SonarQube action. The action waits for the SonarQube Cloud quality gate, so a completed scan with a failed gate fails the job. Its final `ci-result` requires all five jobs to succeed; a skipped or failed SonarQube job cannot produce a green result. The test repository did not retain CodeQL as a second scanner because GitHub code scanning was unavailable there; SonarQube Cloud supplied the static analysis and quality gate.

The [Sonar project configuration](sonar-project.properties) scans `Project/server` and `Project/client/src`, identifies test directories separately, and imports backend and frontend LCOV reports. Generated files, dependencies and tests are excluded from source analysis. One-off backend CLI scripts are excluded from **coverage**; application controllers, models, pages and the frontend entry point remain in scope. This distinction matters because an untested source file appears as uncovered in SonarQube Cloud even if a test runner's own report lists only imported files.

![SonarQube test repository showing all seven successful checks](Screenshots/part3-ci-all-checks-passed.png)

![Successful CI workflow run with backend, frontend, API integration, Docker and SonarQube jobs](Screenshots/part3-ci-successful-run.png)

![CI artifacts containing Docker Compose evidence and the Newman report](Screenshots/part3-ci-artifacts.png)

### SonarQube Cloud analysis and fixes

The Cloud results below come from the separate SonarQube test repository, not from a scan of this Classroom50 repository. The latest successful analysis appears first; historical findings and fixes follow. A passing quality gate does not mean every dependency risk has been resolved.

#### Latest SonarQube Cloud results

The SonarQube Cloud summary screenshot below shows the test repository's analysis for commit `5c255da6`. The quality gate passed, overall coverage was **83.5%**, duplication was **1.3%**, and the summary showed zero open security, reliability or maintainability issues. The issue-list screenshot below, filtered to Open and Confirmed, shows **zero issues**. The summary still lists **20 dependency risks**.

![Latest SonarQube Cloud summary showing a passing quality gate, 83.5% coverage and 20 dependency risks](Screenshots/part3-sonar-latest-summary.png)

![Latest SonarQube Cloud issue list showing zero Open or Confirmed issues](Screenshots/part3-sonar-zero-open-issues.png)

#### Initial project health and code findings

The first Cloud overview showed a passing quality gate alongside **38 overall-code issues**, **43.9% overall coverage** and **1.4% duplication**. Its security snapshot showed rating **E** and four security issues; reliability was **C** with 34 issues; maintainability was **A** with four issues; security hotspots showed **A** and zero hotspots. This prompted a review of the issue list despite the passing gate.

![Historical SonarQube Cloud overview: 38 issues, 43.9% coverage, 1.4% duplication](Screenshots/part3-sonar-initial-overview.png)

| Cloud finding | Change made in the application |
| --- | --- |
| Three Blocker NoSQL injection issues in registration, booking creation and gig search | Registration uses a scalar email equality filter. Booking creation converts a validated gig ID to a MongoDB `ObjectId`. Gig search uses fixed query fields, escaped literal search text and numeric bounds. These changes prevent request data from becoming MongoDB query operators. |
| Medium reliability findings for unhandled promises across page loaders and navigation | Async effect loaders explicitly start with `void` and handle their own errors; async navigation is awaited where appropriate. Server startup and seed entry points handle rejected promises. |
| Super-linear email-validation regex in the admin controller | Replaced the expression with bounded, deterministic checks so long crafted input does not cause excessive backtracking. |
| Number parsing style and reliability findings in the create-gig form | Uses `Number.parseFloat`, `Number.parseInt` and `Number.isNaN` for the numeric inputs. |

![Historical SonarQube Cloud list of three Blocker NoSQL injection findings](Screenshots/part3-sonar-initial-nosql-issues.png)

#### Coverage and the quality gate

A later Cloud scan reported **30.26% coverage on 74 new lines**, below the Sonar way gate's **80% new-code coverage** condition. It showed **zero new issues**, but the gate still failed. Backend coverage had been imported while frontend source appeared at 0% because its LCOV report was missing from the scan. The CI scan was changed to generate and import both reports, and tests were added around changed page loaders, navigation and validation. A later GitHub Actions run showed the SonarQube Cloud quality-gate job passing. That passing run does not establish a new overall-coverage percentage by itself.

The Cloud coverage views subsequently showed **57.1%**, then **59% overall coverage**. The 59% view identified large gaps in admin, user and transaction controllers and in several admin, booking and transaction pages. Tests were added for access control, status changes, filtering, deletion and rendered user interactions. Coverage reporting was expanded to include all frontend source files; an unused `AppRoutes.jsx` file with stale imports was removed. The API helper was also fixed to preserve default JSON headers when callers provide other headers. The latest Cloud summary above for commit `5c255da6` shows **83.5% overall coverage**.

![Historical failed SonarQube quality gate: 30.26% new-code coverage against 80% required](Screenshots/part3-sonar-failed-coverage-gate.png)

![Historical SonarQube Cloud overall coverage at 57.1%](Screenshots/part3-sonar-overall-coverage-57-percent.png)

![Historical SonarQube Cloud server coverage at 59.0%](Screenshots/part3-sonar-server-coverage-59-percent.png)

#### Dependency risks and the remaining security finding

SonarQube Cloud displayed **89 dependency-risk entries** before the dependency review. The application did not import the direct `node.js@0.0.1-security` npm package, so it was removed; Node.js comes from the runtime, not that package. Dependency locks were updated to patched `handlebars`, `node-forge`, `qs` and `lodash` versions where applicable. Runtime dependency audits were added to CI. The earlier 89 is a historical baseline. The latest Cloud summary above shows **20 dependency risks remaining**, so the passing quality gate does not mean all dependency risks were cleared.

The SonarQube Cloud dependency-risk list records the remaining **20 entries** (several entries refer to different versions of the same package or different findings in one package):

| Dependency scope | SonarQube Cloud findings | Why they remain and what is still needed |
| --- | --- | --- |
| Development dependencies: **20 entries** | Transitive versions of `flatted`, `underscore`, `csv-parse`, `jose`, `picomatch`, `@faker-js/faker`, `uuid`, `uri-js`, `file-type` and `braces`. Most come through Newman or its HTML reporter; `picomatch@4.0.7` also comes through frontend Vite/Vitest tooling. The `braces` entry is marked **withdrawn** in that list, so it should not be described as an active vulnerability. | These packages are installed for API tests, reports, frontend builds or tests. They are not in the production backend image, which installs with `--omit=dev`, or the final frontend image, which serves built assets with Nginx. They still run in development and CI. Changing an application source file cannot patch a transitive package. The parent tools need compatible updates or carefully tested overrides; the team has not verified a change that clears these Cloud findings while preserving the required checks. |

The 20 entries are **not proven unfixable**. They were left open because a safe, tested dependency change had not been established for that scan; the runtime `sift` finding deserves priority. The passing quality gate and zero open *code issues* shown above do not clear these separate dependency-risk entries.

[Screenshot: SonarQube Cloud dependency-risk list showing the 20 remaining entries, including the runtime `sift` finding.]

A later Cloud issue list showed **one open Low security issue**: possible log injection in `Project/server/middleware/errorMiddleware.js`. The fallback logger previously included the request URL and error name, which could contain attacker-controlled newlines. It now logs a generated incident ID and returns that ID in the `X-Incident-Id` response header while keeping the same safe 500 response body. A regression test checks that forged newline text is absent from the log. The screenshot of the open issue predates this fix; the latest Cloud issue-list screenshot above shows zero open or confirmed issues, without listing individual issue histories.

![Historical SonarQube Cloud log-injection finding before the fix](Screenshots/part3-sonar-log-injection.png)

#### Dockerfile findings from the container scan

After Docker support was added, SonarQube Cloud reported two open issues in `Project/server/Dockerfile`: a High security finding for recursively copying the whole build context and a Medium security finding for allowing npm lifecycle scripts during installation. The GitHub Actions Docker Compose smoke test passed on that run, but the SonarQube Cloud quality gate failed.

The backend image now copies runtime JavaScript files from specified source directories plus the certificate generator, admin bootstrap command and certificate configuration, so local `.env` files, tests, seed data and other build-context contents cannot be swept into the image by a broad `COPY . .`. Its production dependency install uses `npm ci --ignore-scripts`; the backend lockfile does not mark any dependency as requiring an install script. A local rebuild confirmed that MongoDB, the API and the client became healthy, and the direct API, proxied API and login page all returned HTTP 200. The latest Cloud screenshots above show a passing quality gate and zero open or confirmed issues; they do not display the individual finding histories.

![Historical SonarQube Cloud Dockerfile findings before the fix](Screenshots/part3-sonar-dockerfile-issues.png)

![GitHub checks showing Docker Compose smoke test passing while the SonarQube quality gate failed](Screenshots/part3-ci-docker-passed-sonar-failed.png)

#### Admin bootstrap email validation finding

A later SonarQube Cloud scan flagged the email-format expression in `Project/server/scripts/bootstrapAdmin.js` for possible super-linear backtracking. The admin command now checks the length, local part and domain labels with bounded string operations instead of that regular expression. It still accepts ordinary admin addresses such as `admin2@hustlehub.test`; password rules and account-lockout clearing are unchanged. The latest Cloud issue-list screenshot above shows zero open or confirmed issues; it does not display this finding's individual history.

![Historical SonarQube Cloud admin email regex finding before the fix](Screenshots/part3-sonar-bootstrap-admin-regex.png)

#### Later NoSQL injection findings

A later Cloud scan showed two Blocker NoSQL injection findings in the marketplace gig query and completed-gig synchronisation. The marketplace now queries MongoDB with fixed fields and applies request search, category and price filters to the returned gigs. The synchronisation converts each stored gig ID to a validated `ObjectId` before an individual update. Backend regression tests cover these changes; the latest Cloud issue-list screenshot above shows zero open or confirmed issues, without displaying each finding's individual history.

![Historical SonarQube Cloud list of the two later Blocker NoSQL injection findings before the fixes](Screenshots/part3-sonar-later-nosql-issues.png)

SonarQube Cloud findings guided the code changes above; the scanner and gate continue to report remaining risks and coverage gaps. The separate test repository provides the Cloud analysis because the Classroom50 repository itself cannot currently connect to that service.

## 17. Logging and monitoring

HustleHub+ records every important action as a **structured JSON log event** and sends it to **Better Stack**, a cloud log platform, as well as to the terminal and local log files. Each line answers *what happened, to whom, from where, and in which request*, so the team can investigate an incident, spot an attack while it is happening, and prove what the system did.

### 17.1 How it works

| Part | File | Purpose |
| --- | --- | --- |
| Logger | `Project/server/utils/logger.js` | Winston logger. Writes one JSON object per line, cleans every value, and sends entries to up to three destinations. |
| Request logger | `Project/server/middleware/requestLogger.js` | Gives each request a unique ID (returned in the `X-Request-Id` header) and writes one `http.request` entry with method, route, status code and duration. |
| Event calls | Controllers and middleware | `logEvent(level, "area.action.result", req, details)` at each security or business event (table below). |

**Where logs go**

| Destination | When | Used for |
| --- | --- | --- |
| **Better Stack** (cloud) | When `BETTER_STACK_SOURCE_TOKEN` and `BETTER_STACK_INGESTING_HOST` are set | Central, searchable storage that survives restarts and containers; live tail, filters, dashboards and alerts |
| Terminal (stdout) | Always | Local development, `docker logs`, GitHub Actions output |
| `Project/server/logs/app.log` | Unless `LOG_TO_FILE=false` | Every entry, rotated at 5 MB (5 files kept) |
| `Project/server/logs/security.log` | Unless `LOG_TO_FILE=false` | `warn` and `error` entries only: a quick list of suspicious activity |

Log files are git-ignored. During automated tests the logger is silent, unless `LOG_LEVEL` is set.

**Every entry contains** `timestamp`, `level`, `event`, `category` (the part before the first dot), `service` (`hustlehub-api`), `environment`, the `requestId`, the client `ip`, and, for signed-in users, `userId` and `userRole`, plus the event's own details. Because all events from one request share a `requestId`, a booking can be followed from the HTTP request to the booking and the transaction it created.

Example (one line in the log, formatted here for reading):

```json
{
  "timestamp": "2026-11-08T13:18:02.658Z",
  "level": "warn",
  "event": "auth.login.failed",
  "category": "auth",
  "reason": "wrong_password",
  "email": "c***@hustlehub.test",
  "accountKey": "a0e5f9a06b02aac0",
  "failedCount": 1,
  "ip": "127.0.0.1",
  "requestId": "b6e090f2-f7b8-46a0-844b-8a9531a3eb75",
  "service": "hustlehub-api",
  "environment": "development"
}
```

### 17.2 What is logged and why

| Area | Events | Level | Why it matters |
| --- | --- | --- | --- |
| **Login attempts** | `auth.login.success`, `auth.login.failed` (with `reason`: `unknown_email`, `wrong_password`, `inactive_account`, `no_local_password`, and `failedCount`) | info / warn | Shows who signed in and when. Repeated failures reveal password guessing or credential stuffing. The reason is logged for investigators but never shown to the user. |
| **Account lockout** | `auth.account.locked`, `auth.login.blocked_locked` | error / warn | A brute-force attack against one account. `error` level so it stands out and can trigger an alert. |
| **Registration and logout** | `auth.register.success`, `auth.register.duplicate`, `auth.logout` | info / warn | Account creation history; repeated duplicate attempts can indicate email enumeration. |
| **Tokens** | `auth.token.invalid` (expired, forged or malformed), `auth.token.revoked`, `auth.token.account_unavailable` | warn | Forged or reused tokens are a sign of session hijacking. |
| **Access control** | `access.denied.role`, `access.denied.booking`, `access.denied.transaction` | warn | A user trying to reach another role's routes or someone else's data, which is the main sign of privilege-escalation or IDOR probing. |
| **Bookings** | `booking.created`, `booking.create.rejected`, `booking.status.changed` (from/to), `booking.status.rejected` | info / warn | An audit trail of every booking and status change, for disputes and fraud checks. |
| **Transactions** | `transaction.created` (amount, fee, freelancer amount, invoice), `transaction.status.changed`, `transaction.payout.recorded`, `transaction.payout.rejected`, `transaction.create.failed` | info / warn / error | A financial audit trail: every amount the platform records or pays out can be traced to a request and a user. |
| **Attacks blocked** | `security.rate_limit.auth`, `security.rate_limit.booking`, `security.origin.blocked` | warn | Shows when the rate limits and the CSRF origin check stop real traffic. |
| **Admin actions** | `admin.user.updated` (fields changed, new role, deactivation), `user.account.deactivated` | info / warn | Who changed whose role or disabled whose account. Privileged actions must be accountable. |
| **Errors** | `server.error` (with `incidentId`, route and error class), `server.unhandled_rejection`, `server.uncaught_exception` | error | Unexpected failures. The `incidentId` is also returned to the user in the `X-Incident-Id` header, so a user's report can be matched to the exact log line. |
| **Server lifecycle** | `server.started`, `server.stopping`, `server.start_failed` | info / error | Shows restarts, crashes and deployments. |
| **Every request** | `http.request` (method, route, status, duration) | info, or warn for 4xx and error for 5xx | Traffic, error rates and slow endpoints. |

### 17.3 Keeping the logs safe

Logs are only useful if they can be trusted and do not become a data leak themselves.

- **No secrets:** any field whose name looks like a password, token, secret, cookie, session or authorization header is replaced with `[redacted]`. Passwords and JWTs are never passed to the logger at all.
- **No full email addresses:** emails are masked (`c***@hustlehub.test`) and paired with a short SHA-256 `accountKey`, so repeated attempts on one account can be linked without storing the address.
- **No log injection:** every entry is one JSON object, control characters such as `\r\n` are removed, and strings are capped at 200 characters, so attacker input cannot forge extra log lines. This matches the log-injection fix made after the SonarQube review (section 16).
- **No raw URLs:** the route is logged as a cleaned label (for example `/api/bookings/:param/status`); IDs, query strings and other user-typed text are dropped.
- **Errors are not exposed:** the error message and stack stay on the server. The client only receives the generic message and the incident ID.

### 17.4 Setting up Better Stack (cloud logging)

1. Create a free account at [betterstack.com](https://betterstack.com), go to **Sources** and click **Connect source**.
2. Name it `HustleHub API`, choose **Node.js** as the platform, and create the source.
3. Open the source and click **Configure**. Copy the **Source token** and the **Ingesting host** into `Project/.env`:

   ```env
   BETTER_STACK_SOURCE_TOKEN=your-source-token
   BETTER_STACK_INGESTING_HOST=s123456.eu-nbg-2.betterstackdata.com
   ```

4. For local `npm run dev`, restart the API. For Docker Compose, put the same two values in an ignored `.env` **beside `compose.yaml`**, or export them in the PowerShell session that starts Compose. Compose does not automatically read `Project/.env`. Keep `JWT_SECRET` set as described in section 19, then run `docker compose up -d --build --wait` to recreate the API with the new values.
5. Check `docker compose logs --tail=30 api` for the `server.started` event with `"cloudLogging":"better-stack"`. This shows the cloud transport was enabled; confirm delivery in Better Stack's **Live tail** ([Better Stack Winston guide](https://betterstack.com/docs/logs/javascript/winston/)).

Useful searches in Better Stack: `event:auth.login.failed`, `level:error`, `category:transaction`, `event:auth.account.locked`, or a `requestId` to see everything from one request. The token is a secret: it lives only in `.env` (or the Docker environment / a GitHub Actions secret) and is never committed. Without these two values the app still logs to the terminal. Local file logs are also available outside Docker; Compose sets `LOG_TO_FILE=false` so container logs go to stdout.

### 17.5 Logging evidence

**Better Stack Live tail:** HustleHub API events arriving in the cloud (`http.request`, `auth.login.success`, `booking.created`, `transaction.created`).

![Better Stack live tail](Screenshots/20-betterstack-live-tail.png)

**Failed logins in Better Stack:** masked emails, the failure reason and the failed count for each attempt.

![Better Stack failed logins](Screenshots/21-betterstack-failed-logins.png)

**A transaction audit entry:** amount, platform fee, freelancer amount, invoice number and request ID.

![Better Stack transaction entry](Screenshots/22-betterstack-transaction-entry.png)

**Local security log:** `Project/server/logs/security.log` contains only warn and error entries.

![Security log file](Screenshots/23-security-log-file.png)

**Automated tests** for logging, account lockout and session revocation, all passing.

![Logging and security tests](Screenshots/24-logging-tests.png)

---

## 18. Additional security features

Parts 1 and 2 already cover the minimum controls: HTTPS, bcrypt, JWT in an HttpOnly cookie, RBAC, validation, rate limiting, Helmet/CSP and the CSRF origin check. Part 3 adds two security features beyond those minimums. Both are fully tested, logged, and need no frontend changes, because the React app already shows the API's message and already calls the logout endpoint.

### 18.1 Feature 1: Per-account lockout after repeated failed logins

**The gap it closes.** The Part 2 rate limiter counts requests **per IP address**. An attacker spreading guesses across many IP addresses (a botnet or rotating proxies) could still try unlimited passwords against **one** account.

**How it works** (`services/accountLockout.js`, `models/LoginAttempt.js`, `controllers/authController.js`):

1. Every failed sign-in for an email address is counted in the `loginattempts` collection. The address is stored only as a SHA-256 hash.
2. **5 failures within 15 minutes lock that account for 15 minutes.** The fifth failure, and every attempt during the lock, returns `429` with a `Retry-After` header and the message *"Too many failed sign-in attempts. This account is temporarily locked. Try again later."*
3. While locked, **even the correct password is refused** and no session cookie is issued. The password is not even checked, which also saves CPU.
4. A successful sign-in resets the counter. Locks expire on their own, and a MongoDB TTL index deletes old records.
5. **No account enumeration:** unknown email addresses are counted and locked the same way, so an attacker cannot use the lockout to discover which emails are registered. Before the lock, every failure still returns the same generic *"Invalid email or password."*
6. Every failure is logged as `auth.login.failed` with its reason and count, and the lock itself as `auth.account.locked` (level `error`).

The limits can be changed in `.env` (`LOGIN_MAX_FAILED_ATTEMPTS`, `LOGIN_ATTEMPT_WINDOW_MINUTES`, `LOGIN_LOCKOUT_MINUTES`). The trade-off is that someone who knows a user's email could lock them out for 15 minutes. The short, automatic unlock keeps that impact small, and the IP rate limiter still limits how fast one attacker can do it.

| | Before (Part 2) | After (Part 3) |
| --- | --- | --- |
| 1 attacker, 1 IP | Blocked after 30 requests / 15 min | Account locked after 5 wrong passwords |
| Many IPs, 1 account | Unlimited guesses | Account locked after 5 wrong passwords |
| Correct password during an attack | Accepted | Refused until the lock expires |

### 18.2 Feature 2: Server-side session revocation

**The gap it closes.** A JWT is valid until it expires (up to 7 days with the current settings). Before this change, *logging out only deleted the cookie in the browser*. A token that had been copied, for example through a shared computer, malware or a leaked request log, kept working for days. Likewise, a user who was deactivated or had their role changed kept their existing session.

**How it works** (`models/User.js`, `controllers/authController.js`, `middleware/authMiddleware.js`):

1. Every user has a `tokenVersion` number. Each JWT records the version it was issued with (`tv`).
2. On every protected request, `protect` compares the token's version with the user's current version. If they differ, the request is rejected with `401` *"Session has ended. Please log in again."* and an `auth.token.revoked` event is logged.
3. The version is increased when:
   - the user **logs out**, so every token issued before the logout stops working at once, on every device;
   - an admin **changes the user's role** or **deactivates** the account;
   - a user **deletes (deactivates)** their own account, or an admin removes it.
4. Editing other profile details does not log anyone out. Tokens issued before this feature (with no version) count as version 0, so existing sessions keep working until the next logout.

### 18.3 Related hardening by the team

During the SonarQube review (section 16), the team also fixed three NoSQL-injection findings: scalar `$eq` email filters, validated `ObjectId` conversion for bookings, and escaped literal gig search. The login lookup added in this part uses the same `$eq` filter.

### 18.4 How the features are tested

| Test | What it proves |
| --- | --- |
| `test/account-lockout.test.js` (9 tests) | Locks on the 5th failure with `Retry-After`; email case and spaces cannot bypass it; the correct password is refused while locked; success resets the counter; locks and windows expire; only a hash is stored; unknown emails lock identically. |
| `test/session-revocation.test.js` (9 tests) | Login puts the version in the JWT; logout revokes a copied token; an invalid logout revokes nothing; revoked tokens fail on role-protected routes; role changes and deactivation revoke; ordinary profile edits do not. |
| `test/logging.test.js` (14 tests) | Request IDs and route labels; login, booking, transaction, access-denied, invalid-token, blocked-origin, rate-limit and error events; secrets redacted, emails masked, no log injection, no raw URLs. |
| Postman, main collection, folder 7 | A token copied before logout works, logout succeeds, and the same token is then rejected with `401` *Session has ended*. |
| Postman, `HustleHub Part 3 - Account Lockout Demo` (`npm run test:lockout`) | Four `401`s, a `429` lock with `Retry-After`, the correct password refused while locked, an unknown email locked the same way, and another account unaffected. |

### 18.5 Security feature evidence

**Account lockout demo** (`npm run test:lockout`): the 401s, the 429 lock and an unaffected account.

![Lockout Newman run, part 1](Screenshots/25.1-lockout-newman.png)

![Lockout Newman run, part 2](Screenshots/25.2-lockout-newman.png)

**Session revocation** (`npm run test:api`, folder 7): a token copied before logout is rejected afterwards.

![Revocation Newman run](Screenshots/26-revocation-newman.png)

**Lockout in the app:** the login page after five wrong passwords.

![Locked login page](Screenshots/27-lockout-login-page.png)

**Both features in Better Stack:** `auth.account.locked` and `auth.token.revoked` events.

![Better Stack auth.account.locked event](Screenshots/28.1-betterstack-security-events.png)

![Better Stack auth.token.revoked event](Screenshots/28.2-betterstack-security-events.png)

---

## 19. Docker Compose and container CI

The [Compose stack](compose.yaml) runs three services. `mongo` stores application data in a named volume and is reachable only inside the Compose network. `api` uses the [backend Dockerfile](Project/server/Dockerfile) with Node.js 22 and production dependencies, generates a local HTTPS certificate when it starts, and listens on `0.0.0.0:5000` inside its container. `client` uses a multi-stage [frontend Dockerfile](Project/client/Dockerfile): Vite builds the React application, then Nginx serves the built files over HTTPS on host port 5173. Nginx sends `/api/` requests to the backend over the internal network, so the browser uses one origin for the page and API. All three services have health checks; Compose waits for MongoDB before the API and for the API before the client.

The local certificates are self-signed demonstration certificates. Browser access to `https://localhost:5173` therefore requires accepting the certificate warning. The API is also available directly at `https://localhost:5000/api/test`. The MongoDB port is not published to the host. The JWT secret is supplied at runtime and is not built into either image. Optional Better Stack credentials are also supplied at runtime; without them, the API continues to log to the container output.

### Run the containers

From the repository root in PowerShell, generate a fresh secret and start the stack:

```powershell
$secretBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
$env:JWT_SECRET = [BitConverter]::ToString($secretBytes).Replace('-', '').ToLowerInvariant()
docker compose up --build --wait
docker compose ps
```

Open `https://localhost:5173`. The following requests check both the frontend and the proxied API:

```powershell
curl.exe -k https://localhost:5173/login
curl.exe -k https://localhost:5173/api/test
```

`docker compose logs api client` shows container output. `docker compose down` stops the stack while keeping the MongoDB volume; `docker compose down -v` also deletes the stored database.

### Create or reset the Docker admin account

The Docker MongoDB volume is separate from the local development database. A new volume therefore does not contain the admin created by the development seed script. That seed script deletes other development records and is blocked in production mode; do not use it to set up Docker. Instead, run the following in the **same PowerShell window** after `docker compose up --build --wait`:

```powershell
$securePassword = Read-Host "Choose a new admin password" -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new("", $securePassword).Password
try {
    $plainPassword | docker compose exec -T api node scripts/bootstrapAdmin.js admin@hustlehub.test
} finally {
    Remove-Variable plainPassword -ErrorAction SilentlyContinue
    Remove-Variable securePassword -ErrorAction SilentlyContinue
}
```

Choose 8–128 characters with uppercase, lowercase, a number and one of `@$!%*?&`. Sign in at `https://localhost:5173/login` with `admin@hustlehub.test` and the password you chose. The command creates the admin if missing or resets only that admin's password, clears its login lockout and revokes its old sessions; it does not erase bookings, transactions or other users. The password is passed through standard input and is not stored in the repository or placed on the command line.

### GitHub Actions container check

The required `containers` job in [CI and static analysis](.github/workflows/ci.yml) creates an isolated JWT secret on its Ubuntu runner, validates the Compose file, builds both application images, and runs the stack until all three health checks pass. It then requests the backend directly, requests the frontend's `/login` route, and requests `/api/test` through the Nginx proxy. A failed build, unhealthy container or failed HTTP request fails the job. Container status and logs are uploaded as the `docker-compose-evidence` artifact even on failure; the job then removes its disposable containers and database volume. The final `ci-result` check requires this job to succeed alongside the other required jobs. This pipeline builds and runs the containers; it does not deploy them.

[Screenshot: GitHub Actions `containers` job showing the two application containers and MongoDB healthy, with the HTTP smoke checks passing.]

[Screenshot: `docker compose ps` showing the `api`, `client` and `mongo` services running and healthy.]


## Security Review Report
### Introduction
The HustleHub+ platform is built on a MERN architecture (MongoDB, Express, React, Node.js). It has end-to-end security designed into every layer. Security is enforced strictly on the server side, which ensures that the client side controls server purely for user experience rather than security enforcement. By combining role-based access control, input validation, rate limiting, and centralized auditing, the architecture guarantees robust defence-in-depth against common web application vulnerabilities.

### Threats vs Implemented Protections
1)	Injection Attacks (Database Manipulation)
The Threat: Attackers send malicious database commands in request data to bypass logins or access unauthorised data.
Our Solution: We validate every input to ensure strings, numbers, and ID’s match expected formats before touching MongoDB. We also escape search text and force exact-match filters on sensitive queries. We do this so that submitted data cannot be executed as database commands. Specifically, incoming route parameters undergo explicit ObjectId casting via custom validators to ensure malformed criteria fail safety before query executions.

2)	Cross-Site Scripting (XSS)
The Threat: Attackers inject malicious scripts into fields like profile bios or gig listings to steal user sessions or hijack accounts.
Our Solution: We strip HTML tags from all inputs. Login tokens are stored in HttpOnly browser cookies that JavaScript cannot read, preventing script-based token theft. Additionally, React automatically screens text before rendering, while backend and Vite Helmet configurations enforce Content Security Policies (CSP). This is to restrict script origins and prevent untrusted code executions.

3)	Weak Authentication & Session Exploits
The Threat: Attackers attempt to guess passwords using automated bots or hijack active user sessions.
Our Solution: Entered Passwords must meet complexity requirements and are safely hashed using bcrypt. To block brute-force attacks, accounts automatically lock for minutes after five failed login attempts. To p prevent stale token reuse, the system tracks a database driven tokenVersion on each profile, which instantly revokes active sessions across all devices whenever a user logs out, deactivates their account, or has their role changed.

4)	Broken Access Control & Privilege Escalation
The Threat: Users attempt to access features or edit records belonging to someone else (for example: a client trying to edit or delete a freelancer’s gig.)
Our Solution: Middleware checks both the user’s role and whether they own the specific record before granting access. Unauthorised requests return clean error messages. We make sure that there error messages are returned without revealing whether a private record exists. Critical values like pricing and fees are are set strictly by the server and database, ignoring any tampered values in the request.

5)	Cross-Site Request Forgery (CSRF)
The Threat: A Malicious website tricks a logged in user ‘s browser into performing unwanted actions on our app.
Our Solution: We use SameSite=Lax cookie protection alongside custom server checks that inspect the origin of incoming requests. Any state-changing action coming from an untrusted site is blocked immediately. This strict origin validation provides a crucial second layer of defence against cross-site requests that bypass standard cookie policy boundaries.

6)	Rate Limiting & Denial of Service (DoS)
The Threat: Bots flood authentication or booking pages with excessive requests to crash the server or brute force logins.
Our Solution: We limit IP Addresses to 30 Login attempts per minutes and gig bookings per hour. We also cap JSON request payload sizes to 32 KB to prevent memory overload. Standardized IETF RateLimit headers are returned in every response, allowing legitimate API consumers to track their remaining quota window gracefully.

7)	Information Leakage & Security Misconfigurations
The Threat: System errors leak sensitive server details, stack traces, or database structures to attackers.
Our Solution: Helmet headers hide underlying server technologies. A central error handler masks internal technical details, returning plain error messages. Structured JSON logs are sanitized by masking user email hashes, redacting tokens, and appending unique X-Incident-Id context headers to assist operational debugging without exposing underlying stack traces.

### Conclusion
The Security Architecture of HustleHub+ demonstrates a robust, defense-in-depth approach tailored specifically for modern web applications. By embedding security directly into the backend server- through server-side session revocasion, role based access control, strict input validation, and per-account lockout mechanisms- the system eliminates single points of failure and prevents client side tamperingg. Paired with structured cloud logging and automated testing pipelines, HustleHub+ ensures that all business logic remains secure, operational events stay fully auditable, and platform integrity is maintained aggainst evolving web applications.

### Reference List
 Hostinger. 2025. Web Application Security: What it is and how it works, 24 June 2025. [Online]. Available at: https://www.hostinger.com/tutorials/web-application-security/?utm_source=google&utm_medium=cpc&utm_id=23195310693&utm_campaign=Generic-Tutorials-DSA-t2|NT:Se|LO:Other-AFRICA&utm_term=&utm_content=781442702147&gad_source=1&gad_campaignid=23195310693&gbraid=0AAAAADMy-haKqvFZk5ZDgwxDwoRqHaYr6&gclid=CjwKCAiA2MDXBhBUEiwAD-YB-7fsCeh_qM7IWMx1R0rh7uQwBh0mqGFeDEtk9G0iO9RYLdpo7reTrhoCPYEQAvD_BwE
[Accessed 09/11/2026]


I Ruan Hartman, ST10453370 made use of Gemini AI to format the security report. See screenshot of the Chat below: <img width="1182" height="867" alt="Screenshot 2026-11-09 094638" src="https://github.com/user-attachments/assets/a48cd11c-94e9-40f6-9914-20c77016bf95" />

---

**Part 2**

## 1. Team and contributions

| Student number | Name |
| --- | --- |
| ST10258513 | Clifford Naude |
| ST10453370 | Ruan Helgaard Hartman |
| ST10438433 | Caleb Forbes |
| ST10437348 | Alexandro Ornelas |

Part 2 was split by marking criterion.

| Area (marks) | Owner | What was delivered | README section |
| --- | --- | --- | --- |
| Backend API / application functionality (20) | `Ruan Helgaard Hartman` | Gig, booking, transaction, income, admin and user endpoints; Mongoose models; booking lifecycle; simulated payment and transaction records; income aggregation; API usage logging; seed data | [6](#6-backend-api) |
| RBAC enforcement (15) | `Alexandro Ornelas` | `protect` + `authorizeRoles` middleware, per-route role rules, ownership checks on gigs, bookings and transactions, admin-only routes, no Admin self-registration | [7](#7-role-based-access-control-rbac) |
| API security: JWT, validation, sanitisation (15) | `Clifford Naude` | HttpOnly cookie JWT, account re-check on every request, express-validator rules, marketplace validators, NoSQL/XSS rejection, safe error handling, CSRF origin check | [8](#8-api-security-jwt-validation-and-sanitisation) |
| Rate limiting and security headers (20) | `Alexandro Ornelas` | `express-rate-limit` on auth and booking routes, Helmet configuration, API and frontend Content Security Policies, CORS | [9](#9-rate-limiting-and-security-headers) |
| React frontend (10) | `Clifford Naude` | React 19 + Vite app, auth context, protected and role routes, client/freelancer/admin pages, error and loading states, HTTPS dev server | [10](#10-react-frontend) |
| Backend testing, frontend testing, README, GitHub (20) |  `Caleb Forbes` | Updated Part 1 tests for cookie auth; new RBAC/security tests; Part 2 Postman collection and Newman scripts; rate-limit demo; Vitest + React Testing Library suite; README; repository management | [11](#11-testing) |

---

## 2. Features

### What each role can do

| Capability | Visitor | Client | Freelancer | Admin |
| --- | :---: | :---: | :---: | :---: |
| Register / log in | ✅ | N/A | N/A | N/A |
| Browse, search and filter the marketplace | ✅ | ✅ | ✅ | ✅ |
| View gig details | ✅ | ✅ | ✅ | ✅ |
| Book a gig (simulated payment) | ❌ | ✅ | ❌ | ❌ |
| View own bookings and transactions | ❌ | ✅ | ✅ | ✅ (all) |
| Create, edit, pause and delete **own** gigs | ❌ | ❌ | ✅ | ❌ |
| Accept, start and complete bookings on own gigs | ❌ | ❌ | ✅ | ✅ |
| Cancel a booking | ❌ | ✅ (own) | ✅ (own) | ✅ |
| Freelancer dashboard and income page | ❌ | ❌ | ✅ | ❌ |
| Edit or deactivate own profile | ❌ | ✅ | ✅ | ✅ |
| Manage users, moderate gigs and bookings | ❌ | ❌ | ❌ | ✅ |
| Analytics and API usage reports | ❌ | ❌ | ❌ | ✅ |

### End-to-end flow

```mermaid
flowchart LR
    A[Register / Login] --> B[Freelancer creates gig]
    B --> C[Client browses marketplace]
    C --> D[Client books gig]
    D --> E[Booking + Transaction created]
    E --> F[Freelancer accepts, starts, completes]
    F --> G[Transaction completed]
    G --> H[Income updated for freelancer]
```

---

## 3. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8 |
| Backend | Node.js, Express 5 (served over HTTPS) |
| Database | MongoDB with Mongoose 8 (local MongoDB or Atlas); `migrate-mongo` for indexes |
| Auth | `jsonwebtoken`, `bcryptjs`, `cookie-parser` |
| Security | `helmet`, `express-rate-limit`, `express-validator`, `cors` |
| Backend tests | Node.js test runner (`node --test`), Postman, Newman + `newman-reporter-htmlextra` |
| Frontend tests | Vitest, React Testing Library, `@testing-library/user-event`, jsdom |

---

## 4. Project structure

```text
.
├── README.md
├── docs/Part1-Report.md               Part 1 architecture report
├── PostmanCollection/                 Part 1 + Part 2 collections, rate-limit demo
├── NewmanReports/                     HTML reports produced by Newman
├── Screenshots/                       Application and test evidence
└── Project/
    ├── .env.example                   Backend environment template
    ├── package.json                   Root scripts (dev, seed, tests, Newman)
    ├── migrations/                    MongoDB index migrations
    ├── server/
    │   ├── app.js                     Express app: Helmet/CSP, CORS, origin check, rate limiters, routes
    │   ├── server.js                  HTTPS start-up (fails fast if config is missing)
    │   ├── config/                    Database connection, HTTPS certificate loading
    │   ├── controllers/               auth, user, gig, booking, transaction, income, admin
    │   ├── middleware/                protect, authorizeRoles, validators, error handler, API usage
    │   ├── models/                    User, Gig, Booking, Transaction, Review, Analytics, ApiUsage
    │   ├── routes/
    │   ├── scripts/                   Certificate generator, seed data
    │   └── test/                      Backend automated tests
    └── client/
        ├── vite.config.js             HTTPS dev server + CSP headers
        ├── vitest.config.js           Frontend test configuration
        └── src/
            ├── context/AuthContext.jsx
            ├── routes/                ProtectedRoute, RoleRoute
            ├── components/layout/     Navbar, Footer, Layout
            ├── pages/                 auth, marketplace, gig, bookings, transactions, dashboard, profile, admin
            ├── test/                  Test setup and helpers
            └── __tests__/             Frontend automated tests
```

---

## 5. Getting started

### Prerequisites

- Node.js 20 LTS or newer
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB Atlas connection string
- OpenSSL, used once to generate the local HTTPS certificate. Git for Windows includes it.
- Postman (optional, because Newman runs the same collection from the terminal)

### Step 1: Install dependencies

```bash
cd Project
npm install
npm install --prefix server
npm install --prefix client
```

### Step 2: Environment variables

**Backend:** create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
```

**Project Root:** create `Project/.env` (copy `Project/.env.example`):
```emv
MONGO_URI="local host using mongoDB compass or cloud using mongoDB atlas"

//When deploying, set NODE_ENV to production
NODE_ENV=development
MONGO_DB_DEV=test
MONGO_DB_PROD=INSY7314HustleHub+
MONGO_DB_NAME="INSY7314HustleHub+"

JWT_SECRET=node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

CLIENT_ORIGIN=https://localhost:5173

SSL_KEY_PATH=server\certificates\localhost-key.pem
SSL_CERT_PATH=server\certificates\localhost-cert.pem
```
Important Note, for development: NODE_ENV=development
For Production: NODE_ENV=production
This switches DBs from testing seeded data to production data and prevents accidental mix of data.

> `MONGO_DB_NAME` must contain `dev`, `local` or `test`. The seed script refuses to run on any other name, so it can never wipe a production database.
> Generate a strong secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

**Frontend:** create `Project/client/.env` (copy `Project/client/.env.example`):

```env
VITE_API_URL=https://localhost:5000
VITE_APP_NAME=HustleHub+
```

`.env` files and certificates are git-ignored and must never be committed.

### Step 3: Certificate and seed data

```bash
npm run generate-cert
npm run seed
```

Seeded accounts (password `Password123!`):

| Role | Email |
| --- | --- |
| Client | `client@hustlehub.test` |
| Freelancer | `john@hustlehub.test`, `sarah@hustlehub.test` |
| Admin | `admin@hustlehub.test` |

### Step 4: Run

```bash
npm run dev
```

| App | URL |
| --- | --- |
| Backend API | <https://localhost:5000> |
| Frontend | <https://localhost:5173> |

Both use a self-signed certificate. Open <https://localhost:5000> once and accept the browser warning, otherwise the frontend cannot reach the API. Then open <https://localhost:5173>.

To run them separately: `npm run server` and `npm run client`.

---

## 6. Backend API

The Express API is the core of the application: every business rule and every security check runs on the server.

### 6.1 Data model

```mermaid
erDiagram
    USER ||--o{ GIG : "creates (freelancer)"
    USER ||--o{ BOOKING : "books (client)"
    GIG ||--o{ BOOKING : "is booked in"
    BOOKING ||--|| TRANSACTION : "creates"
    USER ||--o{ TRANSACTION : "pays / earns"
```

| Collection | Key fields | Notes |
| --- | --- | --- |
| `users` | name, email (unique, lowercase), password (bcrypt hash), role (`Client` / `Freelancer` / `Admin`), isActive, bio, skills, phone, location | Deactivated users cannot log in or use existing tokens |
| `gigs` | freelancerId → User, title, description, category, price, deliveryDays, location.address, status (`active` / `paused` / `completed` / `deleted`), views | Completed gigs remain in My Gigs as read-only history; deletion is a soft delete |
| `bookings` | gigId, clientId, freelancerId, agreedPrice, bookingDate, status, completedAt | `agreedPrice` is copied from the gig at booking time |
| `transactions` | bookingId (unique), clientId, freelancerId, amount, platformFee, taxAmount, freelancerAmount, status, invoiceNumber, payoutDate | Exactly one per booking |
| `apiusages` | date, endpoint, method, statusCode, successful | Written by middleware on every request |
| `reviews`, `analytics` | Not used in Part 2 | Supporting collections |

Indexes are created by the `migrate-mongo` migrations in `Project/migrations/`. The Booking model also defines a unique partial index so only one pending, accepted or in-progress booking can reserve a gig at a time.

### 6.2 Booking and simulated payment

When a client books a gig (`POST /api/bookings`):

1. The server loads the gig. It must be `active`, and a freelancer cannot book their own gig.
2. A **booking** is created. The client is the logged-in user, and the price is copied **from the database**. Any price in the request body is ignored.
3. A **transaction** is created and linked to the booking, the client and the freelancer:

| Field | Calculation | Example (R1 000 gig) |
| --- | --- | --- |
| `amount` | gig price | R1 000.00 |
| `platformFee` | 10% of amount | R100.00 |
| `taxAmount` | R0.00 for new transactions; the annual estimate is calculated separately | R0.00 |
| `freelancerAmount` | amount - fee | R900.00 |
| `invoiceNumber` | `INV-<bookingId>` | `INV-6650…` |

If the transaction cannot be saved, the booking is rolled back, so a booking never exists without its transaction.

### 6.3 Booking lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: client books
    pending --> accepted: freelancer
    pending --> cancelled: client or freelancer
    accepted --> in_progress: freelancer
    accepted --> cancelled: client or freelancer
    in_progress --> completed: freelancer
    completed --> [*]
    cancelled --> [*]
```

- Completing a booking sets the transaction to `completed`; cancelling sets it to `refunded`.
- A pending booking reserves the gig and removes it from the public marketplace. Cancellation releases it; completion marks the gig `completed` and removes it permanently from public listings.
- Completed gigs remain visible in the freelancer's My Gigs as read-only records. The booking's client and freelancer can still open the gig details from their booking or gig history. Other users cannot access those details.
- When the API starts, it also marks gigs with older completed bookings as completed, so existing records follow the same rule.
- Any other jump (for example `pending → completed`) is rejected with `400`.
- Admins can record a **payout** on a completed transaction (`PATCH /api/transactions/:id/payout`). It can only be done once.

### 6.4 Income tracking

`GET /api/income` returns the logged-in freelancer's current South African tax-year totals from completed transactions and bookings. It groups each payment by the booking's completion date:

- **period:** tax year and its 1 March to 28 February bounds
- **summary:** gross earnings, platform fees, taxable platform income, estimated annual tax, income after estimated tax, and any historical recorded tax deductions
- **monthlyIncome:** twelve months of earnings after fees and before estimated tax
- **taxMethod:** the rate year, primary rebate, SARS source, and calculation assumptions

### 6.5 Admin and monitoring

- **Dashboard:** user counts by role, active gigs, bookings, completed bookings, platform revenue (fees from completed bookings) and total API requests.
- **Management:** users (role and active status; an admin cannot remove their own Admin role), gigs (pause or remove) and bookings (status).
- **API usage:** every request is logged with its endpoint, method and status code, then grouped by day and endpoint into success and failure counts.

### 6.6 Endpoint reference

All routes are relative to `https://localhost:5000`. 🔒 = valid JWT cookie required.

**Auth**

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public · rate limited | Register a Client or Freelancer |
| POST | `/api/auth/login` | Public · rate limited | Log in; sets the HttpOnly JWT cookie |
| GET | `/api/auth/me` | 🔒 Any role | Current user |
| POST | `/api/auth/logout` | Public | Clears the cookie |

**Users**

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET / PUT | `/api/users/profile` | 🔒 Any role | View or update own profile |
| DELETE | `/api/users/profile` | 🔒 Any role | Deactivate own account |
| GET | `/api/users/:id` | 🔒 Any role | Public profile of a user |
| GET | `/api/users` | 🔒 Admin | List users |
| DELETE | `/api/users/:id` | 🔒 Admin | Remove a user |

**Gigs**

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/gigs` | Public | Active gigs (`search`, `category`, `minPrice`, `maxPrice`) |
| GET | `/api/gigs/:id` | Public | One active gig |
| GET | `/api/gigs/history/:id` | 🔒 Gig owner, booking participant or Admin | Details for a non-public gig |
| GET | `/api/gigs/my-gigs` | 🔒 Freelancer | Own gigs |
| GET | `/api/gigs/my-gigs/:id` | 🔒 Freelancer (owner) | Own gig details, including completed gigs |
| POST | `/api/gigs` | 🔒 Freelancer | Create gig |
| PUT | `/api/gigs/:id` | 🔒 Freelancer (owner) | Update own gig |
| DELETE | `/api/gigs/:id` | 🔒 Freelancer (owner) | Soft-delete own gig |

**Bookings, transactions and income**

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/bookings` | 🔒 Client · rate limited | Book a gig and create its transaction |
| GET | `/api/bookings/my-bookings` | 🔒 Any role | Bookings where the user is client or freelancer |
| GET | `/api/bookings/:id` | 🔒 Party to booking / Admin | One booking |
| PATCH | `/api/bookings/:id/status` | 🔒 Owning freelancer (client may cancel) | Move through the lifecycle |
| GET | `/api/transactions/my-transactions` | 🔒 Any role | Own transactions |
| GET | `/api/transactions/:id` | 🔒 Party to transaction / Admin | One transaction (invoice) |
| PATCH | `/api/transactions/:id/payout` | 🔒 Admin | Record a payout |
| GET | `/api/income` | 🔒 Freelancer | Income summary and monthly breakdown |

**Admin** (all 🔒 Admin)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/admin` | Dashboard statistics |
| GET | `/api/admin/users` | List users |
| GET / PUT / DELETE | `/api/admin/users/:id` | View, update or deactivate a user |
| GET | `/api/admin/gigs` | List gigs |
| PUT / DELETE | `/api/admin/gigs/:id` | Moderate or remove a gig |
| GET | `/api/admin/bookings` | List bookings |
| PUT | `/api/admin/bookings/:id` | Update a booking |
| GET | `/api/admin/analytics` | Analytics |
| GET | `/api/admin/api-usage` | API usage report |

---

## 7. Role-based access control (RBAC)

RBAC is enforced **on the server**. The React route guards only improve the user experience. Hiding a link is not security.

### 7.1 How a request is authorised

```mermaid
flowchart LR
    R[Request] --> P{protect<br/>valid JWT cookie?<br/>user active?}
    P -- no --> U[401 Unauthorized]
    P -- yes --> A{authorizeRoles<br/>role allowed?}
    A -- no --> F[403 Forbidden]
    A -- yes --> O{Controller<br/>owns the record?}
    O -- no --> N[403 / 404]
    O -- yes --> OK[200 / 201]
```

```js
// middleware/authMiddleware.js
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to perform this action." });
  }
  next();
};

// routes/gigRoutes.js
router.post("/", protect, authorizeRoles("Freelancer"), validateGig, createGig);
```

### 7.2 Role rules

| Rule | Where |
| --- | --- |
| Only **Freelancers** create, edit or delete gigs and see income | `gigRoutes.js`, `incomeRoutes.js` |
| Only **Clients** create bookings | `bookingRoutes.js` |
| Only **Admins** reach `/api/admin/*`, list or delete users, and record payouts | `adminRoutes.js`, `userRoutes.js`, `transactionRoutes.js` |
| Public registration accepts only `Client` or `Freelancer`, never `Admin` | `validateRegistration.js`, `authController.js` |
| An admin cannot remove their own Admin role | `adminController.js` |

### 7.3 Ownership: users cannot touch data that isn't theirs

| Resource | Check | Result for a non-owner |
| --- | --- | --- |
| Gig update / delete / edit view | Query filter includes `freelancerId: req.user.id` | `404 Not found` (existence is not revealed) |
| Booking view | User must be the client, the freelancer or an admin | `403` |
| Booking status change | Only the owning freelancer; the owning client may only cancel | `403` |
| Transaction view | User must be the client, the freelancer or an admin | `403` |
| Lists (my gigs, bookings, transactions, income) | Always filtered by the logged-in user's ID | Only own records returned |

The owner and the price are **never taken from the request body**: `freelancerId`, `clientId` and all money values come from the token and the database, so they cannot be spoofed.

---

## 8. API security: JWT, validation and sanitisation

### 8.1 Authentication with JWT

- Passwords are hashed with **bcrypt** (10 salt rounds) and never returned by the API.
- After login the server signs a JWT that contains only the user ID and role, and expires after 1 hour (`JWT_EXPIRES_IN`).
- The token is stored in a cookie with these flags:

  | Flag | Protection |
  | --- | --- |
  | `HttpOnly` | JavaScript cannot read the token, so XSS cannot steal it |
  | `Secure` | Sent over HTTPS only |
  | `SameSite=Lax` | Not sent on cross-site POST requests (CSRF) |

  The frontend never stores tokens in `localStorage`.
- `protect` verifies the signature and expiry on every protected request, then reloads the user from the database. Deleted or deactivated accounts are rejected immediately, even while their token is still valid.
- Login failures always return `Invalid email or password.`, so attackers cannot find out which emails are registered.
- `server.js` refuses to start without `MONGO_URI` and `JWT_SECRET`, and secrets live only in git-ignored `.env` files.

### 8.2 Input validation and sanitisation

| Input | Validation |
| --- | --- |
| Registration | `express-validator`: name 2 to 100 characters with no `<` or `>`; valid email (trimmed and normalised); password 8 to 128 characters with uppercase, lowercase, number and special character; role `Client` or `Freelancer` |
| Login | Email and password must be strings of a valid length; objects are rejected |
| Gig | Text fields must be strings of a limited length with no `<` or `>`; price a number from 0 to 10 000 000 with at most 2 decimals; delivery 1 to 365 days; image URL must start with `http(s)://`; status `active` or `paused` |
| Booking | `gigId` must be a valid ObjectId; date from today up to 1 year ahead |
| Profile | Name, phone, bio, skills and location are type- and length-checked, with no `<` or `>` |
| URL IDs | `validateId` rejects invalid ObjectIds before the database is queried |
| Search | Trimmed, limited to 80 characters and regex-escaped |
| Body size | JSON limited to 32 KB (`413` if larger); malformed JSON returns `400` |

**How this stops injection and scripting attacks:**

- **NoSQL injection:** operator objects such as `{"$gt": ""}` fail the type checks, so they never reach a MongoDB query.
- **XSS:** tags are rejected at input. React also escapes everything it renders, and no page uses `dangerouslySetInnerHTML`. The CSP (section 9) is a further layer.
- **Information leakage:** validation errors return field names and messages but never the submitted values, so passwords are not echoed back.

### 8.3 CSRF and CORS

- **CORS** allows only `CLIENT_ORIGIN`, with credentials.
- Any `POST`, `PUT`, `PATCH` or `DELETE` whose `Origin` header is not the trusted client is rejected with `403 Request origin is not allowed.` This adds to the protection from `SameSite=Lax` cookies.

### 8.4 Safe error handling

A central error handler returns controlled JSON for `400`, `401`, `403`, `404`, `409`, `413` and `500`. Stack traces, Mongoose errors, file paths and connection strings are never sent to the client, and unexpected errors are logged without credentials. Public gig listings populate only a freelancer's name, picture and rating, never their email or password.

---

## 9. Rate limiting and security headers

### 9.1 Rate limiting

`express-rate-limit` is configured in `app.js`:

| Endpoint | Limit (per IP) | Response when exceeded |
| --- | --- | --- |
| `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/users` | 30 requests / 15 minutes | `429` `{"message":"Too many authentication attempts. Try again later."}` |
| `POST /api/bookings` | 20 bookings / hour | `429` `{"message":"Booking limit reached. Try again later."}` |

- The login limit slows brute-force and credential-stuffing attacks. The booking limit stops automated booking spam.
- Every response carries the standard `RateLimit` and `RateLimit-Policy` headers (IETF draft-7), so clients can see the limit and how many requests are left. Legacy `X-RateLimit-*` headers are turned off.
- The frontend shows the 429 message to the user (tested in `NewBooking.test.jsx`).

```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." }
});
```

### 9.2 Security headers (Helmet)

Helmet runs before every route.

| Header | Protects against |
| --- | --- |
| `Content-Security-Policy` | XSS, injected scripts, clickjacking, data exfiltration |
| `Strict-Transport-Security` | Downgrade to HTTP |
| `X-Content-Type-Options: nosniff` | MIME-type sniffing |
| `X-Frame-Options` | Clickjacking |
| `Referrer-Policy` | Leaking URLs to other sites |
| `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` | Cross-origin attacks |
| `X-Powered-By` removed | Revealing that the server runs Express |

### 9.3 Content Security Policy

**API CSP** (`app.js`):

```text
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';
script-src 'self'; style-src 'self'; img-src 'self' data: https:;
connect-src 'self' https://localhost:5173
```

**Frontend CSP** (`vite.config.js`), sent by the Vite server:

| Directive | Preview / production | Development |
| --- | --- | --- |
| `script-src` | `'self'` | `'self' 'unsafe-inline'` (React refresh preamble) |
| `style-src` | `'self' 'unsafe-inline'` | same |
| `connect-src` | `'self'` + API origin | + `wss://localhost:5173` (hot reload) |
| `object-src` / `frame-ancestors` / `base-uri` | `'none'` / `'none'` / `'self'` | same |

Scripts can load only from the app itself, plugins and framing are blocked, `<base>` tags cannot redirect links, and the page can only send data to its own API.

---

## 10. React frontend

The frontend is a React 19 single-page app built with Vite and React Router 7. It runs over HTTPS in development.

### 10.1 Pages

| Area | Route | Page |
| --- | --- | --- |
| Public | `/` | Home / landing page |
| | `/marketplace` | Browse gigs with search and category filter |
| | `/gigs/:id` | Public gig details with a "Book" action; completed details are available to booking participants after login |
| | `/login`, `/signup` | Authentication |
| Any logged-in user | `/profile` | View, edit or deactivate profile |
| | `/bookings` | Bookings list with status actions |
| Client and Freelancer | `/transactions` | Transaction history |
| Client | `/bookings/new?gigId=` | Booking confirmation (simulated payment) |
| Freelancer | `/dashboard` | Income summary, recent activity, quick actions |
| | `/my-gigs`, `/create-gig`, `/gigs/:id/edit` | Gig management; completed gigs remain viewable but cannot be edited or deleted |
| | `/income` | Income breakdown and monthly income |
| Admin | `/admin` | Dashboard |
| | `/admin/users`, `/admin/users/:id/edit` | User management |
| | `/admin/gigs`, `/admin/bookings` | Moderation |
| | `/admin/analytics`, `/admin/api-usage` | Reports |
| Any | `*` | Not found page |

### 10.2 Authentication and route protection

- **`AuthContext`** restores the session on load by calling `/api/auth/me` with `credentials: "include"`. The token itself stays in the HttpOnly cookie and never reaches JavaScript.
- **`ProtectedRoute`** shows a loading state while the session is restored, then sends logged-out users to `/login`.
- **`RoleRoute`** sends users away from pages for other roles.
- After login, users are redirected by role: Admin → `/admin`, Freelancer → `/dashboard`, Client → `/`.
- The **Navbar** only shows links for the current role and includes Logout.

### 10.3 Usability and safe input handling

- Every data page has **loading**, **empty** and **error** states (for example "No bookings yet").
- API error messages are shown as given (for example "Invalid email or password." or the 429 message). The UI never shows stack traces or tokens.
- Forms use HTML5 validation (`required`, `type="email"`, a minimum date) and client checks such as password confirmation and numeric price. The server still validates everything.
- Destructive actions (deleting a gig, deactivating a user) ask for confirmation first.
- Booking sends only `gigId` and the date. The price shown is for display only and is never trusted by the API.

---

## 11. Testing

| Suite | Tool | Location | Result |
| --- | --- | --- | --- |
| Backend unit/integration | `node --test` | `Project/server/test/` | Run by CI |
| API end-to-end | Postman + Newman | `PostmanCollection/` | 69 requests, 169 assertions |
| Rate-limit demo | Newman (35 iterations) | `PostmanCollection/` | `429` after 30 attempts |
| Frontend | Vitest + React Testing Library | `Project/client/src/__tests__/` | Run by CI |

Run every command from the `Project` folder.

### 11.1 Backend automated tests

```bash
npm run test:server
```

The API tests start the real Express app over HTTPS on a random port. Controller and model tests isolate database calls, so **MongoDB is not needed** for this suite.

- **`api.test.js`** (Part 1, updated for cookie auth) covers:
  - HTTPS and the certificate
  - registration validation, password hashing and duplicate handling
  - the login cookie (`HttpOnly`, `Secure`, no token in the body)
  - malformed, expired and forged JWTs, and `403` for the wrong role
  - malformed and oversized JSON, and safe 500 errors
- **`marketplace-security.test.js`** (Part 2) covers:
  - Helmet and CSP headers, and the CSRF origin check
  - RBAC for gigs, bookings, admin and income
  - ownership of gigs and transactions
  - owner spoofing and price tampering
  - transaction fee and payout calculation; annual tax estimation has separate tests
  - XSS and NoSQL-injection rejection, and invalid IDs
  - both rate limiters returning `429`

### 11.2 Postman collection and Newman

**`HustleHub Part 2 - Secure Marketplace API`** registers fresh users on every run, then tests the full flow in folders:

| Folder | Success and failure cases |
| --- | --- |
| 0. Health & Security Headers | HTTPS; CSP, HSTS, nosniff and X-Frame-Options present; X-Powered-By hidden |
| 1. Registration & Login Validation | Valid registration; duplicate (409); weak password; XSS in name; Admin self-registration blocked; missing fields; generic login error; NoSQL injection; malformed JSON |
| 2. Freelancer - Gig Management | HttpOnly/Secure login cookie; create, update and list own gigs; bad gig data rejected; freelancer can't book or reach admin |
| 3. Client - Browse & Book | Public browsing hides private fields; regex search is escaped; client can't create, edit or delete gigs or see income; invalid bookings rejected; booking creates a transaction with server-side price and correct fees |
| 4. Freelancer - Bookings & Income | Invalid status jump rejected; accept → start → complete; transaction completed; income includes the net amount |
| 5. Ownership - Other Freelancer | A second freelancer can't edit, delete or view the first freelancer's gig, booking or transaction |
| 6. Admin | Dashboard, user list without password hashes, any transaction, all bookings |
| 7. Token & Session Security | Rejected after logout; forged JWT rejected; foreign Origin blocked; controlled 404 |

Run it with Newman (backend running, database seeded):

```bash
npm run dev          # terminal 1
npm run test:api     # terminal 2  → NewmanReports/newman-report.html
```

Run the rate-limit demo **last**, because it locks login for 15 minutes. Restart the server to reset it:

```bash
npm run test:ratelimit   # → NewmanReports/newman-ratelimit-report.html
```

**Newman HTML report:**
The report is saved in the repository at [`NewmanReports/newman-report.html`](NewmanReports/newman-report.html).

> The main collection makes about 14 login and register calls, so it can run twice in 15 minutes before the login limit applies. Restart the backend to reset the in-memory counter.
>
> To use the Postman app instead: import the collection, turn **SSL certificate verification** off (the certificate is self-signed) and click *Run collection*. Postman handles the auth cookie automatically.

### 11.3 Frontend automated tests

```bash
npm run test:client
```

| Test file | Rendering | User interaction |
| --- | --- | --- |
| `Login.test.jsx` | Form, fields, button | Typing; wrong password shows a safe error; cookie sent; redirect by role |
| `Signup.test.jsx` | Fields; Admin not offered | Password mismatch blocked; API error shown; correct payload; redirect |
| `Marketplace.test.jsx` | Loading → gigs; `<script>` rendered as text | Search and category filters; empty state; API failure |
| `NewBooking.test.jsx` | Gig, price and location | Only `gigId` and date sent; redirect; 429 message shown |
| `RouteGuards.test.jsx` | Loading state | Logged-out → login; wrong role → home; right role sees the page |
| `Navbar.test.jsx` | Links per role | Logout calls `logout()` |

`fetch` is mocked, so these tests need neither the backend nor the database.

### 11.4 Run everything

```bash
npm run test:all     # backend + frontend automated tests
npm run test:api     # Newman (backend must be running)
```

---

## 12. Screenshots

### 12.1 Visitor: Browsing and registration

<img width="1059" height="901" alt="01-marketplace" src="https://github.com/user-attachments/assets/6c5c378f-a624-4fd8-bf0d-4693f03ad430" />

*Figure 1: The public marketplace lists active gigs with search and category filters. No login is needed to browse.*

<img width="432" height="750" alt="02-signup-validation" src="https://github.com/user-attachments/assets/bd2de4bb-0efd-4570-bc3b-064b72d9183c" />

*Figure 2: Sign-up rejects a weak password. The API's validation message is shown to the user, and the submitted password is never echoed back.*

<img width="497" height="773" alt="02b-signup-validation-length" src="https://github.com/user-attachments/assets/6f9c9922-a61d-4fea-9d01-b3289c48e8e0" />

*Figure 3: Sign-up rejects a password shorter than 8 characters.*

### 12.2 Freelancer: Gig management and income

<img width="863" height="902" alt="03-create-gig" src="https://github.com/user-attachments/assets/38920636-7862-4564-94cd-d53582e1d652" />

*Figure 4: A freelancer creates a gig with a title, description, category, price, delivery time and location. The server validates every field.*

<img width="874" height="657" alt="04-my-gigs" src="https://github.com/user-attachments/assets/d3cab941-2246-40c3-8d9d-f5fd57002a43" />

*Figure 5: My Gigs shows only the logged-in freelancer's own gigs, with View, Edit and Delete actions.*

<img width="868" height="504" alt="07-transactions" src="https://github.com/user-attachments/assets/669acd6d-f05d-4a74-a3cd-fae46a80a34b" />

*Figure 6: Historical Part 2 transaction screenshot showing R5 000 gross, a R500 platform fee and the former flat simulated tax deduction. Part 3 records no tax deduction on new transactions; its tax-year estimate appears on the income page.*

<img width="767" height="886" alt="08-income" src="https://github.com/user-attachments/assets/09b29af1-ab67-4585-8075-3054b84cc8b0" />

*Figure 7: Historical Part 2 income screenshot. The Part 3 income page now shows the current tax year, twelve monthly values and a separate annual tax estimate.*

### 12.3 Client: Booking a gig

<img width="909" height="670" alt="05-book-gig" src="https://github.com/user-attachments/assets/4bda1a0c-b198-4ea9-bcdf-6e60ef33bcc5" />

*Figure 8: A client books a gig. Payment is simulated, and the agreed price comes from the gig in the database, not from the browser.*

<img width="918" height="652" alt="06-client-bookings" src="https://github.com/user-attachments/assets/7704fbd7-1f57-4a18-b375-80934bbd9f5c" />

*Figure 9: The client's bookings appear as pending, with the date, price and location. The client can view the gig or cancel.*

### 12.4 Admin: Platform oversight

<img width="840" height="617" alt="16-admin-users" src="https://github.com/user-attachments/assets/4870eb7e-3456-40ff-b029-c0a366b5a66f" />

*Figure 10: Only Admins can see and manage all user accounts and their roles (Client, Freelancer, Admin).*

<img width="878" height="714" alt="17-admin-gigs" src="https://github.com/user-attachments/assets/317eb151-c25b-41e0-ac72-52c443b34aa6" />

*Figure 11: Admins can moderate gigs from every freelancer.*

<img width="805" height="560" alt="18-admin-bookings" src="https://github.com/user-attachments/assets/6464df19-36e1-4954-bfe9-a422dc1c3144" />

*Figure 12: Admins see every booking on the platform, including the completed R5 000 booking shown in Figure 6.*

<img width="623" height="903" alt="19-admin-api-usage" src="https://github.com/user-attachments/assets/99c14757-5f93-4312-ab63-abe18d7eb991" />

*Figure 13: API usage monitoring: every request is logged and summarised as successful or failed.*

### 12.5 Testing evidence

<img width="749" height="542" alt="13-backend-tests" src="https://github.com/user-attachments/assets/a35fbe63-8b37-44ab-b9d3-2c1c01486edd" />

*Figure 14: Backend automated tests (`npm run test:server`): 35 passed, 0 failed. They cover HTTPS, JWT cookies, RBAC, ownership, validation, security headers and rate limiting.*

<img width="755" height="484" alt="14-frontend-tests" src="https://github.com/user-attachments/assets/bc14d3cf-304b-4d15-9a82-d6ca45df6df7" />

*Figure 15: Frontend tests with Vitest and React Testing Library (`npm run test:client`): 6 files, 29 tests passed. The `stderr` line is expected, because one test deliberately simulates the API failing.*

<img width="562" height="398" alt="10-newman-cli" src="https://github.com/user-attachments/assets/78aec205-f50f-4dba-8980-90c6a37daa00" />

*Figure 16: The Part 2 Postman collection run with Newman (`npm run test:api`): 69 requests and 169 assertions, 0 failed.*

<img width="617" height="50" alt="11-newman-html-report" src="https://github.com/user-attachments/assets/1295f1b2-489c-49ca-98d2-8e671a41f617" />

*Figure 17: The Newman htmlextra report (`NewmanReports/newman-report.html`): 69 requests, 0 failed tests, 0 skipped.*

<img width="472" height="79" alt="10b-postman-runner" src="https://github.com/user-attachments/assets/83489922-6dfa-4dee-a01a-1280619f9d26" />

*Figure 18: The same collection run in the Postman app: 169 tests passed, 0 failed, 0 errors.*
*Proof of all the tests running:*

<img width="1043" height="640" alt="Proof of Postman 1" src="https://github.com/user-attachments/assets/561604e0-53c7-498b-94ce-a2fdbf658096" />
<img width="511" height="512" alt="Proof of Postman 2" src="https://github.com/user-attachments/assets/0e413603-c007-4e4b-87b0-1b7c67f8183f" />
<img width="500" height="68" alt="Proof of Postman 3" src="https://github.com/user-attachments/assets/fb708d27-2039-4f2a-b674-db70784c0e6d" />

---

## 13. Demonstration video

**Part 3 video (unlisted):** (to be added)


**Part 2 video (unlisted):** https://youtu.be/XHeTo1fYRP4?si=5Fyyw8Du3gUsxQYT


Part 1 video: <https://youtu.be/_TZ8-mItvcw>

---

## 14. What changed from Part 1

| Area | Part 1 | Part 2 | Part 3 |
| --- | --- | --- |
| Scope | Backend authentication only | Full MERN marketplace: gigs, bookings, transactions, income, admin |
| Token storage | JWT in the response body, sent as `Authorization: Bearer` | `Secure` `HttpOnly` `SameSite=Lax` cookie, re-checked against the database on each request |
| Authorisation | Authentication only | RBAC (`authorizeRoles`) plus ownership checks on every resource |
| Validation | Registration and login | Plus gig, booking, profile and ID validators; HTML-tag and NoSQL-operator rejection; escaped search |
| Rate limiting | Planned | Login/register 30 per 15 min; bookings 20 per hour; `429` messages and `RateLimit` headers |
| Security headers | Planned | Helmet with a custom CSP on the API, and a CSP on the Vite server |
| CSRF | Not implemented | Origin check on state-changing requests |
| Frontend | Not built | React 19 app with protected and role routes for all three roles |
| Backend tests | 16 | 35 |
| Postman | 14 requests | 69 requests / 169 assertions with Newman, plus a rate-limit demo |
| Frontend tests | None | 29 Vitest + React Testing Library tests |

---

## 15. References

- Express. 2026. *Production best practices: security*. Available at: <https://expressjs.com/en/advanced/best-practice-security.html>
- Helmet. 2026. *Helmet.js documentation*. Available at: <https://helmetjs.github.io/>
- express-rate-limit. 2026. *express-rate-limit documentation*. Available at: <https://express-rate-limit.mintlify.app/>
- express-validator. 2026. *express-validator documentation*. Available at: <https://express-validator.github.io/docs/>
- MDN Web Docs. 2026. *Content Security Policy (CSP)*. Available at: <https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP>
- OWASP Foundation. 2021. *OWASP Top 10*. Available at: <https://owasp.org/Top10/>
- OWASP Foundation. 2026. *Cheat Sheet Series: Authorization, Content Security Policy, Cross-Site Request Forgery Prevention, Input Validation*. Available at: <https://cheatsheetseries.owasp.org/>
- Postman. 2026. *Run collections using Newman CLI*. Available at: <https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/>
- React. 2026. *React documentation*. Available at: <https://react.dev/>
- Testing Library. 2026. *React Testing Library*. Available at: <https://testing-library.com/docs/react-testing-library/intro/>
- Vitest. 2026. *Vitest guide*. Available at: <https://vitest.dev/guide/>

---
