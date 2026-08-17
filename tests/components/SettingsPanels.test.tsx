import "@testing-library/jest-dom"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Menu from "../../src/components/Menu"
import { AppStore, LoadState } from "../../src/stores/AppStore"
import { CacheStore } from "../../src/stores/CacheStore"
import { ConfigStore } from "../../src/stores/ConfigStore"
import { resetStores } from "../helpers"

function openTab(name: RegExp) {
  const user = userEvent.setup()
  render(<Menu />)
  return {
    user,
    open: async () => user.click(screen.getByRole("button", { name })),
  }
}

describe("Wallpaper panel", () => {
  beforeEach(resetStores)

  it("adds and removes subreddits, invalidating the cache each time", async () => {
    const { user, open } = openTab(/wallpaper/i)
    await open()

    CacheStore.data = [{ id: "x", title: "x", url: "x" }]
    CacheStore.lastUpdated = Date.now()
    AppStore.loaded = LoadState.LOADED

    await user.type(
      screen.getByRole("textbox", { name: /add to subreddits/i }),
      "/r/EarthPorn{Enter}"
    )

    expect(ConfigStore.source.subreddits).toEqual([
      "Animewallpaper",
      "EarthPorn",
    ])
    expect(CacheStore.data).toEqual([])
    expect(AppStore.loaded).toBe(LoadState.FETCH_NEW)

    await user.click(screen.getByRole("button", { name: /remove EarthPorn/i }))
    expect(ConfigStore.source.subreddits).toEqual(["Animewallpaper"])
  })

  it("rejects blank and duplicate subreddits", async () => {
    const { user, open } = openTab(/wallpaper/i)
    await open()

    const field = screen.getByRole("textbox", { name: /add to subreddits/i })

    await user.type(field, "   {Enter}")
    await user.type(field, "Animewallpaper{Enter}")

    expect(ConfigStore.source.subreddits).toEqual(["Animewallpaper"])
  })

  it("rewrites the raw query when a flair is picked", async () => {
    const { user, open } = openTab(/wallpaper/i)
    await open()

    const flairs = within(screen.getByRole("group", { name: "Flair" }))

    await user.click(flairs.getByRole("button", { name: "ultrawide" }))
    expect(ConfigStore.q).toBe('flair:"Ultrawide"')

    await user.click(flairs.getByRole("button", { name: "any" }))
    expect(ConfigStore.q).toBe("")
  })

  it("switches to a gradient background source", async () => {
    const { user, open } = openTab(/wallpaper/i)
    await open()

    await user.click(screen.getByRole("button", { name: "solid / gradient" }))
    expect(ConfigStore.source.kind).toBe("color")

    await user.click(screen.getByRole("button", { name: "gradient" }))
    expect(ConfigStore.theme.gradient.enabled).toBe(true)

    fireEvent.change(screen.getByLabelText("Gradient from"), {
      target: { value: "#102030" },
    })
    expect(ConfigStore.theme.gradient.from).toBe("#102030")
  })

  it("keeps NSFW mode and the legacy nsfw flag in sync", async () => {
    const { user, open } = openTab(/wallpaper/i)
    await open()

    await user.click(screen.getByRole("button", { name: "only" }))
    expect(ConfigStore.nsfw).toBe(true)
    expect(ConfigStore.source.nsfwMode).toBe("only")

    await user.click(screen.getByRole("button", { name: "hide" }))
    expect(ConfigStore.nsfw).toBe(false)
    expect(ConfigStore.source.nsfwMode).toBe("off")
  })
})

describe("Clock panel", () => {
  beforeEach(resetStores)

  it("updates the clock format", async () => {
    const { user, open } = openTab(/clock/i)
    await open()

    await user.click(screen.getByRole("button", { name: "24h" }))
    expect(ConfigStore.clock.hourFormat).toBe("24")

    await user.click(screen.getByRole("button", { name: /show seconds/i }))
    expect(ConfigStore.clock.showSeconds).toBe(true)

    await user.type(screen.getByRole("textbox", { name: /your name/i }), "Santi")
    expect(ConfigStore.clock.name).toBe("Santi")
  })
})

