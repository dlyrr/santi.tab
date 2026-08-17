import { useMemo } from "react"
import { useSnapshot } from "valtio"

import { ConfigStore } from "../stores/ConfigStore"
import { dailyIndex, parseQuote, QUOTES, type Quote } from "../data/quotes"

import "./styles/Quote.scss"

export default function QuoteWidget() {
  const { quotes } = useSnapshot(ConfigStore.widgets)

  const pool = useMemo<Quote[]>(() => {
    const custom = quotes.custom
      .split("\n")
      .map(parseQuote)
      .filter((quote): quote is Quote => !!quote)

    return custom.length ? custom : QUOTES
  }, [quotes.custom])

  // "daily" keeps every tab opened today on the same quote; "tab" rerolls.
  const quote = useMemo(() => {
    if (!pool.length) return null

    const index =
      quotes.rotation === "daily"
        ? dailyIndex(new Date(), pool.length)
        : Math.floor(Math.random() * pool.length)

    return pool[index]
  }, [pool, quotes.rotation])

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
