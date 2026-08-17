import "@testing-library/jest-dom"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import QuickLinks from "../../src/components/QuickLinks"
import SearchBar from "../../src/components/SearchBar"
import { ConfigStore, createQuickLink } from "../../src/stores/ConfigStore"
import { resetStores } from "../helpers"

describe("SearchBar", () => {
  beforeEach(resetStores)

  it("renders nothing until it is enabled", () => {
    const { container } = render(<SearchBar />)
    expect(container).toBeEmptyDOMElement()
  })

  it("sends the query to the configured engine", async () => {
    ConfigStore.widgets.search.enabled = true
    ConfigStore.widgets.search.engine = "duckduckgo"

    const user = userEvent.setup()
    render(<SearchBar />)

    // jsdom refuses real navigation, so watch the assignment instead.
    const assign = vi.fn()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        get href() {
          return ""
        },
        set href(value: string) {
          assign(value)
        },
      },
    })

    await user.type(screen.getByRole("searchbox"), "cat pictures{Enter}")

    expect(assign).toHaveBeenCalledWith(
      "https://duckduckgo.com/?q=cat%20pictures"
    )
  })

  it("opens a new tab when asked to", async () => {
    ConfigStore.widgets.search.enabled = true
    ConfigStore.widgets.search.engine = "custom"
    ConfigStore.widgets.search.customUrl = "https://x.test/?q=%s"
    ConfigStore.widgets.search.newTab = true

    const open = vi.fn()
    vi.stubGlobal("open", open)

    const user = userEvent.setup()
    render(<SearchBar />)

    await user.type(screen.getByRole("searchbox"), "hi{Enter}")

    expect(open).toHaveBeenCalledWith(
      "https://x.test/?q=hi",
      "_blank",
      "noopener,noreferrer"
    )
  })

  it("ignores an empty query", async () => {
    ConfigStore.widgets.search.enabled = true
    ConfigStore.widgets.search.newTab = true

    const open = vi.fn()
    vi.stubGlobal("open", open)

    const user = userEvent.setup()
    render(<SearchBar />)

    await user.type(screen.getByRole("searchbox"), "   {Enter}")

    expect(open).not.toHaveBeenCalled()
  })
})

describe("QuickLinks", () => {
  beforeEach(resetStores)

  it("stays hidden while disabled or empty", () => {
    const { container, rerender } = render(<QuickLinks />)
    expect(container).toBeEmptyDOMElement()

    ConfigStore.widgets.quickLinks.enabled = true
    rerender(<QuickLinks />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders each shortcut with a favicon and label", () => {
    ConfigStore.widgets.quickLinks.enabled = true
    ConfigStore.widgets.quickLinks.items = [
      createQuickLink("GitHub", "https://github.com"),
    ]

    render(<QuickLinks />)

    const link = screen.getByRole("link", { name: /github/i })
    expect(link).toHaveAttribute("href", "https://github.com")
    expect(document.querySelector(".quick-link-icon img")).toHaveAttribute(
      "src",
      "https://github.com/favicon.ico"
    )
  })

  it("falls back to a monogram when the favicon fails", () => {
    ConfigStore.widgets.quickLinks.enabled = true
    ConfigStore.widgets.quickLinks.items = [
      createQuickLink("Example", "https://example.com"),
    ]

    render(<QuickLinks />)

    fireEvent.error(
      document.querySelector(".quick-link-icon img") as HTMLImageElement
    )

    expect(document.querySelector(".quick-link-icon.monogram")?.textContent).toBe(
      "E"
    )
  })

  it("opens shortcuts in a new tab when configured", () => {
    ConfigStore.widgets.quickLinks.enabled = true
    ConfigStore.widgets.quickLinks.newTab = true
    ConfigStore.widgets.quickLinks.showLabels = false
    ConfigStore.widgets.quickLinks.items = [
      createQuickLink("Docs", "https://docs.test"),
    ]

    render(<QuickLinks />)

    const link = document.querySelector(".quick-links a") as HTMLAnchorElement
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(document.querySelector(".quick-link-label")).toBeNull()
  })
})
