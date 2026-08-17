import { useSnapshot } from "valtio"

import { LoadState, setLoaded } from "../../stores/AppStore"
import { clearCache } from "../../stores/CacheStore"
import {
  CONFIG_STATE_PICKABLE_FIELDS_MAP,
  ConfigStore,
  getFlair,
  pickValue,
  setFlair,
} from "../../stores/ConfigStore"
import { normalizeSubreddit } from "../../utils/fetchPosts"
import {
  ColorField,
  NumberField,
  Section,
  Segmented,
  Slider,
  TextField,
} from "../ui/Controls"
import ListEditor from "../ui/ListEditor"

const FLAIRS = [
  { value: "", label: "any" },
  { value: "Desktop", label: "desktop" },
  { value: "Mobile", label: "mobile" },
  { value: "Dual", label: "dual" },
  { value: "Ultrawide", label: "ultrawide" },
]

/** Any change to what we fetch has to invalidate the cached listing. */
const refetch = () => {
  clearCache()
  setLoaded(LoadState.FETCH_NEW)
}

export default function WallpaperPanel() {
  const { source, q, sort, t, nsfw, theme } = useSnapshot(ConfigStore)
  const flair = getFlair(q)

  return (
    <>
      <Section
        title="Source"
        description="Where santi.tab pulls your wallpapers from."
      >
        <Segmented
          label="Type"
          value={source.kind}
          options={[
            { value: "reddit", label: "reddit" },
            { value: "urls", label: "image urls" },
            { value: "color", label: "solid / gradient" },
          ]}
          onChange={(kind) => {
            ConfigStore.source.kind = kind
            refetch()
          }}
        />
      </Section>

      {source.kind === "reddit" && (
        <>
          <Section
            title="Subreddits"
            description="Pull from as many subreddits as you like. Results are merged and de-duplicated."
          >
            <ListEditor
              label="Subreddits"
              items={source.subreddits}
              placeholder="r/wallpapers"
              emptyHint="No subreddits — add one to start fetching."
              normalize={normalizeSubreddit}
              onChange={(next) => {
                ConfigStore.source.subreddits = next
                refetch()
              }}
            />
          </Section>

          <Section
            title="Search"
            description="Filter posts by flair or a raw reddit search query."
          >
            <Segmented
              label="Flair"
              value={flair}
              options={FLAIRS}
              onChange={(next) => {
                setFlair(next)
                refetch()
              }}
            />

            <TextField
              label="Raw query"
              value={q}
              placeholder='flair:"Desktop" 4k'
              onChange={(next) => {
                ConfigStore.q = next
              }}
            />

            <Segmented
              label="Sort"
              value={sort}
              options={CONFIG_STATE_PICKABLE_FIELDS_MAP.sort.map((value) => ({
                value,
                label: value,
              }))}
              onChange={(next) => {
                pickValue("sort", next)
                refetch()
              }}
            />

            {sort !== "new" && (
              <Segmented
                label="Time span"
                value={t}
                options={CONFIG_STATE_PICKABLE_FIELDS_MAP.t.map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(next) => {
                  pickValue("t", next)
                  refetch()
                }}
              />
            )}
          </Section>

          <Section
            title="Filters"
            description="Skip wallpapers that don't fit your screen. Posts without size metadata are always kept."
          >
            <Segmented
              label="Orientation"
              value={source.orientation}
              options={[
                { value: "any", label: "any" },
                { value: "landscape", label: "landscape" },
                { value: "portrait", label: "portrait" },
              ]}
              onChange={(next) => {
                ConfigStore.source.orientation = next
              }}
            />

            <NumberField
              label="Minimum width"
              suffix="px"
              min={0}
              step={160}
              value={source.minWidth}
              onChange={(next) => {
                ConfigStore.source.minWidth = Math.max(0, next)
              }}
            />

            <NumberField
              label="Minimum height"
              suffix="px"
              min={0}
              step={90}
              value={source.minHeight}
              onChange={(next) => {
                ConfigStore.source.minHeight = Math.max(0, next)
              }}
            />

            <Segmented
              label="NSFW"
              value={nsfw ? source.nsfwMode : "off"}
              options={[
                { value: "off", label: "hide" },
                { value: "include", label: "include" },
                { value: "only", label: "only" },
              ]}
              onChange={(next) => {
                ConfigStore.nsfw = next !== "off"
                ConfigStore.source.nsfwMode = next
                if (ConfigStore.pinned) ConfigStore.pinned = false
                refetch()
              }}
            />
          </Section>
        </>
      )}

      {source.kind === "urls" && (
        <Section
          title="Image URLs"
          description="Direct links to images. santi.tab picks one at random per tab."
          wide
        >
          <ListEditor
            label="Image URLs"
            items={source.urls}
            placeholder="https://example.com/wallpaper.jpg"
            emptyHint="No images yet — paste a direct image link above."
            onChange={(next) => {
              ConfigStore.source.urls = next
              refetch()
            }}
          />
        </Section>
      )}

      {source.kind === "color" && (
        <Section
          title="Background"
          description="No images — just a colour or gradient behind your widgets."
        >
          <ColorField
            label="Base colour"
            value={theme.solidColor}
            onChange={(next) => {
              ConfigStore.theme.solidColor = next
            }}
          />

          <Segmented
            label="Style"
            value={theme.gradient.enabled ? "gradient" : "solid"}
            options={[
              { value: "solid", label: "solid" },
              { value: "gradient", label: "gradient" },
            ]}
            onChange={(next) => {
              ConfigStore.theme.gradient.enabled = next === "gradient"
            }}
          />

          {theme.gradient.enabled && (
            <>
              <ColorField
                label="Gradient from"
                value={theme.gradient.from}
                onChange={(next) => {
                  ConfigStore.theme.gradient.from = next
                }}
              />

              <ColorField
                label="Gradient to"
                value={theme.gradient.to}
                onChange={(next) => {
                  ConfigStore.theme.gradient.to = next
                }}
              />

              <Slider
                label="Angle"
                min={0}
                max={360}
                value={theme.gradient.angle}
                format={(value) => `${value}°`}
                onChange={(next) => {
                  ConfigStore.theme.gradient.angle = next
                }}
              />
            </>
          )}
        </Section>
      )}
    </>
  )
}