describe("Behavior panel", () => {
  beforeEach(resetStores)

  it("rebinds a keyboard shortcut and steals it from its old owner", async () => {
    const { user, open } = openTab(/^behavior$/i)
    await open()

    // "reroll" is bound to R by default; give "Pin / unpin" that key instead.
    await user.click(screen.getByRole("button", { name: /pin \/ unpin/i }))
    fireEvent.keyDown(window, { code: "KeyR" })

    expect(ConfigStore.keybinds.pinned).toBe("KeyR")
    expect(ConfigStore.keybinds.reroll).toBe("")
  })

  it("clears a binding with backspace and cancels with escape", async () => {
    const { user, open } = openTab(/^behavior$/i)
    await open()

    await user.click(screen.getByRole("button", { name: /incognito/i }))
    fireEvent.keyDown(window, { code: "Backspace" })
    expect(ConfigStore.keybinds.incognito).toBe("")

    await user.click(screen.getByRole("button", { name: /hide \/ show gui/i }))
    fireEvent.keyDown(window, { code: "Escape" })
    expect(ConfigStore.keybinds.hideGui).toBe("KeyH")
  })

  it("changes the refresh schedule", async () => {
    const { user, open } = openTab(/^behavior$/i)
    await open()

    await user.click(screen.getByRole("button", { name: "daily" }))
    expect(ConfigStore.settings.refresh).toBe("daily")
  })
})

describe("Data panel", () => {
  beforeEach(resetStores)

  it("exports settings as a JSON download", async () => {
    const click = vi.fn()
    const createObjectURL = vi.fn(() => "blob:santi")
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(click)

    const { user, open } = openTab(/data/i)
    await open()

    await user.click(screen.getByRole("button", { name: /export settings/i }))

    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(screen.getByText(/settings exported/i)).toBeInTheDocument()
  })

  it("resets every setting back to its default", async () => {
    ConfigStore.theme.primary = "#000000"
    ConfigStore.clock.name = "temp"

    const { user, open } = openTab(/data/i)
    await open()

    await user.click(screen.getByRole("button", { name: /reset all settings/i }))

    expect(ConfigStore.theme.primary).toBe("#ffc400")
    expect(ConfigStore.clock.name).toBe("")
  })

  it("clears the wallpaper cache", async () => {
    CacheStore.data = [{ id: "x", title: "x", url: "x" }]
    CacheStore.lastUpdated = Date.now()

    const { user, open } = openTab(/data/i)
    await open()

    await user.click(
      screen.getByRole("button", { name: /clear wallpaper cache/i })
    )

    expect(CacheStore.data).toEqual([])
    expect(CacheStore.lastUpdated).toBe(-1)
  })
})

describe("Appearance panel", () => {
  beforeEach(resetStores)

  it("moves the layout and hides elements", async () => {
    const { user, open } = openTab(/appearance/i)
    await open()

    const horizontal = within(screen.getByRole("group", { name: "Horizontal" }))
    await user.click(horizontal.getByRole("button", { name: "center" }))
    expect(ConfigStore.layout.align).toBe("center")

    await user.click(screen.getByRole("button", { name: /^credits$/i }))
    expect(ConfigStore.layout.showCredits).toBe(false)
  })

  it("accepts custom CSS", async () => {
    const { open } = openTab(/appearance/i)
    await open()

    // Typed through fireEvent -- userEvent treats "{" as a key descriptor.
    fireEvent.change(screen.getByRole("textbox", { name: /stylesheet/i }), {
      target: { value: ".time { color: red; }" },
    })

    expect(ConfigStore.theme.customCss).toBe(".time { color: red; }")
  })
})
