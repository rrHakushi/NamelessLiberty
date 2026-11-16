import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { IconCompass, IconHome } from "@tabler/icons-react"
import type { Session } from "@/context/session-context"
import type { SidebarConfig } from "@/types/sidebar-config"

export function getReliquarySidebarConfig(
  _session: Session | null,
  t: (key: string) => string = (key) => {
    const defaults: Record<string, string> = {
      home: "Home",
      browse: "Browse",
    }
    return defaults[key] ?? key
  }
): SidebarConfig {
  return [
    {
      section: "",
      dataKey: "reliquary-main",
      items: [
        {
          label: t("home"),
          dataKey: "reliquary-home",
          href: "/reliquary",
          icon: <IconHome className="size-4 shrink-0" />,
        },
        {
          label: t("browse"),
          dataKey: "reliquary-browse",
          href: "/reliquary/browse",
          icon: <IconCompass className="size-4 shrink-0" />,
        },
      ],
    },
    {
      section: "#$Phone",
      dataKey: "mobile-dock",
      items: [
        {
          label: t("home"),
          dataKey: "home",
          href: "/reliquary",
          icon: <IconHome className="size-4 shrink-0" />,
        },
        {
          label: t("browse"),
          dataKey: "browse",
          href: "/reliquary/browse",
          icon: <IconCompass className="size-4 shrink-0" />,
        },
      ],
    },
  ]
}

export function useReliquarySidebarConfig(session: Session | null): SidebarConfig {
  const t = useTranslations("navigation.reliquarySidebar")

  return useMemo(() => getReliquarySidebarConfig(session, t), [session, t])
}
