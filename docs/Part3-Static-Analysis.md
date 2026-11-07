# Part 3 static analysis evidence and setup

## Local checks, 7 November 2026

- Backend: `npm run test:coverage --prefix Project/server` passed 39 tests after the security fixes. The generated `Project/server/coverage/lcov.info` records 1,430 covered lines of 2,300 included backend lines (62.17%).
- The coverage script rewrites all 32 LCOV source paths relative to the repository root. All 32 paths were verified to exist. The report is ignored by Git and regenerated in CI.
- Frontend: `npm run lint` completed without errors or warnings. An ESLint `react-hooks/set-state-in-effect` finding in `AdminPagination.jsx` was fixed without disabling the rule.
- Backend JavaScript syntax checks completed without errors.
- Frontend: after the Sonar fixes, `npm run lint`, 30 Vitest tests, and `npm run build` passed locally.

These local checks are separate from the SonarQube Cloud results described below.

## SonarQube findings and remediation, 7 November 2026

The first CI-based analysis completed with a passing quality gate, but the overall-code issue list showed three Blocker NoSQL injection findings and many Medium reliability findings. A passing new-code gate does not clear existing overall-code findings.

| Finding shown by SonarQube | Code response | Verification |
| --- | --- | --- |
| NoSQL injection at registration, booking creation, and gig search | Registration uses a scalar email equality filter; booking converts a validated gig ID to a MongoDB ObjectId; gig search builds a query from fixed field names, escaped regex text, and numeric bounds. | Backend tests include equality-filter, ObjectId, and literal-regex assertions; 39 passed. |
| Floating promises in page loaders and navigation | Effect loaders are explicitly marked as intentionally started and handle their own errors; navigation in async handlers is awaited, while button navigation is explicitly ignored. Top-level server and seed calls have rejection handlers. | Frontend lint, 30 tests, and build passed. |
| Super-linear email validation regex in the admin controller | Replaced the full email regex with bounded length and deterministic position checks. | Backend tests and syntax checks passed. |
| Legacy global number parsing in the create-gig form | Uses `Number.parseFloat`, `Number.parseInt`, and `Number.isNaN`. | Frontend lint, tests, and build passed. |

These changes are local until committed and pushed. The next SonarQube scan must be inspected to confirm which findings close and whether any new findings appear. Do not report them as resolved in SonarQube before that scan.

## Connect SonarQube Cloud

1. Sign in to [SonarQube Cloud](https://sonarcloud.io/) with GitHub, import this repository, and create its SonarQube project. Choose CI-based analysis. If Automatic Analysis is enabled, turn it off under **Project Administration → Analysis Method**. Automatic and CI-based analysis cannot run together.
2. Copy the SonarQube **organization key** and **project key**. In the GitHub repository, add repository variables `SONAR_ORGANIZATION` and `SONAR_PROJECT_KEY` with those exact values.
3. Generate a SonarQube token with Execute Analysis permission. Add it as the GitHub Actions repository secret `SONAR_TOKEN`. Do not put the token in source control, screenshots, or chat. The workflow uses `https://sonarcloud.io` by default; `SONAR_HOST_URL` is an optional repository secret for a different reachable SonarQube host.
4. Push the changes. Inspect **Actions → CI and static analysis → SonarQube Cloud quality gate** and the SonarQube project dashboard. Review the issues and quality gate before capturing submission evidence.

The Classroom50 repository could not be forked, so this SonarQube test repository is a standalone copy. Record both repository URLs in the submission README and explain that the copy does not preserve the original commit history. A GitHub-hosted runner cannot reach a server hosted only on a laptop.

## How the pipeline works

The SonarQube job waits for successful backend and frontend checks, installs dependencies, generates backend LCOV coverage, and runs the official SonarQube scan action. `sonar-project.properties` scans `Project/server` and `Project/client/src` and imports `Project/server/coverage/lcov.info`. The module manual's example `api/` and Jest commands were adapted to this project's `Project/server/` folder and Node.js test runner.

The job fails with a configuration error until `SONAR_TOKEN`, `SONAR_ORGANIZATION`, and `SONAR_PROJECT_KEY` are set. It also waits for the SonarQube quality gate and fails if the gate fails. A successful scanner run is therefore not presented as a passing quality gate unless the gate actually passes.

For submission evidence, capture the GitHub Actions job results, SonarQube project overview, quality gate, issue list, and coverage result. Record findings by type: bugs, vulnerabilities, security hotspots, code smells, and duplications. Review each finding and document the fix or explanation. The Newman HTML report is available as a CI artifact.

The initial run in the copied repository failed because SonarQube Cloud's Automatic Analysis was enabled alongside the CI scan. Disable Automatic Analysis at the project level under **Administration → Analysis Method**, then rerun CI. CodeQL was an optional additional scanner; it was removed because GitHub code scanning is not enabled in this repository and SonarQube provides the required static analysis.

References: [SonarQube Cloud CI-based analysis](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/ci-based-analysis/overview-of-integrated-cis) and [JavaScript/TypeScript coverage](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage).
