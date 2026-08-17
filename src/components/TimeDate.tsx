import { useEffect, useState } from "react"
import { useSnapshot } from "valtio"

import { ConfigStore } from "../stores/ConfigStore"
import { formatDate, greetingFor } from "../utils/datetime"

import "./styles/TimeDate.scss"

/** Ticks once a second so the clock (and its optional seconds) stay current. */
function useNow() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return now
}

export function Greeting() {
  const { clock, layout } = useSnapshot(ConfigStore)
  const now = useNow()

  if (!layout.showGreeting) return null

  return <p className="greeting">{greetingFor(now.getHours(), clock.name.trim())}</p>
}

export function Clock() {
  const { clock, layout } = useSnapshot(ConfigStore)
  const now = useNow()

  if (!layout.showClock) return null

  const time = now.toLocaleTimeString(clock.locale.trim() || undefined, {
    hour: "numeric",
    minute: "numeric",
    second: clock.showSeconds ? "2-digit" : undefined,
    hour12: clock.hourFormat === "auto" ? undefined : clock.hourFormat === "12",
  })

  return <h1 className="time">{time}</h1>
}

export function DateLine() {
  const { clock, layout } = useSnapshot(ConfigStore)
  const now = useNow()

  if (!layout.showDate) return null

  return (
    <h2 className="date">
      {formatDate(now, clock.dateStyle, clock.locale.trim() || undefined)}
    </h2>
  )
}

/** All three together, in their default order. */
export const TimeDate = function () {
  return (
    <>
      <Greeting />
      <Clock />
      <DateLine />
    </>
  )
}

export default TimeDate
