/**
 * Zips a build directory for store upload.
 *
 * Entries MUST be at the archive root -- both stores look for manifest.json
 * there and reject the package outright if it is nested under dist/.
 *
 * Usage: node scripts/zip.mjs <chromium|firefox>
 */
import { spawnSync } from "node:child_process"
import { mkdirSync, readdirSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const TARGETS = {
  chromium: "dist",
  firefox: "dist-firefox",
}

const target = process.argv[2]
const dir = TARGETS[target]

if (!dir) {
  console.error(
    `Usage: node scripts/zip.mjs <${Object.keys(TARGETS).join("|")}>`
  )
  process.exit(1)
}

const { version } = JSON.parse(
  readFileSync(resolve(ROOT, "package.json"), "utf8")
)

const source = resolve(ROOT, dir)
const OUT = resolve(ROOT, "web-ext-artifacts")
mkdirSync(OUT, { recursive: true })

const destination = resolve(OUT, `santi.tab-${target}-${version}.zip`)

// Zipping the directory's *contents* from inside it is what keeps
// manifest.json at the archive root.
const entries = readdirSync(source)

if (!entries.includes("manifest.json")) {
  console.error(`No manifest.json in ${dir}/ -- run the build first.`)
  process.exit(1)
}

const result = spawnSync(
  resolve(ROOT, "node_modules/.bin/bestzip"),
  [destination, ...entries],
  { cwd: source, stdio: "inherit", shell: process.platform === "win32" }
)

if (result.status !== 0) process.exit(result.status ?? 1)

console.log(`[santi.tab] wrote web-ext-artifacts/santi.tab-${target}-${version}.zip`)
