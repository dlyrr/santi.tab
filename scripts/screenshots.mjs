/**
 * Smoke-tests and screenshots the *built* bundle in a real browser.
 *
 * It serves `dist/` over http and drives the page, which exercises everything
 * the extension actually ships -- hashed JS/CSS, the bundled fonts, index.html
 * -- and fails on any uncaught error. Manifest correctness is checked
 * separately by `npm run lint:ext`.
 *
 * Run with: npm run screenshots   (needs `npx playwright install chromium`)
 */
import { mkdir } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { preview } from "vite"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT_DIR = join(ROOT, "marketing/screenshots")

await mkdir(OUT_DIR, { recursive: true })

const server = await preview({
  root: ROOT,
  build: { outDir: "dist" },
  preview: { port: 4173, strictPort: false, open: false },
})

const url = server.resolvedUrls?.local?.[0]
if (!url) throw new Error("Preview server did not report a URL")

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

const errors = []
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`)
})

try {
  await page.goto(url, { waitUntil: "load" })
  await page.waitForSelector(".app-frame")

  // The clock proves React mounted and the store hydrated.
  await page.waitForSelector(".time")
  await page.waitForTimeout(1200)
  await page.screenshot({ path: join(OUT_DIR, "new-tab.png") })

  await page.click("text=Show Menu")
  await page.waitForSelector(".menu.visible")

  for (const tab of [
    "History",
    "Wallpaper",
    "Appearance",
    "Clock",
    "Widgets",
    "Behavior",
    "Data",
  ]) {
    await page.click(`.menu-sidebar >> text=${tab}`)
    await page.waitForTimeout(350)
    await page.screenshot({
      path: join(OUT_DIR, `settings-${tab.toLowerCase()}.png`),
    })
  }

  // Drive the settings UI to build a showcase shot. Reddit is unreachable from
  // a plain http origin, so the gradient source stands in for a wallpaper.
  await page.click(".menu-sidebar >> text=Wallpaper")
  await page.click('button:text-is("solid / gradient")')
  await page.click('button:text-is("gradient")')
  await page.fill("input[aria-label='Gradient from']", "#2a1b4d")
  await page.fill("input[aria-label='Gradient to']", "#c2410c")

  await page.click(".menu-sidebar >> text=Widgets")
  await page.click("label:has-text('Show search bar') button")
  await page.click("label:has-text('Show shortcuts') button")

  for (const [name, url] of [
    ["GitHub", "github.com"],
    ["Reddit", "reddit.com"],
    ["YouTube", "youtube.com"],
  ]) {
    await page.fill("input[aria-label='Shortcut name']", name)
    await page.fill("input[aria-label='Shortcut URL']", url)
    await page.click("button[aria-label='Add shortcut']")
  }

  await page.click(".menu-sidebar >> text=Clock")
  await page.click("label:has-text('Show greeting') button")
  await page.fill("input[placeholder^='leave empty']", "Santi")

  await page.click("text=Hide Menu")
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT_DIR, "hero.png") })

  // Reddit is unreachable from a plain http origin (no host permissions), so a
  // fetch failure here is expected and must not be treated as a bundle error.
  const fatal = errors.filter(
    (message) =>
      !/reddit|Failed to fetch|net::ERR|CORS|Access-Control/i.test(message)
  )

  if (fatal.length) {
    throw new Error(`Runtime errors in the built bundle:\n  ${fatal.join("\n  ")}`)
  }

  console.log(`[santi.tab] no runtime errors; screenshots in ${OUT_DIR}`)
} finally {
  await browser.close()
  await server.close()
}
