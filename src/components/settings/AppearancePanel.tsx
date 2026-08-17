import type { CSSProperties } from "react"
import { FaEyeDropper } from "react-icons/fa"
import { useSnapshot } from "valtio"

import {
  ConfigStore,
  FONTS,
  PRIMARY_COLOR_PRESETS,
  type FontKey,
} from "../../stores/ConfigStore"
import { Section, Segmented, Slider, TextField, Toggle } from "../ui/Controls"

const percent = (value: number) => `${Math.round(value)}%`

export default function AppearancePanel() {
  const { theme, layout } = useSnapshot(ConfigStore)

  const primaryColor = theme.primary
  const isCustomPrimaryColor = !PRIMARY_COLOR_PRESETS.includes(
    primaryColor as (typeof PRIMARY_COLOR_PRESETS)[number]
  )

  return (
    <>
      <Section
        title="Accent Color"
        description="Customize the primary color used for highlights and links."
      >
        <div className="color-presets" aria-label="Primary color presets">
          {PRIMARY_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              className={primaryColor === color ? "active" : ""}
              style={{ "--preset-color": color } as CSSProperties}
              aria-label={`Set primary color to ${color}`}
              onClick={() => {
                ConfigStore.theme.primary = color
              }}
            />
          ))}

          <label
            className={
              "custom-color-button" + (isCustomPrimaryColor ? " active" : "")
            }
            style={{ "--preset-color": primaryColor } as CSSProperties}
            aria-label="Choose custom primary color"
          >
            <FaEyeDropper size={15} aria-hidden="true" />
            <input
              type="color"
              value={primaryColor}
              onChange={(event) => {
                ConfigStore.theme.primary = event.currentTarget.value
              }}
            />
          </label>
        </div>
      </Section>

      <Section
        title="Background Dim"
        description="Choose the background dim opacity percentage."
      >
        <Slider
          label="Opacity"
          className="dim-opacity-slider"
          min={0}
          max={0.9}
          step={0.01}
          value={theme.backgroundDim}
          format={(value) => percent(value * 100)}
          onChange={(next) => {
            ConfigStore.theme.backgroundDim = next
          }}
        />

        <Slider
          label="Vignette"
          min={0}
          max={1}
          step={0.01}
          value={theme.vignette}
          format={(value) => percent(value * 100)}
          onChange={(next) => {
            ConfigStore.theme.vignette = next
          }}
        />
      </Section>

      <Section
        title="Image Effects"
        description="Filters applied to the wallpaper itself."
      >
        <Slider
          label="Blur"
          min={0}
          max={40}
          value={theme.blur}
          format={(value) => `${value}px`}
          onChange={(next) => {
            ConfigStore.theme.blur = next
          }}
        />

        <Slider
          label="Saturation"
          min={0}
          max={200}
          value={theme.saturate}
          format={percent}
          onChange={(next) => {
            ConfigStore.theme.saturate = next
          }}
        />

        <Slider
          label="Brightness"
          min={20}
          max={180}
          value={theme.brightness}
          format={percent}
          onChange={(next) => {
            ConfigStore.theme.brightness = next
          }}
        />

        <Slider
          label="Contrast"
          min={20}
          max={200}
          value={theme.contrast}
          format={percent}
          onChange={(next) => {
            ConfigStore.theme.contrast = next
          }}
        />

        <Slider
          label="Grayscale"
          min={0}
          max={100}
          value={theme.grayscale}
          format={percent}
          onChange={(next) => {
            ConfigStore.theme.grayscale = next
          }}
        />

        <Slider
          label="Zoom"
          min={1}
          max={1.6}
          step={0.01}
          value={theme.zoom}
          format={(value) => `${value.toFixed(2)}×`}
          onChange={(next) => {
            ConfigStore.theme.zoom = next
          }}
        />

        <Toggle
          label="Slow pan"
          value={theme.kenBurns}
          onChange={(next) => {
            ConfigStore.theme.kenBurns = next
          }}
        />
      </Section>

      <Section
        title="Typography"
        description="Fonts are bundled with the extension — nothing is fetched at runtime."
      >
        <Segmented
          label="Font"
          value={theme.font}
          options={(Object.keys(FONTS) as FontKey[]).map((key) => ({
            value: key,
            label: FONTS[key].label,
          }))}
          onChange={(next) => {
            ConfigStore.theme.font = next
          }}
        />

        <Slider
          label="UI scale"
          min={0.7}
          max={1.6}
          step={0.05}
          value={theme.uiScale}
          format={(value) => percent(value * 100)}
          onChange={(next) => {
            ConfigStore.theme.uiScale = next
          }}
        />

        <Toggle
          label="Text shadow"
          value={theme.textShadow}
          onChange={(next) => {
            ConfigStore.theme.textShadow = next
          }}
        />

        <Slider
          label="Corner radius"
          min={0}
          max={32}
          value={theme.radius}
          format={(value) => `${value}px`}
          onChange={(next) => {
            ConfigStore.theme.radius = next
          }}
        />
      </Section>

      <Section
        title="Layout"
        description="Where the clock and details sit on the page."
      >
        <Segmented
          label="Horizontal"
          value={layout.align}
          options={[
            { value: "left", label: "left" },
            { value: "center", label: "center" },
            { value: "right", label: "right" },
          ]}
          onChange={(next) => {
            ConfigStore.layout.align = next
          }}
        />

        <Segmented
          label="Vertical"
          value={layout.vertical}
          options={[
            { value: "top", label: "top" },
            { value: "center", label: "center" },
            { value: "bottom", label: "bottom" },
          ]}
          onChange={(next) => {
            ConfigStore.layout.vertical = next
          }}
        />

        <Slider
          label="Edge padding"
          min={0}
          max={8}
          step={0.25}
          value={layout.padding}
          format={(value) => `${value}rem`}
          onChange={(next) => {
            ConfigStore.layout.padding = next
          }}
        />
      </Section>

      <Section
        title="Elements"
        description="Hide anything you don't want on your new tab."
      >
        <Toggle
          label="Clock"
          value={layout.showClock}
          onChange={(next) => {
            ConfigStore.layout.showClock = next
          }}
        />

        <Toggle
          label="Date"
          value={layout.showDate}
          onChange={(next) => {
            ConfigStore.layout.showDate = next
          }}
        />

        <Toggle
          label="Wallpaper details"
          value={layout.showDetails}
          onChange={(next) => {
            ConfigStore.layout.showDetails = next
          }}
        />

        <Toggle
          label="Top controls"
          value={layout.showControls}
          onChange={(next) => {
            ConfigStore.layout.showControls = next
          }}
        />

        <Toggle
          label="Attribution"
          value={layout.showAttribution}
          onChange={(next) => {
            ConfigStore.layout.showAttribution = next
          }}
        />

        <Toggle
          label="Credits"
          value={layout.showCredits}
          onChange={(next) => {
            ConfigStore.layout.showCredits = next
          }}
        />
      </Section>

      <Section
        title="Custom CSS"
        description="Injected into the page verbatim. Great for fine-tuning, easy to break things with."
        wide
      >
        <TextField
          label="Stylesheet"
          value={theme.customCss}
          placeholder={".time { letter-spacing: -0.04em; }"}
          multiline
          monospace
          onChange={(next) => {
            ConfigStore.theme.customCss = next
          }}
        />
      </Section>
    </>
  )
}
