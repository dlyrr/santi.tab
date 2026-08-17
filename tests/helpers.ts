import { AppStore, LoadState } from "../src/stores/AppStore"
import { CacheStore } from "../src/stores/CacheStore"
import { resetConfig } from "../src/stores/ConfigStore"
import { HistoryStore } from "../src/stores/HistoryStore"
import type { ImageData } from "../src/types/ImageData"

export function resetStores() {
  AppStore.loaded = LoadState.FETCH_NEW
  AppStore.showRollOverlay = false
  AppStore.error = null
  AppStore.warning = null

  CacheStore.lastUpdated = -1
  CacheStore.lastRolled = -1
  CacheStore.data = []

  resetConfig()

  HistoryStore.history = []
  HistoryStore.i = -1
}

export function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "abc123",
    title: "Wallpaper [1920x1080] (Artist)",
    thumbnail: "default",
    url: "https://i.redd.it/wallpaper.jpg",
    ...overrides,
  }
}

export function makeListing(
  children: Array<Record<string, unknown>>,
  after: string | null = null,
) {
  return {
    data: {
      after,
      children: children.map((data) => ({ data })),
    },
  }
}

export function makeImageData(overrides: Partial<ImageData> = {}): ImageData {
  return {
    title: "Wallpaper • Artist",
    res: "1920 × 1080",
    url: "https://i.redd.it/wallpaper.jpg",
    link: "https://redd.it/abc123",
    nums: [0, 1],
    ...overrides,
  }
}
