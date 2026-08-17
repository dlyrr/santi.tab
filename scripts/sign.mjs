/**
 * Signs the Firefox build through addons.mozilla.org so it installs
 * permanently in Firefox / Zen without turning off signature enforcement.
 *
 * Credentials are read from .env.local (gitignored via the `*.local` rule) so
 * they never end up in a command line, shell history, or the repo:
 *
 *   WEB_EXT_API_KEY=user:12345678:123
 *   WEB_EXT_API_SECRET=<the long hex secret>
 *
 * Get both at https://addons.mozilla.org/developers/addon/api/key/
 *
 * Run with: npm run sign
 */
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ENV_FILE = resolve(ROOT, ".env.local")

if (!existsSync(ENV_FILE)) {
  console.error(
    `Missing ${ENV_FILE}\n\n` +
      `Create it with your AMO credentials:\n` +
      `  WEB_EXT_API_KEY=user:00000000:000\n` +
      `  WEB_EXT_API_SECRET=...\n\n` +
      `Generate them at https://addons.mozilla.org/developers/addon/api/key/`
  )
  process.exit(1)
}

process.loadEnvFile(ENV_FILE)

if (!process.env.WEB_EXT_API_KEY || !process.env.WEB_EXT_API_SECRET) {
  console.error(
    ".env.local is missing WEB_EXT_API_KEY and/or WEB_EXT_API_SECRET."
  )
  process.exit(1)
}

// `unlisted` means self-distribution: AMO signs it and hands the .xpi back
// instead of publishing it to the add-ons directory. Signing is automated, so
// this usually returns within a couple of minutes.
const args = [
  "sign",
  "--source-dir=dist-firefox",
  "--artifacts-dir=web-ext-artifacts",
  "--channel=unlisted",
]

console.log("[santi.tab] submitting dist-firefox to AMO for signing...")

const child = spawn("npx", ["web-ext", ...args], {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
})

child.on("exit", (code) => process.exit(code ?? 1))
