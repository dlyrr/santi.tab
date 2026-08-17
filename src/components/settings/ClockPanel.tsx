import { useSnapshot } from "valtio"

import { ConfigStore } from "../../stores/ConfigStore"
import { Section, Segmented, Slider, TextField, Toggle } from "../ui/Controls"

export default function ClockPanel() {
  const { clock, layout } = useSnapshot(ConfigStore)

  return (
    <>
      <Section
        title="Time"
        description="How the clock reads. 'Auto' follows your system locale."
      >
        <Toggle
          label="Show clock"
          value={layout.showClock}
          onChange={(next) => {
            ConfigStore.layout.showClock = next
          }}
        />

        <Segmented
          label="Hour format"
          value={clock.hourFormat}
          options={[
            { value: "auto", label: "auto" },
            { value: "12", label: "12h" },
            { value: "24", label: "24h" },
          ]}
          onChange={(next) => {
            ConfigStore.clock.hourFormat = next
          }}
        />

        <Toggle
          label="Show seconds"
          value={clock.showSeconds}
          onChange={(next) => {
            ConfigStore.clock.showSeconds = next
          }}
        />

        <Slider
          label="Clock size"
          min={0.5}
          max={2.5}
          step={0.05}
          value={clock.scale}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(next) => {
            ConfigStore.clock.scale = next
          }}
        />
      </Section>

      <Section title="Date" description="Formatting for the line under the clock.">
        <Toggle
          label="Show date"
          value={layout.showDate}
          onChange={(next) => {
            ConfigStore.layout.showDate = next
          }}
        />

        <Segmented
          label="Style"
          value={clock.dateStyle}
          options={[
            { value: "full", label: "Wednesday, September 10" },
            { value: "long", label: "Wednesday, Sep 10" },
            { value: "short", label: "Wed, Sep 10" },
            { value: "numeric", label: "9/10/2024" },
            { value: "iso", label: "2024-09-10" },
          ]}
          onChange={(next) => {
            ConfigStore.clock.dateStyle = next
          }}
        />

        <TextField
          label="Locale override"
          value={clock.locale}
          placeholder="auto — e.g. en-GB, ja-JP, de-DE"
          onChange={(next) => {
            ConfigStore.clock.locale = next
          }}
        />
      </Section>

      <Section
        title="Greeting"
        description="An optional 'Good morning' line that changes with the time of day."
      >
        <Toggle
          label="Show greeting"
          value={layout.showGreeting}
          onChange={(next) => {
            ConfigStore.layout.showGreeting = next
          }}
        />

        <TextField
          label="Your name"
          value={clock.name}
          placeholder="leave empty for just 'Good morning'"
          onChange={(next) => {
            ConfigStore.clock.name = next
          }}
        />
      </Section>
    </>
  )
}
