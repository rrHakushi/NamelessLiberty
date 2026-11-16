import type { ComponentPresetItem } from "./types"

export const formPresets: ComponentPresetItem[] = [
  {
    id: "form-button-primary",
    name: "Primary Button",
    category: "forms",
    icon: "IconClick",
    description: "Action button with customizable variant and label",
    getNode: () => ({
      type: "Button",
      props: { variant: "default", size: "default" },
      children: "Get Started",
    }),
  },
  {
    id: "form-button-outline",
    name: "Outline Button",
    category: "forms",
    icon: "IconClick",
    description: "Secondary bordered action button",
    getNode: () => ({
      type: "Button",
      props: { variant: "outline", size: "default" },
      children: "Learn More",
    }),
  },
  {
    id: "form-input",
    name: "Text Field",
    category: "forms",
    icon: "IconForms",
    description: "Labeled text input field with placeholder",
    getNode: () => ({
      type: "Field",
      children: [
        { type: "FieldLabel", children: "Field Label" },
        { type: "Input", props: { placeholder: "Enter text..." } },
      ],
    }),
  },
  {
    id: "form-textarea",
    name: "Textarea Field",
    category: "forms",
    icon: "IconNotes",
    description: "Multi-line text input box",
    getNode: () => ({
      type: "Field",
      children: [
        { type: "FieldLabel", children: "Notes" },
        { type: "Textarea", props: { placeholder: "Write details here..." } },
      ],
    }),
  },
  {
    id: "form-switch",
    name: "Switch Toggle",
    category: "forms",
    icon: "IconToggleRight",
    description: "Boolean toggle switch component",
    getNode: () => ({
      type: "div",
      props: { className: "flex items-center justify-between gap-2" },
      children: [
        {
          type: "span",
          props: { className: "text-xs font-medium" },
          children: "Enable Feature",
        },
        { type: "Switch", props: { "aria-label": "Enable Feature" } },
      ],
    }),
  },
]
