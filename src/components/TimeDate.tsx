import { useEffect, useState } from "react"
import { useSnapshot } from "valtio"

import { ConfigStore } from "../stores/ConfigStore"
import { formatDate, greetingFor } from "../utils/datetime"

import "./styles/TimeDate.scss"

export const TimeDate = function () {
  const { clock, layout } = useSnapshot(ConfigStore)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const locale = clock.locale.trim() || undefined

  const time = now.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "numeric",
    second: clock.showSeconds ? "2-digit" : undefined,
    hour12: clock.hourFormat === "auto" ? undefined : clock.hourFormat === "12",
  })

  return (
    <>
      {layout.showGreeting && (
        <p className="greeting">
          {greetingFor(now.getHours(), clock.name.trim())}
        </p>
      )}

      {layout.showClock && <h1 className="time">{time}</h1>}

      {layout.showDate && (
        <h2 className="date">{formatDate(now, clock.dateStyle, locale)}</h2>
      )}
    </>
  )
}

export default TimeDate
