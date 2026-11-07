import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const reportPath = path.join(clientRoot, 'coverage', 'lcov.info')
const report = fs.readFileSync(reportPath, 'utf8')
let sourceCount = 0

const normalized = report.replace(/^SF:(.+)$/gm, (_line, source) => {
  const relativePath = path.isAbsolute(source)
    ? path.relative(clientRoot, source)
    : path.normalize(source)

  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error(`Coverage source is outside Project/client: ${source}`)
  }

  sourceCount += 1
  return `SF:Project/client/${relativePath.split(path.sep).join('/')}`
})

if (sourceCount === 0) {
  throw new Error('The frontend LCOV report contains no source files')
}

fs.writeFileSync(reportPath, normalized)
console.log(`Prepared ${sourceCount} frontend LCOV source paths for SonarQube`)
