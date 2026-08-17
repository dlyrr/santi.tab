import { persist } from "valtio-persist"
import type { RedditPost } from "./HistoryStore"

export type CacheStore = {
  /** When the post listing was last fetched. */
  lastUpdated: number
  /** When a new wallpaper was last picked -- drives the hourly/daily modes. */
  lastRolled: number
  data: RedditPost[]
}

export const { store: CacheStore } = await persist<CacheStore>(
  {
    lastUpdated: -1,
    lastRolled: -1,
    data: [],
  },
  "cache"
)

if (typeof CacheStore.lastRolled !== "number") CacheStore.lastRolled = -1

export const clearCache = () => {
  CacheStore.data = []
  CacheStore.lastUpdated = -1
}
