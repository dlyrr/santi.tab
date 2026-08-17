import { useState } from "react"
import { FaPlus, FaTrash } from "react-icons/fa"

/**
 * Add/remove editor for a list of strings (subreddits, image URLs, ...).
 * `normalize` runs on submit so callers can clean up pasted values, and
 * returning an empty string rejects the entry.
 */
export function ListEditor({
  label,
  items,
  placeholder,
  emptyHint,
  normalize = (value) => value.trim(),
  onChange,
}: {
  label: string
  items: readonly string[]
  placeholder?: string
  emptyHint?: string
  normalize?: (value: string) => string
  onChange: (next: string[]) => void
}) {
  const [draft, setDraft] = useState("")

  const add = () => {
    const value = normalize(draft)
    if (!value || items.includes(value)) {
      setDraft("")
      return
    }

    onChange([...items, value])
    setDraft("")
  }

  return (
    <div className="list-editor">
      <span className="control-label">{label}</span>

      <ul className="list-editor-items">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>
            <span title={item}>{item}</span>
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <FaTrash size={11} />
            </button>
          </li>
        ))}

        {!items.length && emptyHint && (
          <li className="list-editor-empty">{emptyHint}</li>
        )}
      </ul>

      <form
        className="list-editor-add"
        onSubmit={(event) => {
          event.preventDefault()
          add()
        }}
      >
        <input
          type="text"
          aria-label={`Add to ${label}`}
          value={draft}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(event) => setDraft(event.currentTarget.value)}
        />

        <button type="submit" aria-label={`Add to ${label}`}>
          <FaPlus size={12} />
        </button>
      </form>
    </div>
  )
}

export default ListEditor
