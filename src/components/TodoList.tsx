import { useState } from "react"
import { FaCheck, FaPlus, FaTimes } from "react-icons/fa"
import { useSnapshot } from "valtio"

import {
  addTodo,
  ConfigStore,
  removeTodo,
  toggleTodo,
} from "../stores/ConfigStore"

import "./styles/TodoList.scss"

export default function TodoList() {
  const { todo } = useSnapshot(ConfigStore.widgets)
  const [draft, setDraft] = useState("")

  if (!todo.enabled) return null

  const visible = todo.hideCompleted
    ? todo.items.filter((item) => !item.done)
    : todo.items

  const remaining = todo.items.filter((item) => !item.done).length

  return (
    <section className="todo" aria-label="To-do list">
      <header className="todo-header">
        <h3>To-do</h3>
        {!!todo.items.length && (
          <span>{remaining ? `${remaining} left` : "all done"}</span>
        )}
      </header>

      <ul className="todo-items">
        {visible.map((item) => (
          <li key={item.id} className={item.done ? "done" : ""}>
            <button
              type="button"
              className="todo-check"
              aria-label={`${item.done ? "Uncheck" : "Check"} ${item.text}`}
              aria-pressed={item.done}
              onClick={() => toggleTodo(item.id)}
            >
              {item.done && <FaCheck size={9} aria-hidden="true" />}
            </button>

            <span className="todo-text">{item.text}</span>

            <button
              type="button"
              className="todo-remove"
              aria-label={`Remove ${item.text}`}
              onClick={() => removeTodo(item.id)}
            >
              <FaTimes size={11} />
            </button>
          </li>
        ))}
      </ul>

      <form
        className="todo-add"
        onSubmit={(event) => {
          event.preventDefault()
          addTodo(draft)
          setDraft("")
        }}
      >
        <input
          type="text"
          aria-label="Add a task"
          placeholder="Add a task"
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
        />

        <button type="submit" aria-label="Add task">
          <FaPlus size={11} />
        </button>
      </form>
    </section>
  )
}
