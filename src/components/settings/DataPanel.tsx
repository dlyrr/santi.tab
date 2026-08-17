import { useEffect, useRef, useState } from "react"
import { FaCheck, FaDownload, FaUndo, FaUpload } from "react-icons/fa"
import { useSnapshot } from "valtio"

import pkg from "../../../package.json"
import { LoadState, setLoaded } from "../../stores/AppStore"
import { clearCache } from "../../stores/CacheStore"
import {
  ConfigStore,
  exportConfig,
  importConfig,
  resetConfig,
} from "../../stores/ConfigStore"
import { clearHistory, HistoryStore } from "../../stores/HistoryStore"
import {
  hasOrigins,
  isExtension,
  REDDIT_ORIGINS,
  requestOrigins,
} from "../../utils/browser"
import { Section } from "../ui/Controls"

function PermissionSection() {
  const [granted, setGranted] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isExtension()) return
    hasOrigins(REDDIT_ORIGINS).then(setGranted)
  }, [])

  // Chromium grants host permissions at install time, so this only ever shows
  // up where it matters -- Firefox, where MV3 host permissions are opt-in.
  if (granted !== false) return null

  return (
    <Section
      title="Reddit Access"
      description="Firefox treats host permissions as optional. santi.tab needs access to reddit.com to list wallpapers."
    >
      <button
        type="button"
        className="wide-button"
        onClick={async () => {
          const ok = await requestOrigins(REDDIT_ORIGINS)
          setGranted(ok)
          if (ok) {
            clearCache()
            setLoaded(LoadState.FETCH_NEW)
          }
        }}
      >
        Grant reddit.com access <FaCheck size={13} />
      </button>
    </Section>
  )
}

export default function DataPanel() {
  const { history } = useSnapshot(HistoryStore)
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState("")

  const flash = (message: string) => {
    setStatus(message)
    window.setTimeout(() => setStatus(""), 2400)
  }

  const download = () => {
    const blob = new Blob([exportConfig()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")

    anchor.href = url
    anchor.download = `santi-tab-settings-v${pkg.version}.json`
    anchor.click()

    URL.revokeObjectURL(url)
    flash("Settings exported")
  }

  const upload = async (file: File) => {
    try {
      importConfig(await file.text())
      flash("Settings imported")
    } catch (error) {
      flash(`Import failed: ${(error as Error).message}`)
    }
  }

  return (
    <>
      <PermissionSection />

      <Section
        title="Backup"
        description="Move your entire setup between browsers and profiles."
      >
        <button type="button" className="wide-button" onClick={download}>
          Export settings <FaDownload size={13} />
        </button>

        <button
          type="button"
          className="wide-button"
          onClick={() => fileInput.current?.click()}
        >
          Import settings <FaUpload size={13} />
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label="Import settings file"
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) upload(file)
            event.currentTarget.value = ""
          }}
        />

        {status && <p className="settings-status">{status}</p>}
      </Section>

      <Section
        title="Reset"
        description="Clears stored data. Favorited wallpapers survive a history clear."
      >
        <button
          type="button"
          className="wide-button"
          onClick={() => {
            clearCache()
            setLoaded(LoadState.FETCH_NEW)
            flash("Wallpaper cache cleared")
          }}
        >
          Clear wallpaper cache
        </button>

        <button
          type="button"
          className="wide-button"
          disabled={!history.length}
          onClick={() => {
            ConfigStore.pinned = false
            clearHistory()
            flash("History cleared")
          }}
        >
          Clear history
        </button>

        <button
          type="button"
          className="wide-button danger"
          onClick={() => {
            resetConfig()
            clearCache()
            setLoaded(LoadState.FETCH_NEW)
            ConfigStore.isMenuVisible = true
            flash("Settings reset to defaults")
          }}
        >
          Reset all settings <FaUndo size={13} />
        </button>
      </Section>

      <Section
        title="About"
        description="santi.tab — a heavily customizable fork of Atarashii Tab Page."
      >
        <p className="about-line">
          Version <strong>{pkg.version}</strong>
        </p>

        <p className="about-line">
          <a href="https://github.com/dlyrr/santi.tab">
            github.com/dlyrr/santi.tab
          </a>
        </p>

        <p className="about-line">
          Forked from{" "}
          <a href="https://github.com/cf12/atarashii-tab">cf12/atarashii-tab</a>
        </p>
      </Section>
    </>
  )
}
