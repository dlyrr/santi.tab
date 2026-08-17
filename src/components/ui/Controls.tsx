import type { CSSProperties, ReactNode } from "react"

/** A titled card in a settings panel. */
export function Section({
  title,
  description,
  wide,
  children,
}: {
  title: string
  description?: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <section className={`settings-section${wide ? " wide" : ""}`}>
      <div className="settings-header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      <div className="small-section">{children}</div>
    </section>
  )
}

/**
 * On/off switch. The <label> wraps the button so the visible text becomes the
 * button's accessible name -- screen readers and tests both read "Large flash".
 */
export function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="toggle-picker-row">
      <span>{label}</span>
      <button
        type="button"
        className={value ? "active" : ""}
        disabled={disabled}
        onClick={() => onChange(!value)}
      >
        {value ? "on" : "off"}
      </button>
    </label>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  className,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  className?: string
  onChange: (next: number) => void
}) {
  return (
    <div className="slider-control">
      <label className="range-picker-row">
        <span>{label}</span>
        <strong>{format ? format(value) : value}</strong>
      </label>

      <input
        className={className ?? "settings-slider"}
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (next: T) => void
}) {
  return (
    <div className="segmented-control">
      <span className="control-label">{label}</span>

      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "active" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TextField({
  label,
  value,
  placeholder,
  onChange,
  multiline,
  monospace,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (next: string) => void
  multiline?: boolean
  monospace?: boolean
}) {
  return (
    <label className={`text-field${monospace ? " mono" : ""}`}>
      <span className="control-label">{label}</span>

      {multiline ? (
        <textarea
          rows={5}
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )}
    </label>
  )
}

export function NumberField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  suffix?: string
  onChange: (next: number) => void
}) {
  return (
    <label className="text-field number-field">
      <span className="control-label">
        {label}
        {suffix ? ` (${suffix})` : ""}
      </span>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.currentTarget.value)
          onChange(Number.isFinite(next) ? next : 0)
        }}
      />
    </label>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label className="color-field">
      <span className="control-label">{label}</span>

      <span
        className="color-swatch"
        style={{ "--preset-color": value } as CSSProperties}
      >
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </span>
    </label>
  )
}
