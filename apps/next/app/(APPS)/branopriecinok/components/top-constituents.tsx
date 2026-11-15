"use client"

import React from "react"
import type { StockMover } from "./types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  IconBuildingBank,
  IconArrowUpRight,
  IconArrowDownRight,
} from "@tabler/icons-react"
import { formatCurrency } from "./market-data-service"
import { cn } from "@workspace/ui/lib/utils"

interface TopConstituentsProps {
  stocks: StockMover[]
  filter?: "all" | "sxr8" | "sxrv"
}

export function TopConstituents({ stocks, filter = "all" }: TopConstituentsProps) {
  const filteredStocks = stocks.filter((s) => {
    if (filter === "all") return true
    if (filter === "sxr8") return s.index === "sxr8" || s.index === "both"
    if (filter === "sxrv") return s.index === "sxrv" || s.index === "both"
    return true
  })

  return (
    <Card className="border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <IconBuildingBank className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-zinc-100">
                Kľúčové podkladové aktíva (Top Holdings)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Najväčšie akciové tituly tvoriace váhu v iShares SXR8 a SXRV ETF
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-400">
            {filteredStocks.length} titulov
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {filteredStocks.map((stock) => {
            const isPositive = stock.change >= 0
            return (
              <div
                key={stock.symbol}
                className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-zinc-100">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {stock.weight}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate max-w-28 font-sans">
                      {stock.name}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono px-1 py-0 border-zinc-800",
                      stock.index === "both"
                        ? "text-indigo-400 bg-indigo-500/10"
                        : stock.index === "sxrv"
                          ? "text-purple-400 bg-purple-500/10"
                          : "text-blue-400 bg-blue-500/10"
                    )}
                  >
                    {stock.index === "both" ? "SXR8/SXRV" : stock.index === "sxrv" ? "SXRV" : "SXR8"}
                  </Badge>
                </div>

                <div className="pt-1 border-t border-zinc-800/60 flex items-baseline justify-between font-mono">
                  <span className="text-xs font-semibold text-zinc-200">
                    {formatCurrency(stock.price)}
                  </span>
                  <div
                    className={cn(
                      "flex items-center text-[11px] font-medium",
                      isPositive ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {isPositive ? (
                      <IconArrowUpRight className="size-3 me-0.5 inline-block" />
                    ) : (
                      <IconArrowDownRight className="size-3 me-0.5 inline-block" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
