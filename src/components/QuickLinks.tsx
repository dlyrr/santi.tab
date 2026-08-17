import { useState } from "react"
import { useSnapshot } from "valtio"

import { ConfigStore, type QuickLink } from "../stores/ConfigStore"

import "./styles/QuickLinks.scss"

const faviconFor = (url: string) => {
  try {
    return `${new URL(url).origin}/favicon.ico`
  } catch {
    return null
  }
}

/**
 * Favicons are fetched straight from the linked site -- no third-party favicon
 * proxy. Sites that don't serve /favicon.ico fall back to a letter monogram.
 */
function LinkIcon({ link }: { link: QuickLink }) {
  const [failed, setFailed] = useState(false)
  const favicon = faviconFor(link.url)

  if (!favicon || failed) {
    return (
      <span className="quick-link-icon monogram" aria-hidden="true">
        {(link.title || link.url).trim().charAt(0).toUpperCase() || "?"}
      </span>
    )
  }

  return (
    <span className="quick-link-icon" aria-hidden="true">
      <img src={favicon} alt="" loading="lazy" onError={() => setFailed(true)} />
    </span>
  )
}

export default function QuickLinks() {
  const { quickLinks } = useSnapshot(ConfigStore.widgets)

  if (!quickLinks.enabled || !quickLinks.items.length) return null

  return (
    <nav className="quick-links" aria-label="Shortcuts">
      {quickLinks.items.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target={quickLinks.newTab ? "_blank" : undefined}
          rel={quickLinks.newTab ? "noopener noreferrer" : undefined}
          title={link.url}
        >
          <LinkIcon link={link} />
          {quickLinks.showLabels && (
            <span className="quick-link-label">{link.title}</span>
          )}
        </a>
      ))}
    </nav>
  )
}
