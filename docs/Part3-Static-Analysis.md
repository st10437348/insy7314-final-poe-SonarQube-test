# Part 3 static analysis evidence and setup

## Local checks, 7 November 2026

- Backend: `npm run test:coverage --prefix Project/server` passed 38 tests. `c8` reported 61.21% statement coverage across the included backend files and generated `Project/server/coverage/lcov.info`.
- The coverage script rewrites all 32 LCOV source paths relative to the repository root. All 32 paths were verified to exist. The report is ignored by Git and regenerated in CI.
- Frontend: `npm run lint` completed without errors or warnings. An ESLint `react-hooks/set-state-in-effect` finding in `AdminPagination.jsx` was fixed without disabling the rule.
- Backend JavaScript syntax checks completed without errors.

These are local results. No SonarQube Cloud scan or quality gate result is claimed until the remote project is connected and the workflow has run.

## Connect SonarQube Cloud

1. Sign in to [SonarQube Cloud](https://sonarcloud.io/) with GitHub, import this repository, and create its SonarQube project. Choose CI-based analysis. If Automatic Analysis is enabled, turn it off under **Project Administration → Analysis Method**. Automatic and CI-based analysis cannot run together.
2. Copy the SonarQube **organization key** and **project key**. In the GitHub repository, add repository variables `SONAR_ORGANIZATION` and `SONAR_PROJECT_KEY` with those exact values.
3. Generate a SonarQube token with Execute Analysis permission. Add it as the GitHub Actions repository secret `SONAR_TOKEN`. Do not put the token in source control, screenshots, or chat. The workflow uses `https://sonarcloud.io` by default; `SONAR_HOST_URL` is an optional repository secret for a different reachable SonarQube host.
4. Push the changes. Inspect **Actions → CI and static analysis → SonarQube Cloud quality gate** and the SonarQube project dashboard. Review the issues and quality gate before capturing submission evidence.

If the Classroom50 organization does not allow installing the SonarQube GitHub app or setting repository secrets, use a fork that retains the commit history and document its URL in the README. A GitHub-hosted runner cannot reach a server hosted only on a laptop.

## How the pipeline works

The SonarQube job waits for successful backend and frontend checks, installs dependencies, generates backend LCOV coverage, and runs the official SonarQube scan action. `sonar-project.properties` scans `Project/server` and `Project/client/src` and imports `Project/server/coverage/lcov.info`. The module manual's example `api/` and Jest commands were adapted to this project's `Project/server/` folder and Node.js test runner.

The job fails with a configuration error until `SONAR_TOKEN`, `SONAR_ORGANIZATION`, and `SONAR_PROJECT_KEY` are set. It also waits for the SonarQube quality gate and fails if the gate fails. A successful scanner run is therefore not presented as a passing quality gate unless the gate actually passes.

For submission evidence, capture the GitHub Actions job results, SonarQube project overview, quality gate, issue list, and coverage result. Record findings by type: bugs, vulnerabilities, security hotspots, code smells, and duplications. Review each finding and document the fix or explanation. CodeQL findings appear separately in GitHub **Security → Code scanning**. The Newman HTML report is available as a CI artifact.

References: [SonarQube Cloud CI-based analysis](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/ci-based-analysis/overview-of-integrated-cis) and [JavaScript/TypeScript coverage](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage).
