import "./styles/Menu.scss"
import { useEffect, useRef, useState, type ComponentType } from "react"
import {
  FaCog,
  FaDatabase,
  FaHistory,
  FaImage,
  FaKeyboard,
  FaPalette,
  FaRegClock,
  FaStar,
  FaThumbtack,
  FaTrash,
} from "react-icons/fa"
import { useSnapshot } from "valtio"

import { LoadState, setLoaded } from "../stores/AppStore"
import { ConfigStore } from "../stores/ConfigStore"
import {
  clearHistory,
  HistoryStore,
  removeHistoryAt,
  toggleFavoriteAt,
} from "../stores/HistoryStore"
import AppearancePanel from "./settings/AppearancePanel"
import BehaviorPanel from "./settings/BehaviorPanel"
import ClockPanel from "./settings/ClockPanel"
import DataPanel from "./settings/DataPanel"
import WallpaperPanel from "./settings/WallpaperPanel"
import WidgetsPanel from "./settings/WidgetsPanel"

const TABS = [
  { id: "history", label: "History", icon: FaHistory },
  { id: "wallpaper", label: "Wallpaper", icon: FaImage },
  { id: "appearance", label: "Appearance", icon: FaPalette },
  { id: "clock", label: "Clock", icon: FaRegClock },
  { id: "widgets", label: "Widgets", icon: FaCog },
  { id: "behavior", label: "Behavior", icon: FaKeyboard },
  { id: "data", label: "Data", icon: FaDatabase },
] as const

type MenuTab = (typeof TABS)[number]["id"]

const PANELS: Record<Exclude<MenuTab, "history">, ComponentType> = {
  wallpaper: WallpaperPanel,
  appearance: AppearancePanel,
  clock: ClockPanel,
  widgets: WidgetsPanel,
  behavior: BehaviorPanel,
  data: DataPanel,
}

type MenuCardProps = {
  data: (typeof HistoryStore.history)[number]
  index: number
  isCurrent: boolean
  isEntering: boolean
  isNewest: boolean
  isPinned: boolean
  onFavorite: () => void
  onRemove: () => void
}

function MenuCard({
  data,
  index,
  isCurrent,
  isEntering,
  isNewest,
  isPinned,
  onFavorite,
  onRemove,
}: MenuCardProps) {
  return (
    <div
      data-index={index}
      className={`card ${isPinned ? "pinned" : ""} ${isCurrent ? "current" : ""} ${isEntering ? "entering" : ""}`}
      onClick={
        () => {
          if (isPinned) {
            ConfigStore.pinned = false
            setLoaded(LoadState.LOADED)
          } else {
            ConfigStore.pinned = true
            HistoryStore.i = index
            setLoaded(isCurrent ? LoadState.LOADED : LoadState.LOADING)
          }
        }
      }
    >
      <div className="card-image">
        <img
          src={data.thumbnailUrl || data.url}
          loading="lazy"
          decoding="async"
          onLoad={(event) => {
            event.currentTarget.classList.add("loaded")
          }}
        />
      </div>

      <p className="card-details">
        <strong title={data.title || "Untitled Wallpaper"}>
          {data.title || "Untitled Wallpaper"}
        </strong>
        {data.res && <small>{data.res}</small>}
      </p>

      <p className="card-status">
        <span>#{String(index + 1).padStart(2, "0")}</span>
        {isPinned ? <FaThumbtack size={14} /> : isNewest ? "NEW" : null}
      </p>

      <div className="card-actions">
        <button
          type="button"
          className={`card-action-button card-favorite-button ${data.favorite ? "active" : ""}`}
          aria-label={`${data.favorite ? "Remove" : "Add"} ${data.title || "wallpaper"} ${data.favorite ? "from" : "to"} favorites`}
          onClick={(event) => {
            event.stopPropagation()
            onFavorite()
          }}
        >
          <FaStar size={13} />
        </button>

        <button
          type="button"
          className="card-action-button card-remove-button"
          aria-label={`Remove ${data.title || "wallpaper"} from history`}
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          <FaTrash size={13} />
        </button>
      </div>
    </div>
  )
}

function HistoryPanel() {
  const { history, i: historyIndex } = useSnapshot(HistoryStore)
  const { pinned } = useSnapshot(ConfigStore)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const previousHistoryLength = useRef(history.length)
  const [enteringIndex, setEnteringIndex] = useState<number | null>(null)

  const historyCards = [...history]
    .map((data, index) => ({ data, index }))
    .filter(({ data }) => !showFavoritesOnly || data.favorite)
    .reverse()

  useEffect(() => {
    if (history.length > previousHistoryLength.current) {
      setEnteringIndex(history.length - 1)
    }

    previousHistoryLength.current = history.length
  }, [history.length])

  return (
    <section className="history-panel" aria-label="History">
      <div className="cards-container">
        {historyCards.map(({ data, index }) => (
          <MenuCard
            key={`menu-card-${index}`}
            data={data}
            index={index}
            isCurrent={historyIndex === index}
            isEntering={enteringIndex === index}
            isNewest={index === history.length - 1}
            isPinned={pinned && historyIndex === index}
            onFavorite={() => toggleFavoriteAt(index)}
            onRemove={() => {
              if (pinned && historyIndex === index) ConfigStore.pinned = false
              removeHistoryAt(index)
            }}
          />
        ))}
      </div>

      <nav className="history-actions" aria-label="History actions">
        <button
          type="button"
          className={showFavoritesOnly ? "active" : ""}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <FaStar size={14} />
          Favorites
        </button>

        <button
          type="button"
          disabled={!history.some(({ favorite }) => !favorite)}
          onClick={() => {
            ConfigStore.pinned = false
            clearHistory()
          }}
        >
          <FaTrash size={14} />
          Clear
        </button>
      </nav>
    </section>
  )
}

export default function Menu() {
  const { isMenuVisible } = useSnapshot(ConfigStore)
  const [activeTab, setActiveTab] = useState<MenuTab>("history")

  const Panel = activeTab === "history" ? null : PANELS[activeTab]

  return (
    <div className={`menu ${isMenuVisible ? "visible" : ""}`}>
      <aside className="menu-sidebar" aria-label="Menu tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? "active" : ""}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </aside>

      <div className="menu-content">
        {Panel ? (
          <div className="settings-panel" aria-label={activeTab}>
            <Panel />
          </div>
        ) : (
          <HistoryPanel />
        )}
      </div>
    </div>
  )
}
