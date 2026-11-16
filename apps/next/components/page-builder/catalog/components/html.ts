import type { ComponentPresetItem } from "./types"

export const htmlPresets: ComponentPresetItem[] = [
  {
    id: "html-image",
    name: "Image (img)",
    category: "html",
    icon: "IconPhoto",
    description: "Responsive image element with src and alt text",
    getNode: () => ({
      type: "img",
      props: {
        src: "https://placehold.co/800x400/18181b/a1a1aa?text=IRIS+Preview",
        alt: "Documentation illustration",
        className: "w-full rounded-2xl border border-border/60 object-cover",
      },
    }),
  },
  {
    id: "html-video",
    name: "Video Player",
    category: "html",
    icon: "IconVideo",
    description: "HTML5 video element with playback controls",
    getNode: () => ({
      type: "video",
      props: {
        src: "",
        controls: true,
        className: "w-full rounded-2xl border border-border/60 bg-black/90",
      },
    }),
  },
  {
    id: "html-iframe",
    name: "Iframe Embed",
    category: "html",
    icon: "IconAppWindow",
    description: "Embedded external app, demo, or interactive frame",
    getNode: () => ({
      type: "iframe",
      props: {
        src: "https://example.com",
        title: "Embedded content",
        className: "h-72 w-full rounded-2xl border border-border/60 bg-muted/20",
      },
    }),
  },
  {
    id: "html-details",
    name: "Disclosure (details)",
    category: "html",
    icon: "IconCaretDown",
    description: "Native collapsible HTML details/summary block",
    getNode: () => ({
      type: "details",
      props: {
        className:
          "rounded-2xl border border-border/60 bg-card/60 p-4 text-sm",
      },
      children: [
        {
          type: "summary",
          props: { className: "cursor-pointer font-semibold text-foreground" },
          children: "Click to expand details",
        },
        {
          type: "p",
          props: { className: "mt-2 text-muted-foreground" },
          children: "Hidden details or raw reference output.",
        },
      ],
    }),
  },
  {
    id: "html-hr",
    name: "Horizontal Rule (hr)",
    category: "html",
    icon: "IconMinus",
    description: "Standard HTML thematic break line",
    getNode: () => ({
      type: "hr",
      props: { className: "my-6 border-border/60" },
    }),
  },
]
