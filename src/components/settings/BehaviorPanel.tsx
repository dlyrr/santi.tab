import { useEffect, useState } from "react"
import { useSnapshot } from "valtio"

import { clearCache } from "../../stores/CacheStore"
import {
  ConfigStore,
  KEYBIND_ACTIONS,
  type KeybindAction,
} from "../../stores/ConfigStore"
import { formatKeyCode } from "../../utils/keys"
import { Section, Segmented, Slider, Toggle } from "../ui/Controls"

function KeybindRow({ action }: { action: KeybindAction }) {
  const keybinds = useSnapshot(ConfigStore.keybinds)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    if (!listening) return

    const capture = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.code === "Escape") {
        setListening(false)
        return
      }

      const code = event.code === "Backspace" ? "" : event.code

      // A binding can only belong to one action at a time.
      for (const key of Object.keys(ConfigStore.keybinds) as KeybindAction[]) {
        if (key !== action && code && ConfigStore.keybinds[key] === code) {
          ConfigStore.keybinds[key] = ""
        }
      }

      ConfigStore.keybinds[action] = code
      setListening(false)
    }

    window.addEventListener("keydown", capture, true)
    return () => window.removeEventListener("keydown", capture, true)
  }, [action, listening])

  return (
    <label className="toggle-picker-row">
      <span>{KEYBIND_ACTIONS[action]}</span>
      <button
        type="button"
        className={listening ? "active" : ""}
        onClick={() => setListening((value) => !value)}
      >
        {listening ? "press a key" : formatKeyCode(keybinds[action])}
      </button>
    </label>
  )
}

export default function BehaviorPanel() {
  const { settings } = useSnapshot(ConfigStore)

  return (
    <>
      <Section
        title="Refresh"
        description="How often a fresh wallpaper is picked. Pinning always wins over this."
      >
        <Segmented
          label="Change wallpaper"
          value={settings.refresh}
          options={[
            { value: "tab", label: "every tab" },
            { value: "hourly", label: "hourly" },
            { value: "daily", label: "daily" },
            { value: "manual", label: "manual" },
          ]}
          onChange={(next) => {
            ConfigStore.settings.refresh = next
          }}
        />

        <Slider
          label="Cache listing for"
          min={1}
          max={168}
          value={settings.cacheHours}
          format={(value) => (value === 1 ? "1 hour" : `${value} hours`)}
          onChange={(next) => {
            ConfigStore.settings.cacheHours = next
          }}
        />

        <Slider
          label="Posts to fetch"
          min={25}
          max={500}
          step={25}
          value={settings.fetchLimit}
          format={(value) => `${value} posts`}
          onChange={(next) => {
            ConfigStore.settings.fetchLimit = next
            clearCache()
          }}
        />
      </Section>

      <Section
        title="Reroll Effects"
        description="Choose which effects play when rolling a new wallpaper."
      >
        <Toggle
          label="Reroll jingle"
          value={settings.soundEffects}
          onChange={(next) => {
            ConfigStore.settings.soundEffects = next
          }}
        />

        <Toggle
          label="Large flash"
          value={settings.rerollFlash}
          onChange={(next) => {
            ConfigStore.settings.rerollFlash = next
          }}
        />

        <Slider
          label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(next) => {
            ConfigStore.settings.volume = next
          }}
        />
      </Section>

      <Section
        title="Motion"
        description="Animations always stay off when your system asks for reduced motion."
      >
        <Toggle
          label="Animations"
          value={settings.animations}
          onChange={(next) => {
            ConfigStore.settings.animations = next
          }}
        />

        <Slider
          label="Speed"
          min={0.25}
          max={3}
          step={0.05}
          value={settings.animationSpeed}
          format={(value) => `${value.toFixed(2)}×`}
          onChange={(next) => {
            ConfigStore.settings.animationSpeed = next
          }}
        />
      </Section>

      <Section
        title="Keyboard Shortcuts"
        description="Click a binding, then press a key. Backspace clears it, Escape cancels."
        wide
      >
        {(Object.keys(KEYBIND_ACTIONS) as KeybindAction[]).map((action) => (
          <KeybindRow key={action} action={action} />
        ))}
      </Section>
    </>
  )
}
