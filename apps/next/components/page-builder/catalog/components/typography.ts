import type { ComponentPresetItem } from "./types"

export const typographyPresets: ComponentPresetItem[] = [
  {
    id: "typo-heading-1",
    name: "Heading 1",
    category: "typography",
    icon: "IconHeading",
    description: "Large page section headline",
    getNode: () => ({
      type: "h1",
      props: { className: "text-3xl font-bold font-heading tracking-tight" },
      children: "Headline Title",
    }),
  },
  {
    id: "typo-heading-2",
    name: "Heading 2",
    category: "typography",
    icon: "IconHeading",
    description: "Secondary section headline",
    getNode: () => ({
      type: "h2",
      props: { className: "text-2xl font-semibold tracking-tight" },
      children: "Section Title",
    }),
  },
  {
    id: "typo-heading-3",
    name: "Heading 3",
    category: "typography",
    icon: "IconH3",
    description: "Subsection heading",
    getNode: () => ({
      type: "h3",
      props: { className: "text-lg font-semibold tracking-tight" },
      children: "Subsection Title",
    }),
  },
  {
    id: "typo-paragraph",
    name: "Paragraph",
    category: "typography",
    icon: "IconTypography",
    description: "Standard body text block",
    getNode: () => ({
      type: "p",
      props: { className: "text-sm text-muted-foreground leading-relaxed" },
      children:
        "Start typing your content here or connect dynamic state expressions.",
    }),
  },
  {
    id: "typo-blockquote",
    name: "Blockquote",
    category: "typography",
    icon: "IconQuote",
    description: "Styled quote or highlight excerpt",
    getNode: () => ({
      type: "blockquote",
      props: {
        className:
          "border-s-2 border-primary/50 ps-4 italic text-sm text-muted-foreground my-3",
      },
      children: "Important design principle or quotation goes here.",
    }),
  },
  {
    id: "typo-list",
    name: "Bullet List",
    category: "typography",
    icon: "IconList",
    description: "Unordered list with bullet items",
    getNode: () => ({
      type: "ul",
      props: {
        className: "list-disc ps-5 space-y-1.5 text-sm text-muted-foreground",
      },
      children: [
        { type: "li", children: "First item point" },
        { type: "li", children: "Second item point" },
      ],
    }),
  },
  {
    id: "typo-link",
    name: "Link (Anchor)",
    category: "typography",
    icon: "IconLink",
    description: "Inline hyperlink with customizable href URL",
    getNode: () => ({
      type: "a",
      props: {
        href: "https://example.com",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80",
      },
      children: "Learn more",
    }),
  },
  {
    id: "typo-inline-code",
    name: "Inline Code",
    category: "typography",
    icon: "IconCode",
    description: "Monospace code snippet tag",
    getNode: () => ({
      type: "code",
      props: {
        className:
          "rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground",
      },
      children: "iris-token",
    }),
  },
  {
    id: "typo-badge",
    name: "Badge",
    category: "typography",
    icon: "IconSparkles",
    description: "Status indicator or pill tag",
    getNode: () => ({
      type: "Badge",
      props: { variant: "secondary" },
      children: "Active Tag",
    }),
  },
]
