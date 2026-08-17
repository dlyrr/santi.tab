/// <reference types="vitest/config" />
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { viteStaticCopy } from "vite-plugin-static-copy"

import packageJson from "./package.json"

/**
 * One codebase, two stores. `TARGET=firefox` swaps in the Gecko manifest
 * (which needs `browser_specific_settings`) and builds to its own folder so
 * both packages can exist side by side.
 */
const TARGETS = {
  chromium: { manifest: "manifests/chromium.json", outDir: "dist" },
  firefox: { manifest: "manifests/firefox.json", outDir: "dist-firefox" },
} as const

type TargetName = keyof typeof TARGETS

const targetName = (process.env.TARGET ?? "chromium") as TargetName
const target = TARGETS[targetName]

if (!target) {
  throw new Error(
    `Unknown TARGET "${targetName}". Expected one of: ${Object.keys(TARGETS).join(", ")}`
  )
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: target.outDir,
    emptyOutDir: true,
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: target.manifest,
          dest: "",
          rename: "manifest.json",
          transform: (content) => {
            return JSON.stringify(
              {
                description: packageJson.description,
                version: packageJson.version,
                ...JSON.parse(content.toString()),
              },
              null,
              2
            )
          },
        },
      ],
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [],
    },
  },
})
