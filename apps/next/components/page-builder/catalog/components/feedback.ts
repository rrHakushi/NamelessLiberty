import type { ComponentPresetItem } from "./types"

export const feedbackPresets: ComponentPresetItem[] = [
  {
    id: "feedback-alert",
    name: "Alert Notice",
    category: "feedback",
    icon: "IconMessageCircle",
    description: "Callout alert box for notices and warnings",
    getNode: () => ({
      type: "Alert",
      props: { variant: "default" },
      children: [
        { type: "AlertTitle", children: "Notification" },
        {
          type: "AlertDescription",
          children: "This is an important update or status note.",
        },
      ],
    }),
  },
  {
    id: "feedback-alert-destructive",
    name: "Alert Destructive",
    category: "feedback",
    icon: "IconAlertCircle",
    description: "Destructive alert banner for critical errors",
    getNode: () => ({
      type: "Alert",
      props: { variant: "destructive" },
      children: [
        { type: "AlertTitle", children: "Action Required" },
        {
          type: "AlertDescription",
          children: "Verify configuration before deploying to production.",
        },
      ],
    }),
  },
  {
    id: "feedback-progress",
    name: "Progress Bar",
    category: "feedback",
    icon: "IconLoader",
    description: "Linear completion indicator (0-100)",
    getNode: () => ({
      type: "Progress",
      props: { value: 65, className: "w-full" },
    }),
  },
  {
    id: "feedback-skeleton",
    name: "Skeleton Loader",
    category: "feedback",
    icon: "IconRectangle",
    description: "Animated loading placeholder block",
    getNode: () => ({
      type: "Skeleton",
      props: { className: "h-10 w-full rounded-xl" },
    }),
  },
  {
    id: "feedback-avatar",
    name: "User Avatar",
    category: "feedback",
    icon: "IconUser",
    description: "Rounded avatar with fallback initials",
    getNode: () => ({
      type: "Avatar",
      props: { size: "default" },
      children: [{ type: "AvatarFallback", children: "IU" }],
    }),
  },
]
