/**
 * Builds the two files an AMO *listed* (store) submission needs:
 *
 *   web-ext-artifacts/santi.tab-<v>-UNSIGNED.zip  <- upload as the version
 *   web-ext-artifacts/santi.tab-<v>-source.zip    <- upload as the source
 *
 * Run with: npm run package:amo
 *
 * IMPORTANT: do not run `npm run sign` on a version you intend to submit to
 * the store. Signing publishes that version on the *unlisted* channel, and AMO
 * version numbers are unique per add-on across both channels -- the listed
 * upload then fails with "Version X already exists". Bump the version first.
 *
 * AMO requires the source upload because the shipped bundle is minified by
 * Vite. Reviewer build steps: `npm ci && npm run build:firefox` -> dist-firefox/
 */
import { spawnSync } from "node:child_process"
import { mkdirSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT = resolve(ROOT, "web-ext-artifacts")

const { version } = JSON.parse(
  readFileSync(resolve(ROOT, "package.json"), "utf8")
)

mkdirSync(OUT, { recursive: true })

const run = (command, args, cwd = ROOT) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.status !== 0) {
    console.error(`\n[santi.tab] "${command}" failed`)
    process.exit(result.status ?? 1)
  }
}

const bestzip = resolve(ROOT, "node_modules/.bin/bestzip")

// The add-on package: plain build output, unsigned. AMO signs it itself.
run(bestzip, [
  resolve(OUT, `santi.tab-${version}-UNSIGNED.zip`),
  "assets",
  "fonts",
  "icons",
  "index.html",
  "manifest.json",
], resolve(ROOT, "dist-firefox"))

// The source package: exactly what is committed, nothing ignored.
run("git", [
  "archive",
  "--format=zip",
  "--prefix=santi.tab/",
  "-o",
  resolve(OUT, `santi.tab-${version}-source.zip`),
  "HEAD",
])

console.log(`
[santi.tab] AMO listed submission files for v${version}:

  web-ext-artifacts/santi.tab-${version}-UNSIGNED.zip   <- upload as the version
  web-ext-artifacts/santi.tab-${version}-source.zip     <- upload as the source

Build steps for the reviewer form:
  npm ci && npm run build:firefox   (output: dist-firefox/)
`)
