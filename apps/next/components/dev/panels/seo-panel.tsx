"use client"

import React, { useState } from "react"
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { PlatformPreviews } from "../platform-previews"
import { MetadataDiagnostics } from "../metadata-diagnostics"
import type {
  DiagnosticItem,
  PageMetadataInfo,
  SocialPlatformId,
} from "../types"

interface SeoPanelProps {
  metadata: PageMetadataInfo
  diagnostics: DiagnosticItem[]
  warnCount: number
  refresh: () => void
}

export function SeoPanel({
  metadata,
  diagnostics,
  warnCount,
  refresh,
}: SeoPanelProps) {
  const [subTab, setSubTab] = useState<"previews" | "diagnostics">("previews")
  const [selectedPlatform, setSelectedPlatform] =
    useState<SocialPlatformId>("discord")

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSubTab("previews")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
              subTab === "previews"
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconEye className="size-3.5" />
            <span>Social Previews</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("diagnostics")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
              subTab === "diagnostics"
                ? "bg-muted font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {warnCount > 0 ? (
              <IconAlertTriangle className="size-3.5 text-amber-400" />
            ) : (
              <IconCircleCheck className="size-3.5 text-emerald-400" />
            )}
            <span>Diagnostics</span>
            {warnCount > 0 && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                {warnCount}
              </span>
            )}
          </button>
        </div>

        <Button
          variant="ghost"
          size="xs"
          onClick={refresh}
          className="h-7 gap-1 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
          aria-label="Re-inspect document.head"
        >
          <IconRefresh className="size-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {subTab === "previews" ? (
          <PlatformPreviews
            metadata={metadata}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={setSelectedPlatform}
          />
        ) : (
          <MetadataDiagnostics
            metadata={metadata}
            diagnostics={diagnostics}
          />
        )}
      </div>
    </div>
  )
}
