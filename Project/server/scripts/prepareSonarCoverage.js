const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const reportPath = path.join(serverRoot, 'coverage', 'lcov.info');
const report = fs.readFileSync(reportPath, 'utf8');
let sourceCount = 0;

const normalized = report.replace(/^SF:(.+)$/gm, (_line, source) => {
  const relativePath = path.isAbsolute(source)
    ? path.relative(serverRoot, source)
    : path.normalize(source);

  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error(`Coverage source is outside Project/server: ${source}`);
  }

  sourceCount += 1;
  return `SF:Project/server/${relativePath.split(path.sep).join('/')}`;
});

if (sourceCount === 0) {
  throw new Error('The LCOV report contains no source files');
}

fs.writeFileSync(reportPath, normalized);
console.log(`Prepared ${sourceCount} LCOV source paths for SonarQube`);
