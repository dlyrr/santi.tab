import "@testing-library/jest-dom"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Config from "../../src/components/Config"
import Menu from "../../src/components/Menu"
import {
  ConfigStore,
  DEFAULT_SETTINGS_TAB,
  toggleSettings,
} from "../../src/stores/ConfigStore"
import { HistoryStore } from "../../src/stores/HistoryStore"
import { makeImageData, resetStores } from "../helpers"

describe("toggleSettings", () => {
  beforeEach(resetStores)

  it("opens the menu on the default settings tab from a closed state", () => {
    toggleSettings()

    expect(ConfigStore.isMenuVisible).toBe(true)
    expect(ConfigStore.menuTab).toBe(DEFAULT_SETTINGS_TAB)
  })

  it("reopens on whichever settings tab was used last", () => {
    ConfigStore.menuTab = "clock"

    toggleSettings()
    expect(ConfigStore.menuTab).toBe("clock")
    expect(ConfigStore.isMenuVisible).toBe(true)

    toggleSettings()
    expect(ConfigStore.isMenuVisible).toBe(false)
    expect(ConfigStore.menuTab).toBe("clock")
  })

  it("switches away from History rather than closing", () => {
    ConfigStore.isMenuVisible = true
    ConfigStore.menuTab = "history"

    toggleSettings()

    expect(ConfigStore.isMenuVisible).toBe(true)
    expect(ConfigStore.menuTab).toBe(DEFAULT_SETTINGS_TAB)
  })
})

describe("settings button", () => {
  beforeEach(resetStores)

  it("opens and closes settings from the control bar", async () => {
    const user = userEvent.setup()
    render(<Config />)

    const button = screen.getByRole("button", { name: /settings/i })
    expect(button).not.toHaveClass("active")

    await user.click(button)
    expect(ConfigStore.isMenuVisible).toBe(true)
    expect(ConfigStore.menuTab).toBe(DEFAULT_SETTINGS_TAB)
    expect(button).toHaveClass("active")

    await user.click(button)
    expect(ConfigStore.isMenuVisible).toBe(false)
  })

  it("is not marked active while the History tab is showing", async () => {
    ConfigStore.isMenuVisible = true
    ConfigStore.menuTab = "history"

    render(<Config />)

    expect(screen.getByRole("button", { name: /settings/i })).not.toHaveClass(
      "active"
    )
  })

  it("answers its keyboard shortcut", () => {
    render(<Config />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS" }))
    })

    expect(ConfigStore.isMenuVisible).toBe(true)
    expect(ConfigStore.menuTab).toBe(DEFAULT_SETTINGS_TAB)
  })

  it("drives which panel the menu renders", async () => {
    const user = userEvent.setup()
    render(
      <>
        <Config />
        <Menu />
      </>
    )

    await user.click(screen.getByRole("button", { name: /settings/i }))

    // The Appearance pane, not History.
    expect(document.querySelector(".settings-panel")).toBeInTheDocument()
    expect(document.querySelector(".history-panel")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /set primary color to #ffc400/i })
    ).toBeInTheDocument()
  })

  it("offers a save button only once there is a wallpaper", async () => {
    const { rerender } = render(<Config />)
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()

    HistoryStore.history = [
      makeImageData({ title: "Scenery", url: "https://i.redd.it/a.jpg" }),
    ]
    HistoryStore.i = 0
    rerender(<Config />)

    const save = await screen.findByRole("button", { name: /save/i })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["x"]),
    })
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:x", revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    await userEvent.setup().click(save)

    expect(fetchMock).toHaveBeenCalledWith("https://i.redd.it/a.jpg")
    expect(click).toHaveBeenCalled()
  })

  it("remembers the tab picked in the sidebar", async () => {
    const user = userEvent.setup()
    render(<Menu />)

    await user.click(screen.getByRole("button", { name: /^clock$/i }))
    expect(ConfigStore.menuTab).toBe("clock")
  })
})
