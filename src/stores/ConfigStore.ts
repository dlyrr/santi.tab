import { persist } from "valtio-persist"

export const PRIMARY_COLOR_PRESETS = [
  "#ffc400",
  "#ff6b6b",
  "#7c5cff",
  "#00d2ff",
  "#2ee59d",
] as const

export const CONFIG_STATE_PICKABLE_FIELDS_MAP = {
  sort: ["relevance", "hot", "top", "new"],
  t: ["hour", "day", "week", "month", "year", "all"],
}

export const CONFIG_STATE_TOGGLEABLE_FIELDS = [
  "nsfw",
  "incognito",
  "hideGui",
  "pinned",
] as const

export const FONTS = {
  poppins: { label: "Poppins", stack: `"Poppins", sans-serif` },
  inter: { label: "Inter", stack: `"Inter", sans-serif` },
  montserrat: { label: "Montserrat", stack: `"Montserrat", sans-serif` },
  spaceGrotesk: {
    label: "Space Grotesk",
    stack: `"Space Grotesk", sans-serif`,
  },
  jetbrainsMono: {
    label: "JetBrains Mono",
    stack: `"JetBrains Mono", monospace`,
  },
  system: {
    label: "System",
    stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
  },
  serif: { label: "Serif", stack: `Georgia, "Times New Roman", serif` },
} as const

export type FontKey = keyof typeof FONTS

