import "@testing-library/jest-dom"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Menu from "../../src/components/Menu"
import { Clock } from "../../src/components/TimeDate"
import {
  ConfigStore,
  isBlockVisible,
  LAYOUT_BLOCK_IDS,
  moveBlock,
  resolveBlocks,
  setBlockAlign,
  setBlockVisible,
  type ConfigState,
  type LayoutBlock,
} from "../../src/stores/ConfigStore"
import { resetStores } from "../helpers"

describe("resolveBlocks", () => {
  it("keeps a valid list untouched", () => {
    const blocks = LAYOUT_BLOCK_IDS.map((id) => ({ id, align: "inherit" as const }))
    expect(resolveBlocks(blocks).map((b) => b.id)).toEqual([...LAYOUT_BLOCK_IDS])
  })

  it("appends blocks added in a later version", () => {
    const old = [{ id: "clock", align: "center" }] as LayoutBlock[]
    const resolved = resolveBlocks(old)

    expect(resolved[0]).toEqual({ id: "clock", align: "center" })
    expect(resolved).toHaveLength(LAYOUT_BLOCK_IDS.length)
    expect(new Set(resolved.map((b) => b.id))).toEqual(new Set(LAYOUT_BLOCK_IDS))
  })

  it("drops unknown ids and de-duplicates", () => {
    const messy = [
      { id: "clock", align: "left" },
      { id: "clock", align: "right" },
      { id: "ghost", align: "left" },
    ] as unknown as LayoutBlock[]

    const resolved = resolveBlocks(messy)
    expect(resolved.filter((b) => b.id === "clock")).toHaveLength(1)
    expect(resolved[0].align).toBe("left")
    expect(resolved.some((b) => (b.id as string) === "ghost")).toBe(false)
  })

  it("tolerates a missing list entirely", () => {
    expect(resolveBlocks(undefined).map((b) => b.id)).toEqual([...LAYOUT_BLOCK_IDS])
  })
})

describe("block helpers", () => {
  beforeEach(resetStores)

  it("moves a block and stops at the ends", () => {
    moveBlock("clock", -1)
    expect(ConfigStore.layout.blocks[0].id).toBe("clock")

    // Already first -- must not wrap around to the bottom.
    moveBlock("clock", -1)
    expect(ConfigStore.layout.blocks[0].id).toBe("clock")

    moveBlock("clock", 1)
    expect(ConfigStore.layout.blocks[1].id).toBe("clock")
  })

  it("sets alignment per block without touching the others", () => {
    setBlockAlign("clock", "left")
    setBlockAlign("quote", "right")

    const blocks = resolveBlocks(ConfigStore.layout.blocks)
    expect(blocks.find((b) => b.id === "clock")?.align).toBe("left")
    expect(blocks.find((b) => b.id === "quote")?.align).toBe("right")
    expect(blocks.find((b) => b.id === "date")?.align).toBe("inherit")
  })

  it("routes visibility to whichever config flag owns it", () => {
    setBlockVisible("clock", false)
    expect(ConfigStore.layout.showClock).toBe(false)

    setBlockVisible("todo", true)
    expect(ConfigStore.widgets.todo.enabled).toBe(true)

    setBlockVisible("search", true)
    expect(ConfigStore.widgets.search.enabled).toBe(true)

    const config = ConfigStore as unknown as ConfigState
    expect(isBlockVisible(config, "clock")).toBe(false)
    expect(isBlockVisible(config, "todo")).toBe(true)
  })

  it("reports visibility for every known block", () => {
    const config = ConfigStore as unknown as ConfigState
    for (const id of LAYOUT_BLOCK_IDS) {
      expect(typeof isBlockVisible(config, id)).toBe("boolean")
    }
  })
})

describe("Layout panel", () => {
  beforeEach(resetStores)

  const openLayout = async () => {
    const user = userEvent.setup()
    render(<Menu />)
    await user.click(screen.getByRole("button", { name: /^layout$/i }))
    return user
  }

  it("lists every piece", async () => {
    await openLayout()

    const list = screen.getByRole("list", { name: /layout pieces/i })
    expect(within(list).getAllByRole("listitem")).toHaveLength(
      LAYOUT_BLOCK_IDS.length
    )
  })

  it("gives one piece its own side while the rest follow the page", async () => {
    const user = await openLayout()

    const clockRow = within(
      screen.getByRole("group", { name: /clock alignment/i })
    )
    await user.click(clockRow.getByRole("button", { name: "left" }))

    expect(
      resolveBlocks(ConfigStore.layout.blocks).find((b) => b.id === "clock")
        ?.align
    ).toBe("left")
    expect(
      resolveBlocks(ConfigStore.layout.blocks).find((b) => b.id === "date")
        ?.align
    ).toBe("inherit")
  })

  it("toggles a piece on and off", async () => {
    const user = await openLayout()

    await user.click(screen.getByRole("button", { name: /hide clock/i }))
    expect(ConfigStore.layout.showClock).toBe(false)

    await user.click(screen.getByRole("button", { name: /show clock/i }))
    expect(ConfigStore.layout.showClock).toBe(true)
  })

  it("reorders with the arrows and disables them at the ends", async () => {
    const user = await openLayout()

    expect(
      screen.getByRole("button", { name: /move greeting up/i })
    ).toBeDisabled()

    await user.click(screen.getByRole("button", { name: /move clock up/i }))
    expect(ConfigStore.layout.blocks[0].id).toBe("clock")
  })
})

describe("Clock seconds", () => {
  beforeEach(resetStores)

  it("renders seconds only when the setting is on", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-09-10T15:49:07"))
    ConfigStore.clock.locale = "en-US"

    const { rerender, unmount } = render(<Clock />)
    expect(screen.getByText("3:49 PM")).toBeInTheDocument()

    ConfigStore.clock.showSeconds = true
    rerender(<Clock />)
    expect(screen.getByText("3:49:07 PM")).toBeInTheDocument()

    unmount()
  })
})
