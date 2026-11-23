"use client"

import React, { useMemo } from "react"
import type { SidebarConfig } from "@/types/sidebar-config"
import { useTranslations } from "next-intl"
import {
  IconHome,
  IconSearch,
  IconMovie,
  IconTheater,
  IconCalendar,
  IconBook,
  IconList,
  IconMusic,
  IconDeviceGamepad,
  IconDeviceTv,
  IconBook2,
  IconListDetails,
  IconListCheck,
  IconCode,
  IconSettings,
  IconCompass,
  IconFolders,
} from "@tabler/icons-react"
import type { Session } from "@/context/session-context"

export function getBorealisSidebarConfig(
  session: Session | null,
  t: (key: string) => string,
  _connectedServarr: string[] = []
): SidebarConfig {
  const userId = session?.user?.id

  return [
    // ----------------------------------------------------
    // Mobile-Only Bottom Dock (#$Phone)
    // ----------------------------------------------------
    {
      section: "#$Phone",
      dataKey: "mobile-dock",
      items: [
        {
          label: t("home"),
          dataKey: "phone-home",
          href: "/borealis",
          icon: <IconHome className="size-5" />,
          position: 1,
        },
        {
          label: t("browse"),
          dataKey: "phone-browse",
          href: "/borealis/browse",
          icon: <IconSearch className="size-5" />,
          position: 2,
          children: [
            {
              label: t("browse"),
              href: "/borealis/browse",
              icon: <IconSearch className="size-4" />,
            },
            {
              label: t("discover"),
              href: "/borealis/discover",
              icon: <IconSearch className="size-4" />,
            },
          ],
        },
        {
          label: t("calendar"),
          dataKey: "phone-calendar",
          href: "/borealis/calendar",
          icon: <IconCalendar className="size-5" />,
          position: 3,
        },
        {
          label: t("myLists"),
          dataKey: "phone-my-lists",
          href: userId ? `/borealis/lists/${userId}/anime` : "/borealis/browse",
          icon: <IconList className="size-5" />,
          position: 4,
          children: userId
            ? [
                {
                  label: t("anime"),
                  href: `/borealis/lists/${userId}/anime`,
                  icon: <IconTheater className="size-4" />,
                },
                {
                  label: t("manga"),
                  href: `/borealis/lists/${userId}/manga`,
                  icon: <IconBook className="size-4" />,
                },
                {
                  label: t("movie"),
                  href: `/borealis/lists/${userId}/movie`,
                  icon: <IconMovie className="size-4" />,
                },
                {
                  label: t("tv"),
                  href: `/borealis/lists/${userId}/tv`,
                  icon: <IconDeviceTv className="size-4" />,
                },
                {
                  label: t("game"),
                  href: `/borealis/lists/${userId}/game`,
                  icon: <IconDeviceGamepad className="size-4" />,
                },
                {
                  label: t("music"),
                  href: `/borealis/lists/${userId}/music`,
                  icon: <IconMusic className="size-4" />,
                },
                {
                  label: t("book"),
                  href: `/borealis/lists/${userId}/book`,
                  icon: <IconBook2 className="size-4" />,
                },
                {
                  label: t("other"),
                  href: `/borealis/lists/${userId}/other`,
                  icon: <IconList className="size-4" />,
                },
                {
                  label: t("customLists"),
                  href: `/borealis/lists/${userId}/custom-lists`,
                  icon: <IconListDetails className="size-4" />,
                },
              ]
            : undefined,
        },
      ],
    },

    {
      section: "",
      dataKey: "home-section",
      items: [
        {
          label: t("home"),
          dataKey: "home",
          href: "/borealis",
          icon: <IconHome className="size-4" />,
          position: 1,
        },
        {
          label: t("browse"),
          dataKey: "browse",
          href: "/borealis/browse",
          icon: <IconSearch className="size-4" />,
          position: 2,
          children: [
            {
              label: t("discover"),
              href: "/borealis/discover",
              icon: <IconSearch className="size-4" />,
            },
          ],
        },
        {
          label: t("calendar"),
          dataKey: "calendar",
          href: "/borealis/calendar",
          icon: <IconCalendar className="size-4" />,
        },
      ],
    },

    ...(userId
      ? [
          {
            section: t("library"),
            dataKey: "library",
            items: [
              {
                label: t("anime"),
                dataKey: "anime",
                href: `/borealis/lists/${userId}/anime`,
                icon: <IconTheater className="size-4" />,
              },
              {
                label: t("manga"),
                dataKey: "manga",
                href: `/borealis/lists/${userId}/manga`,
                icon: <IconBook className="size-4" />,
              },
              {
                label: t("movie"),
                dataKey: "movie",
                href: `/borealis/lists/${userId}/movie`,
                icon: <IconMovie className="size-4" />,
              },
              {
                label: t("tv"),
                dataKey: "tv",
                href: `/borealis/lists/${userId}/tv`,
                icon: <IconDeviceTv className="size-4" />,
              },
              {
                label: t("game"),
                dataKey: "game",
                href: `/borealis/lists/${userId}/game`,
                icon: <IconDeviceGamepad className="size-4" />,
              },
              {
                label: t("music"),
                dataKey: "music",
                href: `/borealis/lists/${userId}/music`,
                icon: <IconMusic className="size-4" />,
              },
              {
                label: t("book"),
                dataKey: "book",
                href: `/borealis/lists/${userId}/book`,
                icon: <IconBook2 className="size-4" />,
              },
              {
                label: t("other"),
                dataKey: "other",
                href: `/borealis/lists/${userId}/other`,
                icon: <IconList className="size-4" />,
              },
              {
                label: t("customLists"),
                dataKey: "custom-lists",
                href: `/borealis/lists/${userId}/custom-lists`,
                icon: <IconListDetails className="size-4" />,
              },
            ],
          },
        ]
      : []),
  ]
}

export function useBorealisSidebarConfig(
  session: Session | null,
  _initialConnectedServarr?: string[]
): SidebarConfig {
  const t = useTranslations("navigation.listSidebar")

  return useMemo(
    () => getBorealisSidebarConfig(session, t),
    [session, t]
  )
}

// Aliases for backwards compatibility
export const getListSidebarConfig = getBorealisSidebarConfig
export const useListSidebarConfig = useBorealisSidebarConfig

