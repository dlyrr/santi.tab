import { proxy } from "valtio"

export const LoadState = {
  FETCH_NEW: 0,
  LOADING: 1,
  LOADED: 2,
} as const
export type LoadState = (typeof LoadState)[keyof typeof LoadState]

export type AppStore = {
  loaded: LoadState
  showRollOverlay: boolean
  /** Human-readable reason the current source failed, or null when healthy. */
  error: string | null
  /** Set when some sources failed but others still returned wallpapers. */
  warning: string | null
}

export const AppStore = proxy<AppStore>({
  loaded: LoadState.FETCH_NEW,
  showRollOverlay: false,
  error: null,
  warning: null,
})

export const setLoaded = (state: LoadState) => {
  AppStore.loaded = state
}

export const setShowRollOverlay = (show: boolean) => {
  AppStore.showRollOverlay = show
}

export const setError = (error: string | null) => {
  AppStore.error = error
}

export const setWarning = (warning: string | null) => {
  AppStore.warning = warning
}
