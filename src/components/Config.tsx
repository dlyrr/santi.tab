import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaSync,
  FaThumbtack,
  FaUserSecret,
} from "react-icons/fa"

import { useSnapshot } from "valtio"
import { LoadState, setLoaded, setShowRollOverlay } from "../stores/AppStore"
import { clearCache } from "../stores/CacheStore"
import {
  CONFIG_STATE_PICKABLE_FIELDS_MAP,
  ConfigStore,
  pickValue,
  toggle,
  toggleMenu,
  toggleNsfw,
  type ConfigStatePickableFields,
} from "../stores/ConfigStore"
import { HistoryStore, toggleFavoriteAt } from "../stores/HistoryStore"
import { downloadImage } from "../utils/download"
import { isTypingTarget } from "../utils/keys"
import { playRollSound } from "../utils/sound"
import "./styles/Config.scss"

const ValuePicker = ({
  valueKey,
}: {
  valueKey: keyof ConfigStatePickableFields
}) => {
  const config = useSnapshot(ConfigStore)
  const values = CONFIG_STATE_PICKABLE_FIELDS_MAP[valueKey]
  const curValue = config[valueKey]

  return (
    <div className="hideable">
      {values
        .map((value) =>
          value === curValue ? (
            <a key={value} className="selected">
              {value}
            </a>
          ) : (
            <a
              key={value}
              onClick={() => {
                pickValue(valueKey, value)
                clearCache()
                setLoaded(LoadState.FETCH_NEW)
              }}
            >
              {value}
            </a>
          )
        )
        .reduce((prev, cur) => <>{prev} • {cur}</>)}
    </div>
  )
}

function Config() {
  const config = useSnapshot(ConfigStore)
  const [isRolling, setIsRolling] = useState(false)
  const rollOverlayTimeout = useRef<number | null>(null)

  const reroll = useCallback(() => {
    if (config.settings.soundEffects) playRollSound(config.settings.volume)
    setIsRolling(false)
    setShowRollOverlay(false)
    if (rollOverlayTimeout.current) window.clearTimeout(rollOverlayTimeout.current)

    requestAnimationFrame(() => setIsRolling(true))
    if (config.settings.rerollFlash) {
      requestAnimationFrame(() => setShowRollOverlay(true))

      rollOverlayTimeout.current = window.setTimeout(
        () => setShowRollOverlay(false),
        900
      )
    }

    setLoaded(LoadState.FETCH_NEW)
  }, [
    config.settings.rerollFlash,
    config.settings.soundEffects,
    config.settings.volume,
  ])

  useEffect(() => {
    if (!isRolling) return

    const timeout = window.setTimeout(() => setIsRolling(false), 500)
    return () => window.clearTimeout(timeout)
  }, [isRolling])

  const buttons = useMemo(
    () => [
      {
        id: "nsfw",
        icon: FaExclamationTriangle,
        action: () => {
          if (config.pinned) ConfigStore.pinned = false
          toggleNsfw()
          clearCache()
          setLoaded(LoadState.FETCH_NEW)
        },
        isActive: config.nsfw,
        isDisabled: config.incognito,
        keyBinding: config.keybinds.nsfw,
      },
      {
        id: "pin",
        icon: FaThumbtack,
        action: () => toggle("pinned"),
        isActive: config.pinned,
        isDisabled: config.incognito,
        keyBinding: config.keybinds.pinned,
      },
      {
        id: "reroll",
        icon: FaSync,
        action: reroll,
        isActive: isRolling,
        isDisabled: config.incognito || config.pinned,
        keyBinding: config.keybinds.reroll,
      },
      {
        id: "incognito",
        icon: FaUserSecret,
        action: () => toggle("incognito"),
        isActive: config.incognito,
        keyBinding: config.keybinds.incognito,
      },
      {
        id: "hideGui",
        label: () => `${!config.hideGui ? "hide" : "show"} gui`,
        icon: config.hideGui ? FaEye : FaEyeSlash,
        action: () => toggle("hideGui"),
        keyBinding: config.keybinds.hideGui,
      },
    ],
    [
      config.hideGui,
      config.incognito,
      config.keybinds,
      config.nsfw,
      config.pinned,
      isRolling,
      reroll,
    ]
  )

  // Simplified keyboard event handler
  useEffect(() => {
    if (!config) return

    const action = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return

      // Never steal keys while the user is typing into the settings panel.
      if (isTypingTarget(e.target)) return

      const button = buttons.find(
        (btn) => btn.keyBinding && btn.keyBinding === e.code
      )
      if (button && !button.isDisabled) {
        button.action()
        return
      }

      const { keybinds } = ConfigStore
      const current = HistoryStore.history[HistoryStore.i]

      if (keybinds.menu && e.code === keybinds.menu) toggleMenu()
      else if (keybinds.favorite && e.code === keybinds.favorite)
        toggleFavoriteAt(HistoryStore.i)
      else if (keybinds.download && e.code === keybinds.download && current)
        downloadImage(current.url, current.title)
      else if (keybinds.openPost && e.code === keybinds.openPost && current)
        window.open(current.link, "_blank", "noopener,noreferrer")
    }

    document.addEventListener("keydown", action)
    return () => document.removeEventListener("keydown", action)
  }, [config, buttons])

  if (!config.layout.showControls) return null

  return (
    <div className="config">
      <ValuePicker valueKey="sort" />
      {config.sort !== "new" && <ValuePicker valueKey="t" />}

      <span className="buttons">
        {buttons.map((button) => (
          <button
            key={button.id}
            className={
              `button-${button.id}` + (button.isActive ? " active" : "")
            }
            onClick={button.action}
            disabled={button.isDisabled}
          >
            {button.label ? button.label() : button.id}
            <button.icon size={16} />
          </button>
        ))}
      </span>
    </div>
  )
}

export default Config
