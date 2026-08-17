import { persist } from "valtio-persist"
import type { RedditPost } from "./HistoryStore"

export type CachedQuote = {
  text: string
  author: string
  fetchedAt: number
}

export type CacheStore = {
  /** When the post listing was last fetched. */
  lastUpdated: number
  /** When a new wallpaper was last picked -- drives the hourly/daily modes. */
  lastRolled: number
  data: RedditPost[]
  /** Last quote pulled from the API, so daily rotation isn't one call per tab. */
  quote: CachedQuote | null
}

export const { store: CacheStore } = await persist<CacheStore>(
  {
    lastUpdated: -1,
    lastRolled: -1,
    data: [],
    quote: null,
  },
  "cache"
)

if (CacheStore.quote === undefined) CacheStore.quote = null

if (typeof CacheStore.lastRolled !== "number") CacheStore.lastRolled = -1

export const clearCache = () => {
  CacheStore.data = []
  CacheStore.lastUpdated = -1
}
