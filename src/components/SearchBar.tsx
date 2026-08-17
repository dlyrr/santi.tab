import { useEffect, useRef, useState } from "react"
import { FaSearch } from "react-icons/fa"
import { useSnapshot } from "valtio"

import { ConfigStore, resolveSearchUrl } from "../stores/ConfigStore"

import "./styles/SearchBar.scss"

export default function SearchBar() {
  const { search } = useSnapshot(ConfigStore.widgets)
  const [query, setQuery] = useState("")
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (search.autofocus) input.current?.focus()
  }, [search.autofocus])

  if (!search.enabled) return null

  return (
    <form
      className="search-bar"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()

        const trimmed = query.trim()
        if (!trimmed) return

        const url = resolveSearchUrl(search.engine, search.customUrl, trimmed)
        if (!url) return

        if (search.newTab) window.open(url, "_blank", "noopener,noreferrer")
        else window.location.href = url
      }}
    >
      <FaSearch size={15} aria-hidden="true" />

      <input
        ref={input}
        type="search"
        aria-label="Search"
        placeholder={search.placeholder || "Search the web"}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
    </form>
  )
}
