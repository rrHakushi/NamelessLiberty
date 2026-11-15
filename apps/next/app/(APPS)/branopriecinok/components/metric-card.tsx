"use client"

import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconBuildingBank,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import type { IndexQuote } from "./types"
import { formatCurrency, formatLargeNumber } from "./market-data-service"

interface MetricCardProps {
  quote: IndexQuote
  isLive: boolean
  isMarketOpen?: boolean
  isSimulating?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function MetricCard({
  quote,
  isLive,
  isMarketOpen = false,
  isSimulating = false,
  isSelected = false,
  onClick,
}: MetricCardProps) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null)

  // Trigger brief flash animation on price change
  useEffect(() => {
    if (!quote.lastTickTime) return
    const direction =
      quote.direction === "up" ? "up" : quote.direction === "down" ? "down" : null
    if (direction) {
      setFlash(direction)
      const timer = setTimeout(() => setFlash(null), 900)
      return () => clearTimeout(timer)
    }
  }, [quote.price, quote.direction, quote.lastTickTime])

  const isPositive = quote.change >= 0
  const rangeSpan = quote.dayHigh - quote.dayLow
  const currentRangePosition =
    rangeSpan > 0
      ? Math.min(100, Math.max(0, ((quote.price - quote.dayLow) / rangeSpan) * 100))
      : 50

  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative transition-all duration-300 border-zinc-800 bg-zinc-950/80 backdrop-blur-md cursor-pointer hover:border-zinc-700",
        isSelected && "ring-2 ring-zinc-400 dark:ring-zinc-600 border-zinc-600",
        flash === "up" && "ring-1 ring-emerald-500/50 bg-emerald-950/20",
        flash === "down" && "ring-1 ring-rose-500/50 bg-rose-950/20"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-xl flex items-center justify-center transition-colors",
                quote.symbol === "SXR8"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-purple-500/10 text-purple-400"
              )}
            >
              <IconBuildingBank className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                {quote.name}
                <span className="text-xs font-mono font-normal text-zinc-400">
                  {quote.ticker}
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 flex items-center gap-2">
                <span>ISIN: {quote.isin}</span>
                <span>•</span>
                <span>TER: {quote.ter}</span>
                <span>•</span>
                <span className="text-zinc-300">{quote.exchange}</span>
              </CardDescription>
            </div>
          </div>

          <CardAction>
            <div className="flex items-center gap-1.5">
              {isMarketOpen && isLive && (
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                </span>
              )}
              {!isMarketOpen && isSimulating && (
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-amber-500"></span>
                </span>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-mono border-zinc-800 px-2 py-0.5",
                  isMarketOpen && isLive
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    : isSimulating
                      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      : "text-zinc-400 bg-zinc-900 border-zinc-800"
                )}
              >
                {isMarketOpen
                  ? (isLive ? "LIVE XETRA" : "POZASTAVENÉ")
                  : isSimulating
                    ? "TEST SIMULÁCIA"
                    : "ZATVORENÉ (ZÁVER)"}
              </Badge>
            </div>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Main Price & Change */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Kurz na nemeckej burze (EUR)
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-bold font-mono tracking-tight transition-colors duration-200",
                  flash === "up" && "text-emerald-400",
                  flash === "down" && "text-rose-400",
                  !flash && "text-zinc-100"
                )}
              >
                {formatCurrency(quote.price)}
              </span>
              <div
                className={cn(
                  "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg font-mono transition-colors",
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                )}
              >
                {isPositive ? (
                  <IconTrendingUp className="size-3.5 me-1 inline-block" />
                ) : (
                  <IconTrendingDown className="size-3.5 me-1 inline-block" />
                )}
                <span>
                  {isPositive ? "+" : ""}
                  {formatCurrency(quote.change)} ({isPositive ? "+" : ""}
                  {quote.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="text-end text-xs text-zinc-400 font-mono flex items-center gap-1">
            <IconClock className="size-3.5 text-zinc-400" />
            <span>{quote.lastTickTime} SEČ</span>
          </div>
        </div>

        {/* Day Range Progress */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400">
            <span>Min: {formatCurrency(quote.dayLow)}</span>
            <span className="text-zinc-400 font-sans">Denné rozpätie (Xetra)</span>
            <span>Max: {formatCurrency(quote.dayHigh)}</span>
          </div>

          <div className="relative h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isPositive ? "bg-emerald-500/50" : "bg-rose-500/50"
              )}
              style={{ width: `${currentRangePosition}%` }}
            />
            {/* Current Price Marker Indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-sm transition-all duration-300"
              style={{ insetInlineStart: `${currentRangePosition}%` }}
            />
          </div>
        </div>

        {/* Key Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-900 text-xs">
          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-400 text-[10px] uppercase">Otvorenie</div>
            <div className="font-mono font-medium text-zinc-200 mt-0.5">
              {formatCurrency(quote.open)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-400 text-[10px] uppercase">Predch. záver</div>
            <div className="font-mono font-medium text-zinc-200 mt-0.5">
              {formatCurrency(quote.previousClose)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-400 text-[10px] uppercase">52T Rozpätie</div>
            <div className="font-mono font-medium text-zinc-200 mt-0.5 truncate">
              {formatCurrency(quote.yearLow)} - {formatCurrency(quote.yearHigh)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="text-zinc-400 text-[10px] uppercase">Objem (ks)</div>
            <div className="font-mono font-medium text-zinc-200 mt-0.5">
              {formatLargeNumber(quote.volume)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