export const SEARCH_ENGINES = {
  google: { label: "Google", url: "https://www.google.com/search?q=%s" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=%s" },
  brave: { label: "Brave", url: "https://search.brave.com/search?q=%s" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=%s" },
  startpage: {
    label: "Startpage",
    url: "https://www.startpage.com/sp/search?query=%s",
  },
  ecosia: { label: "Ecosia", url: "https://www.ecosia.org/search?q=%s" },
  youtube: {
    label: "YouTube",
    url: "https://www.youtube.com/results?search_query=%s",
  },
  custom: { label: "Custom", url: "" },
} as const

export type SearchEngineKey = keyof typeof SEARCH_ENGINES

/** Actions that can be driven from the keyboard. */
export const KEYBIND_ACTIONS = {
  reroll: "Reroll wallpaper",
  pinned: "Pin / unpin",
  incognito: "Incognito",
  hideGui: "Hide / show GUI",
  nsfw: "Toggle NSFW",
  settings: "Open / close settings",
  menu: "Open / close menu",
  favorite: "Favorite current",
  download: "Download wallpaper",
  openPost: "Open source post",
} as const

export type KeybindAction = keyof typeof KEYBIND_ACTIONS

/**
 * Menu tabs, in sidebar order. Everything after "history" is a settings pane,
 * which is what the settings button jumps to.
 */
export const MENU_TABS = [
  "history",
  "wallpaper",
  "appearance",
  "layout",
  "clock",
  "widgets",
  "behavior",
  "data",
] as const

export type MenuTab = (typeof MENU_TABS)[number]

export const DEFAULT_SETTINGS_TAB: MenuTab = "appearance"

/**
 * The stackable pieces of the new tab, in default top-to-bottom order. Their
 * order and per-piece alignment live in `layout.blocks`; visibility stays on
 * the existing `layout.show*` / `widgets.*.enabled` flags so nothing about an
 * upgraded config changes meaning.
 */
export const LAYOUT_BLOCK_IDS = [
  "greeting",
  "clock",
  "date",
  "details",
  "search",
  "shortcuts",
  "quote",
  "todo",
] as const

export type BlockId = (typeof LAYOUT_BLOCK_IDS)[number]

/** "inherit" follows the page-wide alignment; the rest override it. */
export type BlockAlign = "inherit" | "left" | "center" | "right"

export type LayoutBlock = { id: BlockId; align: BlockAlign }

export const BLOCK_LABELS: Record<BlockId, string> = {
  greeting: "Greeting",
  clock: "Clock",
  date: "Date",
  details: "Wallpaper details",
  search: "Search bar",
  shortcuts: "Shortcuts",
  quote: "Quote",
  todo: "To-do list",
}

export type Corner = "left" | "center" | "right"
export type Vertical = "top" | "center" | "bottom"
export type SourceKind = "reddit" | "urls" | "color"
export type NsfwMode = "off" | "include" | "only"
export type Orientation = "any" | "landscape" | "portrait"
export type RefreshMode = "tab" | "hourly" | "daily" | "manual"
export type DateStyle = "full" | "long" | "short" | "numeric" | "iso"
export type HourFormat = "auto" | "12" | "24"

export type QuickLink = {
  id: string
  title: string
  url: string
}

export type TodoItem = {
  id: string
  text: string
  done: boolean
}

export type QuoteRotation = "tab" | "daily"
export type QuoteSource = "online" | "bundled"

export type ConfigState = {
  num?: number
  q: string
  sort: (typeof CONFIG_STATE_PICKABLE_FIELDS_MAP.sort)[number]
  t: (typeof CONFIG_STATE_PICKABLE_FIELDS_MAP.t)[number]

  nsfw: boolean
  incognito: boolean
  hideGui: boolean
  pinned: boolean

  isMenuVisible: boolean
  menuTab: MenuTab

  theme: {
    primary: string
    backgroundDim: number
    blur: number
    saturate: number
    brightness: number
    contrast: number
    grayscale: number
    zoom: number
    kenBurns: boolean
    vignette: number
    font: FontKey
    uiScale: number
    textShadow: boolean
    radius: number
    solidColor: string
    gradient: {
      enabled: boolean
      from: string
      to: string
      angle: number
    }
    customCss: string
  }

  source: {
    kind: SourceKind
    subreddits: string[]
    nsfwMode: NsfwMode
    minWidth: number
    minHeight: number
    orientation: Orientation
    urls: string[]
  }

  layout: {
    align: Corner
    vertical: Vertical
    padding: number
    /** Order and per-piece alignment. Visibility stays on the flags below. */
    blocks: LayoutBlock[]
    showClock: boolean
    showDate: boolean
    showGreeting: boolean
    showDetails: boolean
    showControls: boolean
    showAttribution: boolean
    showCredits: boolean
    showMenuButton: boolean
  }

  clock: {
    hourFormat: HourFormat
    showSeconds: boolean
    dateStyle: DateStyle
    locale: string
    scale: number
    name: string
  }

  widgets: {
    search: {
      enabled: boolean
      engine: SearchEngineKey
      customUrl: string
      placeholder: string
      newTab: boolean
      autofocus: boolean
    }
    quickLinks: {
      enabled: boolean
      showLabels: boolean
      newTab: boolean
      items: QuickLink[]
    }
    quotes: {
      enabled: boolean
      /** "online" pulls from a quotes API and falls back to bundled offline. */
      source: QuoteSource
      rotation: QuoteRotation
      showAuthor: boolean
      /** One quote per line, "text — author". Empty falls back to the bundled set. */
      custom: string
    }
    todo: {
      enabled: boolean
      hideCompleted: boolean
      items: TodoItem[]
    }
  }

  settings: {
    soundEffects: boolean
    rerollFlash: boolean
    volume: number
    animations: boolean
    animationSpeed: number
    refresh: RefreshMode
    cacheHours: number
    fetchLimit: number
  }

  keybinds: Record<KeybindAction, string>
}

export type ConfigStatePickableFields = {
  [K in keyof typeof CONFIG_STATE_PICKABLE_FIELDS_MAP]: ConfigState[K]
}

export type ConfigStateToggleableFields = {
  [K in (typeof CONFIG_STATE_TOGGLEABLE_FIELDS)[number]]: ConfigState[K]
}

export const DEFAULT_CONFIG: ConfigState = {
  num: undefined,
  q: `flair:"Desktop"`,
  sort: "top",
  t: "year",

  nsfw: false,
  incognito: false,
  hideGui: false,
  pinned: false,

  isMenuVisible: false,
  menuTab: "history",

  theme: {
    primary: PRIMARY_COLOR_PRESETS[0],
    backgroundDim: 0.35,
    blur: 0,
    saturate: 100,
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    zoom: 1,
    kenBurns: false,
    vignette: 0,
    font: "poppins",
    uiScale: 1,
    textShadow: false,
    radius: 16,
    solidColor: "#1b1b1f",
    gradient: {
      enabled: false,
      from: "#1b1b1f",
      to: "#3b2f63",
      angle: 135,
    },
    customCss: "",
  },

  source: {
    kind: "reddit",
    subreddits: ["Animewallpaper"],
    nsfwMode: "off",
    minWidth: 0,
    minHeight: 0,
    orientation: "any",
    urls: [],
  },

  layout: {
    align: "left",
    vertical: "top",
    padding: 3,
    blocks: LAYOUT_BLOCK_IDS.map((id) => ({ id, align: "inherit" as BlockAlign })),
    showClock: true,
    showDate: true,
    showGreeting: false,
    showDetails: true,
    showControls: true,
    showAttribution: true,
    showCredits: true,
    showMenuButton: true,
  },

  clock: {
    hourFormat: "auto",
    showSeconds: false,
    dateStyle: "long",
    locale: "",
    scale: 1,
    name: "",
  },

  widgets: {
    search: {
      enabled: false,
      engine: "duckduckgo",
      customUrl: "",
      placeholder: "Search the web",
      newTab: false,
      autofocus: false,
    },
    quickLinks: {
      enabled: false,
      showLabels: true,
      newTab: false,
      items: [],
    },
    quotes: {
      enabled: false,
      source: "online",
      rotation: "daily",
      showAuthor: true,
      custom: "",
    },
    todo: {
      enabled: false,
      hideCompleted: false,
      items: [],
    },
  },

  settings: {
    soundEffects: true,
    rerollFlash: true,
    volume: 0.5,
    animations: true,
    animationSpeed: 1,
    refresh: "tab",
    cacheHours: 24,
    fetchLimit: 200,
  },

  keybinds: {
    reroll: "KeyR",
    pinned: "KeyP",
    incognito: "KeyI",
    hideGui: "KeyH",
    nsfw: "",
    settings: "KeyS",
    menu: "KeyM",
    favorite: "KeyF",
    download: "KeyD",
    openPost: "KeyO",
  },
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

/**
 * Fills in keys a persisted config predates. Users upgrading from an older
 * version (or from upstream Atarashii) keep every setting they had while
 * picking up the new defaults instead of getting `undefined` everywhere.
 */
export const applyDefaults = <T extends Record<string, unknown>>(
  target: T,
  defaults: Record<string, unknown>
): T => {
  for (const [key, fallback] of Object.entries(defaults)) {
    const current = (target as Record<string, unknown>)[key]

    if (isPlainObject(fallback)) {
      if (!isPlainObject(current)) {
        ;(target as Record<string, unknown>)[key] = structuredClone(fallback)
      } else {
        applyDefaults(current, fallback)
      }
      continue
    }

    if (current === undefined && fallback !== undefined) {
      ;(target as Record<string, unknown>)[key] = Array.isArray(fallback)
        ? structuredClone(fallback)
        : fallback
    }
  }

  return target
}

export const { store: ConfigStore } = await persist<ConfigState>(
  structuredClone(DEFAULT_CONFIG),
  "config"
)

applyDefaults(ConfigStore as unknown as Record<string, unknown>, DEFAULT_CONFIG)

export const toggle = (key: keyof ConfigStateToggleableFields) => {
  ConfigStore[key] = !ConfigStore[key]
}

export const toggleNsfw = () => {
  ConfigStore.nsfw = !ConfigStore.nsfw
  ConfigStore.source.nsfwMode = ConfigStore.nsfw ? "only" : "off"
}

export const pickValue = <K extends keyof ConfigStatePickableFields>(
  key: K,
  value: ConfigState[K]
) => {
  // Sorting by new on Reddit needs to be all
  if (key === "sort" && value === "new") ConfigStore.t = "all"
  ConfigStore[key] = value
}

export const toggleMenu = () => {
  ConfigStore.isMenuVisible = !ConfigStore.isMenuVisible
}

export const setMenuTab = (tab: MenuTab) => {
  ConfigStore.menuTab = tab
}

/**
 * The settings button: opens the menu straight into settings, and closes it
 * again if that's already what you're looking at. Reopens on whichever
 * settings tab you used last -- never on History, which has its own button.
 */
export const toggleSettings = () => {
  const onSettings = ConfigStore.menuTab !== "history"

  if (ConfigStore.isMenuVisible && onSettings) {
    ConfigStore.isMenuVisible = false
    return
  }

  if (!onSettings) ConfigStore.menuTab = DEFAULT_SETTINGS_TAB
  ConfigStore.isMenuVisible = true
}

/** Restores every field to its shipped default. */
export const resetConfig = () => {
  Object.assign(ConfigStore, structuredClone(DEFAULT_CONFIG))
}

export const exportConfig = () =>
  JSON.stringify(
    { version: 1, config: JSON.parse(JSON.stringify(ConfigStore)) },
    null,
    2
  )

/**
 * Merges an exported settings blob back in. Unknown keys are dropped and
 * missing keys fall back to defaults, so a partial or older file still works.
 */
export const importConfig = (raw: string) => {
  const parsed = JSON.parse(raw) as unknown

  if (!isPlainObject(parsed)) throw new Error("Settings file is not an object")

  const incoming = isPlainObject(parsed.config) ? parsed.config : parsed
  const next = applyDefaults(
    structuredClone(incoming) as Record<string, unknown>,
    DEFAULT_CONFIG as unknown as Record<string, unknown>
  )

  // Only carry over keys we actually know about.
  for (const key of Object.keys(next)) {
    if (!(key in DEFAULT_CONFIG)) delete next[key]
  }

  Object.assign(ConfigStore, next)
  ConfigStore.isMenuVisible = true
}

export const resolveFont = (key: FontKey) =>
  (FONTS[key] ?? FONTS.poppins).stack

export const resolveSearchUrl = (
  engine: SearchEngineKey,
  customUrl: string,
  query: string
) => {
  const template =
    engine === "custom" ? customUrl.trim() : SEARCH_ENGINES[engine]?.url

  if (!template) return null

  const encoded = encodeURIComponent(query)
  return template.includes("%s")
    ? template.replace(/%s/g, encoded)
    : template + encoded
}

/** Reads the flair token out of the raw reddit query string. */
export const getFlair = (query: string) =>
  query.match(/flair:"([^"]*)"/)?.[1] ?? ""

/** Swaps (or removes) the flair token while leaving the rest of the query. */
export const setFlair = (flair: string) => {
  const rest = ConfigStore.q.replace(/flair:"[^"]*"\s*/g, "").trim()
  ConfigStore.q = flair ? `flair:"${flair}"${rest ? ` ${rest}` : ""}` : rest
}

// Not security-sensitive -- just needs to be stable per row for React keys.
const rowId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Repairs a persisted block list: drops ids we no longer know, de-duplicates,
 * and appends any block added in a later version. Without this, a config saved
 * before a new widget existed would render that widget nowhere at all.
 */
export const resolveBlocks = (blocks: readonly LayoutBlock[] = []) => {
  const seen = new Set<BlockId>()
  const resolved: LayoutBlock[] = []

  for (const block of blocks) {
    if (!LAYOUT_BLOCK_IDS.includes(block?.id) || seen.has(block.id)) continue

    seen.add(block.id)
    resolved.push({ id: block.id, align: block.align ?? "inherit" })
  }

  for (const id of LAYOUT_BLOCK_IDS) {
    if (!seen.has(id)) resolved.push({ id, align: "inherit" })
  }

  return resolved
}

export const setBlockAlign = (id: BlockId, align: BlockAlign) => {
  const blocks = resolveBlocks(ConfigStore.layout.blocks)
  const block = blocks.find((entry) => entry.id === id)
  if (!block) return

  block.align = align
  ConfigStore.layout.blocks = blocks
}

/** Moves a block up (-1) or down (+1); a no-op at either end. */
export const moveBlock = (id: BlockId, delta: number) => {
  const blocks = resolveBlocks(ConfigStore.layout.blocks)
  const from = blocks.findIndex((entry) => entry.id === id)
  const to = from + delta

  if (from < 0 || to < 0 || to >= blocks.length) return

  const [moved] = blocks.splice(from, 1)
  blocks.splice(to, 0, moved)
  ConfigStore.layout.blocks = blocks
}

/** Where each block's on/off switch actually lives. */
export const isBlockVisible = (config: ConfigState, id: BlockId): boolean => {
  switch (id) {
    case "greeting":
      return config.layout.showGreeting
    case "clock":
      return config.layout.showClock
    case "date":
      return config.layout.showDate
    case "details":
      return config.layout.showDetails
    case "search":
      return config.widgets.search.enabled
    case "shortcuts":
      return config.widgets.quickLinks.enabled
    case "quote":
      return config.widgets.quotes.enabled
    case "todo":
      return config.widgets.todo.enabled
  }
}

export const setBlockVisible = (id: BlockId, visible: boolean) => {
  switch (id) {
    case "greeting":
      ConfigStore.layout.showGreeting = visible
      break
    case "clock":
      ConfigStore.layout.showClock = visible
      break
    case "date":
      ConfigStore.layout.showDate = visible
      break
    case "details":
      ConfigStore.layout.showDetails = visible
      break
    case "search":
      ConfigStore.widgets.search.enabled = visible
      break
    case "shortcuts":
      ConfigStore.widgets.quickLinks.enabled = visible
      break
    case "quote":
      ConfigStore.widgets.quotes.enabled = visible
      break
    case "todo":
      ConfigStore.widgets.todo.enabled = visible
      break
  }
}

export const createQuickLink = (title: string, url: string): QuickLink => ({
  id: rowId(),
  title,
  url,
})

export const addTodo = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed) return

  ConfigStore.widgets.todo.items.push({ id: rowId(), text: trimmed, done: false })
}

export const toggleTodo = (id: string) => {
  const item = ConfigStore.widgets.todo.items.find((todo) => todo.id === id)
  if (item) item.done = !item.done
}

export const removeTodo = (id: string) => {
  const items = ConfigStore.widgets.todo.items
  const index = items.findIndex((todo) => todo.id === id)
  if (index >= 0) items.splice(index, 1)
}

export const clearCompletedTodos = () => {
  ConfigStore.widgets.todo.items = ConfigStore.widgets.todo.items.filter(
    (todo) => !todo.done
  )
}
