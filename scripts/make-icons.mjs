/**
 * Rasterizes marketing/icon.svg into the PNG sizes the manifests reference.
 * Run with: npm run icons
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = resolve(ROOT, "marketing/icon.svg")
const OUT_DIR = resolve(ROOT, "public/icons")
const SIZES = [16, 32, 48, 128]

const svg = await readFile(SOURCE)
await mkdir(OUT_DIR, { recursive: true })

for (const size of SIZES) {
  const png = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toBuffer()

  await writeFile(resolve(OUT_DIR, `icon-${size}.png`), png)
  console.log(`[santi.tab] wrote public/icons/icon-${size}.png`)
}
