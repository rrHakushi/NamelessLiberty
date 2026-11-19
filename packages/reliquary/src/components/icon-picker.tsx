"use client"

import React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { DynamicIcon } from "@/components/iris-page/registry"
import { RELIQUARY_ICON_OPTIONS } from "./reliquary-types"

export interface ReliquaryIconPickerProps {
  value: string
  onChange: (icon: string) => void
  className?: string
}

export function ReliquaryIconPicker({
  value,
  onChange,
  className,
}: ReliquaryIconPickerProps) {
  return (
    <div className={cn("grid grid-cols-6 gap-1.5", className)}>
      {RELIQUARY_ICON_OPTIONS.map((iconName) => {
        const selected = value === iconName
        return (
          <button
            key={iconName}
            type="button"
            title={iconName}
            onClick={() => onChange(iconName)}
            className={cn(
              "flex h-9 cursor-pointer items-center justify-center rounded-xl border transition-colors",
              selected
                ? "border-primary bg-primary/15 text-primary"
                : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <DynamicIcon name={iconName} size={17} />
          </button>
        )
      })}
    </div>
  )
}
