import { useState } from "react"
import { FaPlus, FaTrash } from "react-icons/fa"
import { useSnapshot } from "valtio"

import {
  ConfigStore,
  clearCompletedTodos,
  createQuickLink,
  SEARCH_ENGINES,
  type SearchEngineKey,
} from "../../stores/ConfigStore"
import { Section, Segmented, TextField, Toggle } from "../ui/Controls"

/** Accepts "example.com" as well as a fully-qualified URL. */
const normalizeUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`
}

function QuickLinkEditor() {
  const { quickLinks } = useSnapshot(ConfigStore.widgets)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")

  const add = () => {
    const normalized = normalizeUrl(url)
    if (!normalized) return

    ConfigStore.widgets.quickLinks.items.push(
      createQuickLink(title.trim() || new URL(normalized).hostname, normalized)
    )

    setTitle("")
    setUrl("")
  }

  return (
    <div className="list-editor">
      <span className="control-label">Links</span>

      <ul className="list-editor-items">
        {quickLinks.items.map((link, index) => (
          <li key={link.id}>
            <span title={link.url}>
              {link.title} — {link.url}
            </span>
            <button
              type="button"
              aria-label={`Remove ${link.title}`}
              onClick={() => {
                ConfigStore.widgets.quickLinks.items.splice(index, 1)
              }}
            >
              <FaTrash size={11} />
            </button>
          </li>
        ))}

        {!quickLinks.items.length && (
          <li className="list-editor-empty">
            No shortcuts yet — add one below.
          </li>
        )}
      </ul>

      <form
        className="list-editor-add quick-link-add"
        onSubmit={(event) => {
          event.preventDefault()
          add()
        }}
      >
        <input
          type="text"
          aria-label="Shortcut name"
          placeholder="Name"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />

        <input
          type="text"
          aria-label="Shortcut URL"
          placeholder="example.com"
          value={url}
          spellCheck={false}
          onChange={(event) => setUrl(event.currentTarget.value)}
        />

        <button type="submit" aria-label="Add shortcut">
          <FaPlus size={12} />
        </button>
      </form>
    </div>
  )
}

export default function WidgetsPanel() {
  const { search, quickLinks, quotes, todo } = useSnapshot(ConfigStore.widgets)
  const { showMenuButton } = useSnapshot(ConfigStore.layout)

  return (
    <>
      <Section
        title="Search Bar"
        description="A search box on the new tab, pointed at whichever engine you prefer."
      >
        <Toggle
          label="Show search bar"
          value={search.enabled}
          onChange={(next) => {
            ConfigStore.widgets.search.enabled = next
          }}
        />

        <Segmented
          label="Engine"
          value={search.engine}
          options={(Object.keys(SEARCH_ENGINES) as SearchEngineKey[]).map(
            (key) => ({ value: key, label: SEARCH_ENGINES[key].label })
          )}
          onChange={(next) => {
            ConfigStore.widgets.search.engine = next
          }}
        />

        {search.engine === "custom" && (
          <TextField
            label="Custom search URL"
            value={search.customUrl}
            placeholder="https://example.com/search?q=%s"
            onChange={(next) => {
              ConfigStore.widgets.search.customUrl = next
            }}
          />
        )}

        <TextField
          label="Placeholder"
          value={search.placeholder}
          placeholder="Search the web"
          onChange={(next) => {
            ConfigStore.widgets.search.placeholder = next
          }}
        />

        <Toggle
          label="Focus on open"
          value={search.autofocus}
          onChange={(next) => {
            ConfigStore.widgets.search.autofocus = next
          }}
        />

        <Toggle
          label="Open in new tab"
          value={search.newTab}
          onChange={(next) => {
            ConfigStore.widgets.search.newTab = next
          }}
        />
      </Section>

      <Section
        title="Shortcuts"
        description="Quick links rendered under the clock."
      >
        <Toggle
          label="Show shortcuts"
          value={quickLinks.enabled}
          onChange={(next) => {
            ConfigStore.widgets.quickLinks.enabled = next
          }}
        />

        <Toggle
          label="Show labels"
          value={quickLinks.showLabels}
          onChange={(next) => {
            ConfigStore.widgets.quickLinks.showLabels = next
          }}
        />

        <Toggle
          label="Open in new tab"
          value={quickLinks.newTab}
          onChange={(next) => {
            ConfigStore.widgets.quickLinks.newTab = next
          }}
        />

        <QuickLinkEditor />
      </Section>

      <Section
        title="Quotes"
        description="A line of something inspiring above your widgets. The bundled quotes ship with the extension — nothing is fetched."
      >
        <Toggle
          label="Show a quote"
          value={quotes.enabled}
          onChange={(next) => {
            ConfigStore.widgets.quotes.enabled = next
          }}
        />

        <Segmented
          label="Change"
          value={quotes.rotation}
          options={[
            { value: "daily", label: "once a day" },
            { value: "tab", label: "every tab" },
          ]}
          onChange={(next) => {
            ConfigStore.widgets.quotes.rotation = next
          }}
        />

        <Toggle
          label="Show author"
          value={quotes.showAuthor}
          onChange={(next) => {
            ConfigStore.widgets.quotes.showAuthor = next
          }}
        />

        <TextField
          label="Your own quotes"
          value={quotes.custom}
          placeholder={"One per line:\nStay hungry — Steve Jobs"}
          multiline
          onChange={(next) => {
            ConfigStore.widgets.quotes.custom = next
          }}
        />
      </Section>

      <Section
        title="To-do"
        description="A small checklist on your new tab. Stored with your settings, so it travels with an export."
      >
        <Toggle
          label="Show to-do list"
          value={todo.enabled}
          onChange={(next) => {
            ConfigStore.widgets.todo.enabled = next
          }}
        />

        <Toggle
          label="Hide completed"
          value={todo.hideCompleted}
          onChange={(next) => {
            ConfigStore.widgets.todo.hideCompleted = next
          }}
        />

        <button
          type="button"
          className="wide-button"
          disabled={!todo.items.some((item) => item.done)}
          onClick={clearCompletedTodos}
        >
          Clear completed <FaTrash size={12} />
        </button>
      </Section>

      <Section
        title="Menu"
        description="The button that opens this panel. Hidden or not, it still answers its keyboard shortcut."
      >
        <Toggle
          label="Show menu button"
          value={showMenuButton}
          onChange={(next) => {
            ConfigStore.layout.showMenuButton = next
          }}
        />
      </Section>
    </>
  )
}
