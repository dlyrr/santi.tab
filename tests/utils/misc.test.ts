import { describe, expect, it, vi } from "vitest"
import { originPatternFor, hasOrigins, isExtension } from "../../src/utils/browser"
import { formatDate, greetingFor } from "../../src/utils/datetime"
import { filenameFor } from "../../src/utils/download"
import { formatKeyCode, isTypingTarget } from "../../src/utils/keys"
import { rollIntervalMs, themeVariables } from "../../src/utils/theme"
import { DEFAULT_CONFIG, type ConfigState } from "../../src/stores/ConfigStore"

describe("theme variables", () => {
  it("emits every custom property the stylesheet reads", () => {
    const variables = themeVariables(DEFAULT_CONFIG)

    expect(variables["--primary"]).toBe("#ffc400")
    expect(variables["--background-dim"]).toBe("0.35")
    expect(variables["--bg-filter"]).toBe("none")
    expect(variables["--font-family"]).toContain("Poppins")
    expect(variables["--edge-padding"]).toBe("3rem")
    expect(variables["--text-shadow"]).toBe("none")
  })

  it("composes only the image filters that differ from neutral", () => {
    const config = structuredClone(DEFAULT_CONFIG) as ConfigState
    config.theme.blur = 8
    config.theme.grayscale = 40
    config.theme.saturate = 100 // neutral, should be omitted

    expect(themeVariables(config)["--bg-filter"]).toBe(
      "blur(8px) grayscale(40%)"
    )
  })

  it("uses a gradient background when one is enabled", () => {
    const config = structuredClone(DEFAULT_CONFIG) as ConfigState
    config.theme.gradient = {
      enabled: true,
      from: "#000",
      to: "#fff",
      angle: 90,
    }

    expect(themeVariables(config)["--solid-background"]).toBe(
      "linear-gradient(90deg, #000, #fff)"
    )
  })

  it("collapses animation timing to zero when animations are off", () => {
    const config = structuredClone(DEFAULT_CONFIG) as ConfigState
    config.settings.animations = false

    expect(themeVariables(config)["--anim-scale"]).toBe("0")
  })
})

describe("rollIntervalMs", () => {
  it("maps each refresh mode to a hold time", () => {
    expect(rollIntervalMs("tab")).toBe(0)
    expect(rollIntervalMs("hourly")).toBe(3_600_000)
    expect(rollIntervalMs("daily")).toBe(86_400_000)
    expect(rollIntervalMs("manual")).toBe(Infinity)
  })
})

describe("date formatting", () => {
  const now = new Date("2024-09-10T15:49:00")

  it("formats each style", () => {
    expect(formatDate(now, "iso", "en-US")).toBe("2024-09-10")
    expect(formatDate(now, "full", "en-US")).toBe("Tuesday, September 10")
    expect(formatDate(now, "long", "en-US")).toBe("Tuesday, Sep 10")
    expect(formatDate(now, "short", "en-US")).toBe("Tue, Sep 10")
    expect(formatDate(now, "numeric", "en-US")).toBe("9/10/2024")
  })

  it("falls back to the long style for an unknown style", () => {
    expect(formatDate(now, "bogus" as never, "en-US")).toBe("Tuesday, Sep 10")
  })

  it("greets by time of day", () => {
    expect(greetingFor(8, "")).toBe("Good morning")
    expect(greetingFor(13, "Santi")).toBe("Good afternoon, Santi")
    expect(greetingFor(21, "Santi")).toBe("Good evening, Santi")
    expect(greetingFor(2, "")).toBe("Good morning")
  })
})

describe("keyboard helpers", () => {
  it("renders key codes for humans", () => {
    expect(formatKeyCode("KeyR")).toBe("R")
    expect(formatKeyCode("Digit4")).toBe("4")
    expect(formatKeyCode("ArrowLeft")).toBe("Arrow Left")
    expect(formatKeyCode("")).toBe("unset")
  })

  it("detects typing targets so shortcuts don't fire mid-word", () => {
    const input = document.createElement("input")
    const div = document.createElement("div")
    const editable = document.createElement("div")
    editable.contentEditable = "true"

    expect(isTypingTarget(input)).toBe(true)
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true)
    expect(isTypingTarget(div)).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})

describe("download helpers", () => {
  it("builds a safe filename from the wallpaper title", () => {
    expect(filenameFor("Scenery • Artist", "https://i.redd.it/a.png")).toBe(
      "Scenery • Artist.png"
    )
    expect(filenameFor('bad/name:"?', "https://i.redd.it/a.jpg")).toBe(
      "badname.jpg"
    )
    expect(filenameFor("", "https://i.redd.it/a")).toBe("wallpaper.jpg")
  })
})

describe("browser shim", () => {
  it("reports no extension API in a plain page", () => {
    expect(isExtension()).toBe(false)
  })

  it("assumes permission when there is no extension API to ask", async () => {
    await expect(hasOrigins(["https://example.com/*"])).resolves.toBe(true)
  })

  it("derives host match patterns from URLs", () => {
    expect(originPatternFor("https://cdn.example.com/a/b.png")).toBe(
      "https://cdn.example.com/*"
    )
    expect(originPatternFor("http://x.test:8080/y")).toBe(
      "http://x.test:8080/*"
    )
    expect(originPatternFor("ftp://x.test/y")).toBeNull()
    expect(originPatternFor("not a url")).toBeNull()
  })

  it("resolves through the callback form of the permissions API", async () => {
    vi.stubGlobal("chrome", {
      runtime: { id: "test-extension" },
      permissions: {
        contains: (
          _descriptor: unknown,
          callback: (granted: boolean) => void
        ) => callback(false),
        request: (
          _descriptor: unknown,
          callback: (granted: boolean) => void
        ) => callback(true),
      },
    })

    expect(isExtension()).toBe(true)
    await expect(hasOrigins(["https://example.com/*"])).resolves.toBe(false)
  })
})
