"use client"

import React, { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  IconHierarchy2,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react"
import type { ReliquarySidebarNode } from "@NamelessLiberty/shared"
import { useSession } from "@/context/session-context"
import { useReliquarySidebarConfig } from "@/config/sidebars"
import { IrisSidebar } from "@/components/navigation/iris-sidebar"
import { useIrisSidebar } from "@/components/navigation/sidebar-provider"
import { SidebarInset, useSidebar } from "@workspace/ui/components/sidebar"
import { filterSidebarConfig } from "@/lib/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { DynamicIcon } from "@/components/iris-page/registry"
import { useReliquaryContext } from "@/app/(APPS)/reliquary/components/reliquary-context"
import type {
  SidebarConfig,
  SidebarItem,
  SidebarItemChild,
} from "@/types/sidebar-config"

function mapTreeToChildren(
  nodes: ReliquarySidebarNode[],
  docId: string,
  pathname: string,
  depth = 2
): SidebarItemChild[] {
  return nodes.map((node) => {
    const href = node.pageId ? `/reliquary/${docId}/${node.pageId}` : undefined
    const nested =
      depth < 5 && node.children && node.children.length > 0
        ? mapTreeToChildren(node.children, docId, pathname, depth + 1)
        : undefined
    return {
      label: node.label,
      dataKey: `reliquary-node:${node.id}`,
      href,
      isActive: href ? pathname === href : false,
      icon: (
        <DynamicIcon
          name={node.icon || (node.pageId ? "IconFileText" : "IconFolder")}
          size={15}
        />
      ),
      ...(nested ? { children: nested } : {}),
    }
  })
}

export function IrisReliquaryNavProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const baseConfig = useReliquarySidebarConfig(session)
  const pathname = usePathname() || ""
  const t = useTranslations("reliquary")
  const {
    activeDoc,
    openAddPage,
    openStructure,
    openSettings,
  } = useReliquaryContext()

  const combinedConfig: SidebarConfig = useMemo(() => {
    if (!activeDoc || !pathname.startsWith(`/reliquary/${activeDoc.id}`)) {
      return baseConfig
    }

    const overviewHref = `/reliquary/${activeDoc.id}`
    const treeItems: SidebarItem[] = [
      {
        label: t("overview"),
        dataKey: `reliquary-overview:${activeDoc.id}`,
        href: overviewHref,
        isActive: pathname === overviewHref,
        icon: (
          <DynamicIcon name={activeDoc.icon || "IconBook"} size={16} />
        ),
      },
      ...mapTreeToChildren(activeDoc.sidebarConfig, activeDoc.id, pathname, 1).map(
        (node): SidebarItem => ({
          label: node.label,
          dataKey: node.dataKey,
          href: node.href,
          isActive: node.isActive,
          icon: node.icon,
          children: node.children,
        })
      ),
    ]

    const sectionActions = (
      <>
        {activeDoc.canEdit && (
          <>
            <button
              type="button"
              title={t("addPage")}
              aria-label={t("addPage")}
              onClick={openAddPage}
              className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconPlus className="size-3.5" />
            </button>
            <button
              type="button"
              title={t("bookStructure")}
              aria-label={t("bookStructure")}
              onClick={openStructure}
              className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconHierarchy2 className="size-3.5" />
            </button>
          </>
        )}
        {activeDoc.canManage && (
          <button
            type="button"
            title={t("docSettings")}
            aria-label={t("docSettings")}
            onClick={openSettings}
            className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconSettings className="size-3.5" />
          </button>
        )}
      </>
    )

    const mobileSection = baseConfig.find((s) => s.section === "#$Phone")
    const mainSections = baseConfig.filter((s) => s.section !== "#$Phone")

    return [
      ...mainSections,
      {
        section: activeDoc.title,
        dataKey: `reliquary-doc:${activeDoc.id}`,
        sectionActions,
        items: treeItems,
      },
      ...(mobileSection ? [mobileSection] : []),
    ]
  }, [
    activeDoc,
    baseConfig,
    openAddPage,
    openSettings,
    openStructure,
    pathname,
    t,
  ])

  const { position } = useIrisSidebar()
  const { state } = useSidebar()

  const isHorizontal = position === "top" || position === "bottom"
  const isRight = position === "right"
  const isTop = position === "top"
  const isBottom = position === "bottom"

  const sidebarConfig = useMemo(() => {
    const userPermissions = (session?.user as any)?.permissions
    return filterSidebarConfig(combinedConfig, userPermissions)
  }, [combinedConfig, session?.user])

  return (
    <div
      className={cn(
        "flex size-full overflow-hidden bg-sidebar",
        isHorizontal ? "flex-col" : "flex-row"
      )}
    >
      {position === "left" && <IrisSidebar initialConfig={sidebarConfig} />}
      <SidebarInset
        className={cn(
          "no-scrollbar flex flex-1 min-h-0 min-w-0 flex-col overflow-y-auto bg-background pt-0 md:border md:border-border",
          isRight &&
            (state === "collapsed"
              ? "md:m-2 md:rounded-2xl md:shadow-sm"
              : "md:m-2 md:me-0 md:rounded-2xl md:shadow-sm"),
          isTop &&
            "md:m-2 md:w-[calc(100%-1rem)] md:rounded-2xl md:shadow-sm",
          isBottom &&
            "md:m-2 md:w-[calc(100%-1rem)] md:rounded-2xl md:shadow-sm"
        )}
      >
        {position === "top" && <IrisSidebar initialConfig={sidebarConfig} />}
        {children}
        {position === "bottom" && (
          <IrisSidebar initialConfig={sidebarConfig} />
        )}
      </SidebarInset>
      {position === "right" && <IrisSidebar initialConfig={sidebarConfig} />}
    </div>
  )
}
