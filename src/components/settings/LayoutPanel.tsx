import { FaArrowDown, FaArrowUp } from "react-icons/fa"
import { useSnapshot } from "valtio"

import {
  BLOCK_LABELS,
  ConfigStore,
  isBlockVisible,
  moveBlock,
  resolveBlocks,
  setBlockAlign,
  setBlockVisible,
  type BlockAlign,
  type ConfigState,
} from "../../stores/ConfigStore"
import { Section, Segmented, Slider } from "../ui/Controls"

const ALIGNMENTS: ReadonlyArray<{ value: BlockAlign; label: string }> = [
  { value: "inherit", label: "auto" },
  { value: "left", label: "left" },
  { value: "center", label: "center" },
  { value: "right", label: "right" },
]

export default function LayoutPanel() {
  const config = useSnapshot(ConfigStore)
  const blocks = resolveBlocks(config.layout.blocks)

  return (
    <>
      <Section
        title="Page"
        description="Where the stack of widgets sits. Individual pieces can override the side below."
      >
        <Segmented
          label="Default side"
          value={config.layout.align}
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
          value={config.layout.vertical}
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
          value={config.layout.padding}
          format={(value) => `${value}rem`}
          onChange={(next) => {
            ConfigStore.layout.padding = next
          }}
        />
      </Section>

      <Section
        title="Pieces"
        description="Reorder with the arrows, switch each one on or off, and give any of them their own side. 'Auto' follows the default side above."
        wide
      >
        <ol className="block-editor" aria-label="Layout pieces">
          {blocks.map(({ id, align }, index) => {
            const visible = isBlockVisible(config as ConfigState, id)

            return (
              <li key={id} className={visible ? "" : "off"}>
                <span className="block-move">
                  <button
                    type="button"
                    aria-label={`Move ${BLOCK_LABELS[id]} up`}
                    disabled={index === 0}
                    onClick={() => moveBlock(id, -1)}
                  >
                    <FaArrowUp size={11} />
                  </button>

                  <button
                    type="button"
                    aria-label={`Move ${BLOCK_LABELS[id]} down`}
                    disabled={index === blocks.length - 1}
                    onClick={() => moveBlock(id, 1)}
                  >
                    <FaArrowDown size={11} />
                  </button>
                </span>

                <button
                  type="button"
                  className={`block-toggle ${visible ? "active" : ""}`}
                  aria-label={`${visible ? "Hide" : "Show"} ${BLOCK_LABELS[id]}`}
                  aria-pressed={visible}
                  onClick={() => setBlockVisible(id, !visible)}
                >
                  {BLOCK_LABELS[id]}
                </button>

                <span
                  className="block-align"
                  role="group"
                  aria-label={`${BLOCK_LABELS[id]} alignment`}
                >
                  {ALIGNMENTS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={align === option.value ? "active" : ""}
                      aria-pressed={align === option.value}
                      onClick={() => setBlockAlign(id, option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </span>
              </li>
            )
          })}
        </ol>
      </Section>
    </>
  )
}
