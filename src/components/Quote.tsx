import { useEffect, useMemo, useState } from "react"
import { useSnapshot } from "valtio"

import { CacheStore } from "../stores/CacheStore"
import { ConfigStore } from "../stores/ConfigStore"
import { dailyIndex, parseQuote, QUOTES, type Quote } from "../data/quotes"
import { fetchQuote, isSameDay } from "../utils/quotes"

import "./styles/Quote.scss"

export default function QuoteWidget() {
  const { quotes } = useSnapshot(ConfigStore.widgets)
  const [remote, setRemote] = useState<Quote | null>(null)

  const pool = useMemo<Quote[]>(() => {
    const custom = quotes.custom
      .split("\n")
      .map(parseQuote)
      .filter((quote): quote is Quote => !!quote)

    return custom.length ? custom : QUOTES
  }, [quotes.custom])

  // Rendered immediately so the widget is never blank, and kept as the
  // fallback for whenever the API can't be reached.
  const offline = useMemo(() => {
    if (!pool.length) return null

    const index =
      quotes.rotation === "daily"
        ? dailyIndex(new Date(), pool.length)
        : Math.floor(Math.random() * pool.length)

    return pool[index]
  }, [pool, quotes.rotation])

  const usesApi = quotes.enabled && quotes.source === "online" && !quotes.custom.trim()

  useEffect(() => {
    if (!usesApi) {
      setRemote(null)
      return
    }

    const cached = CacheStore.quote

    // One call a day when rotating daily; every tab otherwise.
    if (
      quotes.rotation === "daily" &&
      cached &&
      isSameDay(cached.fetchedAt, new Date())
    ) {
      setRemote({ text: cached.text, author: cached.author })
      return
    }

    const controller = new AbortController()

    fetchQuote(controller.signal).then((quote) => {
      if (controller.signal.aborted || !quote) return

      setRemote(quote)
      CacheStore.quote = { ...quote, fetchedAt: Date.now() }
    })

    return () => controller.abort()
    // `cache.quote` is read once above on purpose -- re-running on every cache
    // write would refetch in a loop.
  }, [usesApi, quotes.rotation])

  const quote = remote ?? offline

  if (!quotes.enabled || !quote) return null

  return (
    <figure className="quote">
      <blockquote>{quote.text}</blockquote>
      {quotes.showAuthor && quote.author && (
        <figcaption>— {quote.author}</figcaption>
      )}
    </figure>
  )
}
