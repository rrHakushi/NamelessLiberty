import type { ComponentPresetItem } from "./types"

export const docsPresets: ComponentPresetItem[] = [
  {
    id: "docs-callout-tip",
    name: "Callout Tip",
    category: "docs",
    icon: "IconBulb",
    description: "Pro tip callout banner with green emerald accent",
    getNode: () => ({
      type: "Callout",
      props: { variant: "tip", title: "Pro Tip" },
      children: "Helpful hint or best practice recommendation for users.",
    }),
  },
  {
    id: "docs-callout-info",
    name: "Callout Info",
    category: "docs",
    icon: "IconInfoCircle",
    description: "Informational callout banner with blue accent",
    getNode: () => ({
      type: "Callout",
      props: { variant: "info", title: "Note" },
      children: "Background context or essential documentation note.",
    }),
  },
  {
    id: "docs-callout-warning",
    name: "Callout Warning",
    category: "docs",
    icon: "IconAlertTriangle",
    description: "Warning callout banner with amber accent",
    getNode: () => ({
      type: "Callout",
      props: { variant: "warning", title: "Warning" },
      children: "Potential caveats, breaking changes, or deprecation notices.",
    }),
  },
  {
    id: "docs-callout-danger",
    name: "Callout Danger",
    category: "docs",
    icon: "IconAlertCircle",
    description: "Critical warning callout banner with rose accent",
    getNode: () => ({
      type: "Callout",
      props: { variant: "danger", title: "Danger" },
      children: "Destructive action or critical security requirement.",
    }),
  },
  {
    id: "docs-callout-note",
    name: "Callout Note",
    category: "docs",
    icon: "IconNote",
    description: "Neutral reference callout box",
    getNode: () => ({
      type: "Callout",
      props: { variant: "note", title: "Reference" },
      children: "Additional technical reference or implementation detail.",
    }),
  },
  {
    id: "docs-tabs",
    name: "Tabs Panel",
    category: "docs",
    icon: "IconLayoutNavbar",
    description: "Interactive tabbed panels powered by React Aria",
    getNode: () => ({
      type: "Tabs",
      props: { defaultSelectedKey: "overview", className: "w-full space-y-3" },
      children: [
        {
          type: "TabsList",
          children: [
            {
              type: "TabsTrigger",
              props: { id: "overview" },
              children: "Overview",
            },
            {
              type: "TabsTrigger",
              props: { id: "usage" },
              children: "Usage",
            },
          ],
        },
        {
          type: "TabsContent",
          props: { id: "overview" },
          children: [
            {
              type: "p",
              props: { className: "text-sm text-muted-foreground" },
              children: "Overview panel content.",
            },
          ],
        },
        {
          type: "TabsContent",
          props: { id: "usage" },
          children: [
            {
              type: "p",
              props: { className: "text-sm text-muted-foreground" },
              children: "Usage instructions and examples.",
            },
          ],
        },
      ],
    }),
  },
  {
    id: "docs-accordion",
    name: "Accordion FAQ",
    category: "docs",
    icon: "IconChevronDown",
    description: "Collapsible disclosure section for FAQs and details",
    getNode: () => ({
      type: "Accordion",
      props: { className: "w-full" },
      children: [
        {
          type: "AccordionItem",
          props: { id: "item-1" },
          children: [
            { type: "AccordionTrigger", children: "How does this work?" },
            {
              type: "AccordionContent",
              children: [
                {
                  type: "p",
                  props: { className: "text-sm text-muted-foreground" },
                  children: "Expandable explanation or troubleshooting steps.",
                },
              ],
            },
          ],
        },
      ],
    }),
  },
  {
    id: "docs-code-block",
    name: "Code Block",
    category: "docs",
    icon: "IconCode",
    description:
      "Syntax highlighted code snippet with copy button and filename header",
    getNode: () => ({
      type: "CodeBlock",
      props: {
        language: "typescript",
        filename: "example.ts",
        code: `export function helloWorld(): string {\n  return "Hello from IRIS docs!";\n}`,
      },
    }),
  },
  {
    id: "docs-table",
    name: "API Spec Table",
    category: "docs",
    icon: "IconTable",
    description: "Structured table for API properties, types, and descriptions",
    getNode: () => ({
      type: "Table",
      children: [
        {
          type: "TableHeader",
          children: [
            {
              type: "TableRow",
              children: [
                { type: "TableHead", children: "Property" },
                { type: "TableHead", children: "Type" },
                { type: "TableHead", children: "Default" },
                { type: "TableHead", children: "Description" },
              ],
            },
          ],
        },
        {
          type: "TableBody",
          children: [
            {
              type: "TableRow",
              children: [
                {
                  type: "TableCell",
                  props: { className: "font-mono font-semibold text-xs" },
                  children: "variant",
                },
                {
                  type: "TableCell",
                  props: {
                    className: "font-mono text-xs text-muted-foreground",
                  },
                  children: '"default" | "outline"',
                },
                {
                  type: "TableCell",
                  props: {
                    className: "font-mono text-xs text-muted-foreground",
                  },
                  children: '"default"',
                },
                {
                  type: "TableCell",
                  children: "Visual styling variant of the component.",
                },
              ],
            },
          ],
        },
      ],
    }),
  },
  {
    id: "docs-algo-builder",
    name: "Algorithm Builder",
    category: "docs",
    icon: "IconListNumbers",
    description:
      "Interactive step-by-step algorithm specification with render & edit modes",
    getNode: () => ({
      type: "AlgoBuilder",
      props: {
        mode: "render",
        allowModeToggle: true,
        defaultValue: {
          title: "Algorithm Sequence",
          description: "Step-by-step execution flow",
          steps: [
            {
              id: "seq_1",
              kind: "sequence",
              title: "Validation & Setup",
              children: [
                {
                  id: "step_1",
                  kind: "step",
                  title: "Validate dtoIn schema",
                },
              ],
            },
          ],
        },
      },
    }),
  },
]
