import { beforeEach, describe, expect, it } from "vitest"
import {
  applyDefaults,
  ConfigStore,
  createQuickLink,
  DEFAULT_CONFIG,
  exportConfig,
  getFlair,
  importConfig,
  resetConfig,
  resolveFont,
  resolveSearchUrl,
  setFlair,
} from "../../src/stores/ConfigStore"
import { resetStores } from "../helpers"

describe("applyDefaults", () => {
  it("fills in missing keys without touching existing ones", () => {
    const target = { a: 1, nested: { kept: "yes" } } as Record<string, unknown>

    applyDefaults(target, {
      a: 99,
      b: 2,
      nested: { kept: "no", added: true },
      list: ["x"],
    })

    expect(target).toEqual({
      a: 1,
      b: 2,
      nested: { kept: "yes", added: true },
      list: ["x"],
    })
  })

  it("replaces a non-object where an object is expected", () => {
    const target = { theme: "broken" } as Record<string, unknown>

    applyDefaults(target, { theme: { primary: "#fff" } })

    expect(target.theme).toEqual({ primary: "#fff" })
  })

  it("clones array defaults so stores never share references", () => {
    const defaults = { items: ["a"] }
    const target = {} as Record<string, unknown>

    applyDefaults(target, defaults)
    ;(target.items as string[]).push("b")

    expect(defaults.items).toEqual(["a"])
  })
})

describe("import / export", () => {
  beforeEach(resetStores)

  it("round-trips the whole config", () => {
    ConfigStore.theme.primary = "#123456"
    ConfigStore.source.subreddits = ["wallpapers", "EarthPorn"]
    ConfigStore.clock.name = "Santi"

    const saved = exportConfig()
    resetConfig()
    expect(ConfigStore.theme.primary).toBe(DEFAULT_CONFIG.theme.primary)

    importConfig(saved)

    expect(ConfigStore.theme.primary).toBe("#123456")
    expect(ConfigStore.source.subreddits).toEqual(["wallpapers", "EarthPorn"])
    expect(ConfigStore.clock.name).toBe("Santi")
  })

  it("accepts a bare config object and back-fills missing keys", () => {
    importConfig(JSON.stringify({ theme: { primary: "#abcdef" } }))

    expect(ConfigStore.theme.primary).toBe("#abcdef")
    expect(ConfigStore.theme.backgroundDim).toBe(
      DEFAULT_CONFIG.theme.backgroundDim
    )
    expect(ConfigStore.settings.refresh).toBe(DEFAULT_CONFIG.settings.refresh)
  })

  it("drops keys the app doesn't know about", () => {
    importConfig(JSON.stringify({ config: { evil: true, q: "cats" } }))

    expect(ConfigStore.q).toBe("cats")
    expect("evil" in ConfigStore).toBe(false)
  })

  it("throws on malformed input", () => {
    expect(() => importConfig("not json")).toThrow()
    expect(() => importConfig('"a string"')).toThrow(/not an object/)
  })
})

describe("flair helpers", () => {
  beforeEach(resetStores)

  it("reads the flair out of a raw query", () => {
    expect(getFlair('flair:"Desktop"')).toBe("Desktop")
    expect(getFlair('flair:"Dual" 4k')).toBe("Dual")
    expect(getFlair("just words")).toBe("")
  })

  it("swaps the flair while keeping the rest of the query", () => {
    ConfigStore.q = 'flair:"Desktop" scenery'
    setFlair("Mobile")
    expect(ConfigStore.q).toBe('flair:"Mobile" scenery')

    setFlair("")
    expect(ConfigStore.q).toBe("scenery")

    setFlair("Dual")
    expect(ConfigStore.q).toBe('flair:"Dual" scenery')
  })
})

describe("resolvers", () => {
  it("builds search URLs for known and custom engines", () => {
    expect(resolveSearchUrl("duckduckgo", "", "hello world")).toBe(
      "https://duckduckgo.com/?q=hello%20world"
    )
    expect(
      resolveSearchUrl("custom", "https://x.test/find?query=%s", "a&b")
    ).toBe("https://x.test/find?query=a%26b")
    // A custom template without %s just gets the query appended.
    expect(resolveSearchUrl("custom", "https://x.test/?q=", "cat")).toBe(
      "https://x.test/?q=cat"
    )
    expect(resolveSearchUrl("custom", "   ", "cat")).toBeNull()
  })

  it("falls back to the default font stack for an unknown key", () => {
    expect(resolveFont("inter")).toContain("Inter")
    expect(resolveFont("nope" as never)).toContain("Poppins")
  })

  it("gives every quick link a distinct id", () => {
    const a = createQuickLink("A", "https://a.test")
    const b = createQuickLink("B", "https://b.test")

    expect(a.id).not.toBe(b.id)
    expect(a.title).toBe("A")
  })
})
