import type { DateStyle } from "../stores/ConfigStore"

const DATE_OPTIONS: Record<
  Exclude<DateStyle, "iso">,
  Intl.DateTimeFormatOptions
> = {
  full: { weekday: "long", month: "long", day: "numeric" },
  long: { weekday: "long", month: "short", day: "numeric" },
  short: { weekday: "short", month: "short", day: "numeric" },
  numeric: { year: "numeric", month: "numeric", day: "numeric" },
}

export const formatDate = (
  now: Date,
  style: DateStyle,
  locale: string | undefined
) => {
  if (style === "iso") {
    // Local-date ISO, not UTC -- `toISOString` would roll over near midnight.
    const pad = (value: number) => String(value).padStart(2, "0")
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }

  return now.toLocaleDateString(locale, DATE_OPTIONS[style] ?? DATE_OPTIONS.long)
}

export const greetingFor = (hour: number, name: string) => {
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return name ? `${part}, ${name}` : part
}
