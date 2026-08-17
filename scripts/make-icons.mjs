/**
 * Rasterizes the brand logo into the PNG sizes the manifests reference.
 * Run with: npm run icons
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = resolve(ROOT, "marketing/santi.tab logo.png")
const OUT_DIR = resolve(ROOT, "public/icons")
const SIZES = [16, 32, 48, 128]

const source = await readFile(SOURCE)
await mkdir(OUT_DIR, { recursive: true })

// The logo is a circle on a black square. Browsers draw extension icons over
// whatever their own chrome is, so the square corners are cut away and left
// transparent -- otherwise the icon shows as a black tile in light themes.
const { width = 0, height = 0 } = await sharp(source).metadata()
const diameter = Math.min(width, height)

const circle = Buffer.from(
  `<svg width="${diameter}" height="${diameter}">` +
    `<circle cx="${diameter / 2}" cy="${diameter / 2}" r="${diameter / 2}" fill="#fff"/>` +
    `</svg>`
)

const rounded = await sharp(source)
  .resize(diameter, diameter, { fit: "cover", position: "centre" })
  .composite([{ input: circle, blend: "dest-in" }])
  .png()
  .toBuffer()

for (const size of SIZES) {
  const png = await sharp(rounded)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toBuffer()

  await writeFile(resolve(OUT_DIR, `icon-${size}.png`), png)
  console.log(`[santi.tab] wrote public/icons/icon-${size}.png`)
}
