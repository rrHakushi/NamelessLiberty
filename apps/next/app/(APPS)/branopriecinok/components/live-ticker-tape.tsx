"use client"

import React from "react"
import type { TickEvent } from "./types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  IconActivity,
  IconArrowUpRight,
  IconArrowDownRight,
  IconFlame,
  IconClock,
} from "@tabler/icons-react"
import { formatCurrency } from "./market-data-service"
import { cn } from "@workspace/ui/lib/utils"

interface LiveTickerTapeProps {
  ticks: TickEvent[]
  isLive: boolean
  isMarketOpen?: boolean
  isSimulating?: boolean
  tickCount: number
}

export function LiveTickerTape({
  ticks,
  isLive,
  isMarketOpen = false,
  isSimulating = false,
  tickCount,
}: LiveTickerTapeProps) {
  const buyCount = ticks.filter((t) => t.type === "buy").length
  const buyRatio = ticks.length > 0 ? Math.round((buyCount / ticks.length) * 100) : 50

  return (
    <Card className="border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <IconFlame className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Tok obchodov (Xetra Tick Stream)
                {isMarketOpen && isLive && (
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                    LIVE TRH
                  </Badge>
                )}
                {!isMarketOpen && isSimulating && (
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 bg-amber-500/10">
                    SIMULÁCIA
                  </Badge>
                )}
                {!isMarketOpen && !isSimulating && (
                  <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-800 bg-zinc-900">
                    BURZA ZATVORENÁ
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                {!isMarketOpen && !isSimulating
                  ? "Zobrazujú sa posledné obchody z piatkovej seansy na XETRA (17:30 SEČ)"
                  : "Mikro-pohyby a zmeny cien nemeckých iShares ETF v EUR"}
              </CardDescription>
            </div>
          </div>

          {/* Quick stats on stream */}
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Tiky:</span>
              <span className="text-zinc-200 font-bold">{tickCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{buyRatio}% Nákup</span>
              <span className="text-zinc-600">/</span>
              <span className="text-rose-400 font-semibold">{100 - buyRatio}% Predaj</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {ticks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400 text-xs">
            <IconClock className="size-8 text-zinc-700 mb-2 animate-pulse" />
            <span>Čaká sa na prvé trhové tiky z Xetry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] uppercase text-start">
                  <th className="pb-2 font-medium ps-2 text-start">Čas</th>
                  <th className="pb-2 font-medium text-start">ETF Titul</th>
                  <th className="pb-2 font-medium text-end">Kurz (EUR)</th>
                  <th className="pb-2 font-medium text-end">Posun (€)</th>
                  <th className="pb-2 font-medium text-end">Zmena (%)</th>
                  <th className="pb-2 font-medium text-end pe-2">Veľkosť (ks)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {ticks.slice(0, 10).map((tick, index) => {
                  const isUp = tick.delta >= 0
                  return (
                    <tr
                      key={tick.id}
                      className={cn(
                        "transition-colors duration-200 hover:bg-zinc-900/50",
                        index === 0 && (isUp ? "bg-emerald-950/20" : "bg-rose-950/20")
                      )}
                    >
                      <td className="py-2 ps-2 text-zinc-400 text-start">{tick.timestamp}</td>
                      <td className="py-2 text-start">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono px-1.5 py-0",
                            tick.symbol === "SXR8"
                              ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                              : "text-purple-400 border-purple-500/30 bg-purple-500/10"
                          )}
                        >
                          {tick.symbol === "SXR8" ? "SXR8 (S&P 500)" : "SXRV (Nasdaq 100)"}
                        </Badge>
                      </td>
                      <td className="py-2 text-end font-semibold text-zinc-200">
                        {formatCurrency(tick.price)}
                      </td>
                      <td
                        className={cn(
                          "py-2 text-end font-medium",
                          isUp ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        <span className="inline-flex items-center justify-end">
                          {isUp ? (
                            <IconArrowUpRight className="size-3 me-0.5 inline-block" />
                          ) : (
                            <IconArrowDownRight className="size-3 me-0.5 inline-block" />
                          )}
                          {isUp ? "+" : ""}
                          {formatCurrency(tick.delta)}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "py-2 text-end font-semibold",
                          isUp ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {isUp ? "+" : ""}
                        {tick.changePercent.toFixed(3)}%
                      </td>
                      <td className="py-2 text-end pe-2 text-zinc-400">
                        {tick.size.toLocaleString("sk-SK")} ks
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
