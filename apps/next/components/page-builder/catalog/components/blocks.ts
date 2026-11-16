import type { ComponentPresetItem } from "./types"

export const blockPresets: ComponentPresetItem[] = [
  {
    id: "block-card",
    name: "Card Container",
    category: "blocks",
    icon: "IconCreditCard",
    description: "Surface card with header, title, and content",
    getNode: () => ({
      type: "Card",
      children: [
        {
          type: "CardHeader",
          children: [
            { type: "CardTitle", children: "Card Title" },
            { type: "CardDescription", children: "Card description text." },
          ],
        },
        {
          type: "CardContent",
          children: [{ type: "p", children: "Card body content goes here." }],
        },
      ],
    }),
  },
  {
    id: "block-flex-row",
    name: "Flex Row",
    category: "blocks",
    icon: "IconLayoutRows",
    description: "Horizontal flex container with gap spacing",
    getNode: () => ({
      type: "div",
      props: {
        className:
          "flex items-center justify-between gap-4 p-4 rounded-2xl border bg-card",
      },
      children: [],
    }),
  },
  {
    id: "block-empty-div",
    name: "Layout Item / Slot",
    category: "blocks",
    icon: "IconBoxPadding",
    description: "Empty layout container ready for child elements",
    getNode: () => ({
      type: "div",
      props: {
        className:
          "w-full p-4 rounded-2xl border border-dashed border-border/80 min-h-24",
      },
      children: [],
    }),
  },
  {
    id: "block-stack",
    name: "Vertical Stack",
    category: "blocks",
    icon: "IconLayoutList",
    description: "Vertical container with consistent spacing between blocks",
    getNode: () => ({
      type: "div",
      props: { className: "flex flex-col gap-3 w-full" },
      children: [],
    }),
  },
  {
    id: "block-badge-row",
    name: "Horizontal Tag Row",
    category: "blocks",
    icon: "IconLayoutDistributeHorizontal",
    description: "Wrapping row for badges, buttons, and inline actions",
    getNode: () => ({
      type: "div",
      props: { className: "flex flex-wrap items-center gap-2" },
      children: [
        { type: "Badge", props: { variant: "secondary" }, children: "Tag One" },
        { type: "Badge", props: { variant: "outline" }, children: "Tag Two" },
      ],
    }),
  },
  {
    id: "block-separator",
    name: "Separator Line",
    category: "blocks",
    icon: "IconMinus",
    description: "Clean horizontal divider between content groups",
    getNode: () => ({
      type: "Separator",
      props: { className: "my-4" },
    }),
  },
]
