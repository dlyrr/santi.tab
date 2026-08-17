import { resolveFont, type ConfigState } from "../stores/ConfigStore"

/**
 * Every visual knob in the settings panel funnels through here and comes out
 * as CSS custom properties, so App.scss never has to know what a setting is.
 */
export function themeVariables(config: ConfigState): Record<string, string> {
  const { theme, layout, clock, settings } = config

  const filters = [
    theme.blur ? `blur(${theme.blur}px)` : "",
    theme.saturate !== 100 ? `saturate(${theme.saturate}%)` : "",
    theme.brightness !== 100 ? `brightness(${theme.brightness}%)` : "",
    theme.contrast !== 100 ? `contrast(${theme.contrast}%)` : "",
    theme.grayscale ? `grayscale(${theme.grayscale}%)` : "",
  ].filter(Boolean)

  const background = theme.gradient.enabled
    ? `linear-gradient(${theme.gradient.angle}deg, ${theme.gradient.from}, ${theme.gradient.to})`
    : theme.solidColor

  // A speed of 0 would freeze mid-transition, so "off" is expressed as 0.001s.
  const speed = settings.animations
    ? `${1 / Math.max(settings.animationSpeed, 0.05)}`
    : "0"

  return {
    "--primary": theme.primary,
    "--background-dim": String(theme.backgroundDim),
    "--bg-filter": filters.length ? filters.join(" ") : "none",
    "--bg-zoom": String(theme.zoom),
    "--vignette": String(theme.vignette),
    "--ui-scale": String(theme.uiScale),
    "--clock-scale": String(clock.scale),
    "--font-family": resolveFont(theme.font),
    "--radius": `${theme.radius}px`,
    "--edge-padding": `${layout.padding}rem`,
    "--anim-scale": speed,
    "--solid-background": background,
    "--text-shadow": theme.textShadow
      ? "0 2px 12px rgba(0, 0, 0, 0.55)"
      : "none",
  }
}

/** Milliseconds a wallpaper should stay put before the next automatic roll. */
export function rollIntervalMs(refresh: ConfigState["settings"]["refresh"]) {
  switch (refresh) {
    case "hourly":
      return 1000 * 60 * 60
    case "daily":
      return 1000 * 60 * 60 * 24
    case "manual":
      return Infinity
    default:
      return 0
  }
}
