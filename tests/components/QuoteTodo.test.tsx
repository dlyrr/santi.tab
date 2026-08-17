import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import QuoteWidget from "../../src/components/Quote"
import TodoList from "../../src/components/TodoList"
import { dailyIndex, parseQuote, QUOTES } from "../../src/data/quotes"
import {
  addTodo,
  clearCompletedTodos,
  ConfigStore,
  removeTodo,
  toggleTodo,
} from "../../src/stores/ConfigStore"
import { resetStores } from "../helpers"

describe("quote helpers", () => {
  it("splits an author off the end of a line", () => {
    expect(parseQuote("Stay hungry — Steve Jobs")).toEqual({
      text: "Stay hungry",
      author: "Steve Jobs",
    })
    expect(parseQuote("Stay hungry - Steve Jobs")).toEqual({
      text: "Stay hungry",
      author: "Steve Jobs",
    })
  })

  it("keeps a line with no author intact", () => {
    expect(parseQuote("Just do it")).toEqual({ text: "Just do it", author: "" })
  })

  it("ignores blank lines", () => {
    expect(parseQuote("   ")).toBeNull()
  })

  it("gives the same index all day and a different one tomorrow", () => {
    const monday = new Date("2026-08-17T01:00:00")
    const mondayNight = new Date("2026-08-17T23:59:00")
    const tuesday = new Date("2026-08-18T01:00:00")

    expect(dailyIndex(monday, 10)).toBe(dailyIndex(mondayNight, 10))
    expect(dailyIndex(monday, 10)).not.toBe(dailyIndex(tuesday, 10))
  })

  it("stays in range and tolerates an empty pool", () => {
    expect(dailyIndex(new Date(), 0)).toBe(0)
    expect(dailyIndex(new Date(), 3)).toBeLessThan(3)
  })
})

describe("Quote widget", () => {
  beforeEach(resetStores)

  it("renders nothing until enabled", () => {
    const { container } = render(<QuoteWidget />)
    expect(container).toBeEmptyDOMElement()
  })

  it("shows a bundled quote with its author", () => {
    ConfigStore.widgets.quotes.enabled = true

    render(<QuoteWidget />)

    const quote = document.querySelector("blockquote")?.textContent ?? ""
    expect(QUOTES.some((q) => q.text === quote)).toBe(true)
    expect(document.querySelector("figcaption")?.textContent).toMatch(/^— /)
  })

  it("hides the author when asked", () => {
    ConfigStore.widgets.quotes.enabled = true
    ConfigStore.widgets.quotes.showAuthor = false

    render(<QuoteWidget />)
    expect(document.querySelector("figcaption")).toBeNull()
  })

  it("prefers the user's own quotes over the bundled ones", () => {
    ConfigStore.widgets.quotes.enabled = true
    ConfigStore.widgets.quotes.custom = "Ship it — Santi"

    render(<QuoteWidget />)

    expect(screen.getByText("Ship it")).toBeInTheDocument()
    expect(screen.getByText("— Santi")).toBeInTheDocument()
  })

  it("falls back to the bundled set when custom quotes are all blank", () => {
    ConfigStore.widgets.quotes.enabled = true
    ConfigStore.widgets.quotes.custom = "\n   \n"

    render(<QuoteWidget />)

    const quote = document.querySelector("blockquote")?.textContent ?? ""
    expect(QUOTES.some((q) => q.text === quote)).toBe(true)
  })

  it("picks randomly when set to rotate every tab", () => {
    ConfigStore.widgets.quotes.enabled = true
    ConfigStore.widgets.quotes.rotation = "tab"
    vi.spyOn(Math, "random").mockReturnValue(0)

    render(<QuoteWidget />)

    expect(document.querySelector("blockquote")?.textContent).toBe(
      QUOTES[0].text
    )
  })
})

describe("todo store helpers", () => {
  beforeEach(resetStores)

  it("adds, toggles and removes items", () => {
    addTodo("  water the plants  ")

    const items = ConfigStore.widgets.todo.items
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ text: "water the plants", done: false })

    toggleTodo(items[0].id)
    expect(ConfigStore.widgets.todo.items[0].done).toBe(true)

    removeTodo(items[0].id)
    expect(ConfigStore.widgets.todo.items).toHaveLength(0)
  })

  it("ignores blank input", () => {
    addTodo("   ")
    expect(ConfigStore.widgets.todo.items).toHaveLength(0)
  })

  it("clears only completed items", () => {
    addTodo("one")
    addTodo("two")
    toggleTodo(ConfigStore.widgets.todo.items[0].id)

    clearCompletedTodos()

    expect(ConfigStore.widgets.todo.items.map((i) => i.text)).toEqual(["two"])
  })

  it("gives every item a distinct id", () => {
    addTodo("a")
    addTodo("b")

    const [a, b] = ConfigStore.widgets.todo.items
    expect(a.id).not.toBe(b.id)
  })
})

describe("TodoList widget", () => {
  beforeEach(resetStores)

  it("renders nothing until enabled", () => {
    const { container } = render(<TodoList />)
    expect(container).toBeEmptyDOMElement()
  })

  it("adds a task through the form and tracks what's left", async () => {
    ConfigStore.widgets.todo.enabled = true
    const user = userEvent.setup()

    render(<TodoList />)

    await user.type(screen.getByRole("textbox", { name: /add a task/i }), "buy milk{Enter}")

    expect(screen.getByText("buy milk")).toBeInTheDocument()
    expect(screen.getByText("1 left")).toBeInTheDocument()
    expect(ConfigStore.widgets.todo.items).toHaveLength(1)
  })

  it("checks items off and reports when everything is done", async () => {
    ConfigStore.widgets.todo.enabled = true
    addTodo("buy milk")
    const user = userEvent.setup()

    render(<TodoList />)

    await user.click(screen.getByRole("button", { name: /check buy milk/i }))

    expect(ConfigStore.widgets.todo.items[0].done).toBe(true)
    expect(screen.getByText("all done")).toBeInTheDocument()
  })

  it("hides completed items when configured", async () => {
    ConfigStore.widgets.todo.enabled = true
    ConfigStore.widgets.todo.hideCompleted = true
    addTodo("done thing")
    toggleTodo(ConfigStore.widgets.todo.items[0].id)
    addTodo("open thing")

    render(<TodoList />)

    expect(screen.queryByText("done thing")).not.toBeInTheDocument()
    expect(screen.getByText("open thing")).toBeInTheDocument()
  })

  it("removes an item from the list", async () => {
    ConfigStore.widgets.todo.enabled = true
    addTodo("temporary")
    const user = userEvent.setup()

    render(<TodoList />)

    await user.click(screen.getByRole("button", { name: /remove temporary/i }))
    expect(ConfigStore.widgets.todo.items).toHaveLength(0)
  })
})
