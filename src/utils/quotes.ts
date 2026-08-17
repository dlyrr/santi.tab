import type { Quote } from "../data/quotes"

/**
 * dummyjson.com is used because it answers with a permissive
 * `access-control-allow-origin`, so the request works from the extension
 * page without a host permission. That matters: any new host permission is
 * opt-in-and-ungranted on Firefox MV3, which would leave the widget silently
 * broken there until the user went hunting for a grant button.
 */
const ENDPOINT = "https://dummyjson.com/quotes/random"

const TIMEOUT_MS = 5000

type DummyJsonQuote = { quote?: string; author?: string }

/**
 * Fetches one quote, or returns null if the network is unavailable, slow, or
 * the response isn't shaped how we expect. Callers fall back to the bundled
 * set -- the widget must never render empty just because someone is offline.
 */
export async function fetchQuote(
  signal?: AbortSignal
): Promise<Quote | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  // Abort if either our timeout fires or the caller unmounts.
  signal?.addEventListener("abort", () => controller.abort(), { once: true })

  try {
    const res = await fetch(ENDPOINT, { signal: controller.signal })
    if (!res.ok) return null

    const json = (await res.json()) as DummyJsonQuote
    const text = json?.quote?.trim()

    if (!text) return null

    return { text, author: json.author?.trim() || "" }
  } catch {
    // Offline, DNS failure, CORS, timeout, malformed JSON -- all the same
    // outcome as far as the widget is concerned.
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/** True when a cached quote was fetched on the same local day as `now`. */
export const isSameDay = (timestamp: number, now: Date) => {
  if (!timestamp) return false

  const then = new Date(timestamp)
  return (
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()
  )
}
