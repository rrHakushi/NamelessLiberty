"use client"

import React, { useMemo } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts"
import type { DataPoint, ChartStyle, ViewTab, TimeFrame, MarketIndex } from "./types"
import { formatCurrency, formatLargeNumber } from "./market-data-service"
import { Badge } from "@workspace/ui/components/badge"

interface StockChartProps {
  data: DataPoint[]
  viewMode: ViewTab
  chartStyle: ChartStyle
  showSma20: boolean
  showSma50: boolean
  showVolume: boolean
  timeFrame: TimeFrame
  singleIndex?: MarketIndex
}

export function StockChart({
  data,
  viewMode,
  chartStyle,
  showSma20,
  showSma50,
  showVolume,
  timeFrame,
  singleIndex,
}: StockChartProps) {
  const isComparison = viewMode === "comparison"
  const activeSymbol: MarketIndex =
    singleIndex ?? (viewMode === "sxrv" ? "SXRV" : "SXR8")

  const { minVal, maxVal } = useMemo(() => {
    if (!data.length) return { minVal: 0, maxVal: 100 }

    if (isComparison) {
      const pcts = data.flatMap((d) => [d.sxr8Pct, d.sxrvPct])
      const min = Math.min(...pcts)
      const max = Math.max(...pcts)
      const pad = Math.max(0.2, (max - min) * 0.15)
      return {
        minVal: Number((min - pad).toFixed(2)),
        maxVal: Number((max + pad).toFixed(2)),
      }
    }

    const key = activeSymbol === "SXR8" ? "sxr8" : "sxrv"
    const values = data.map((d) => d[key])
    const min = Math.min(...values)
    const max = Math.max(...values)
    const pad = Math.max(1, (max - min) * 0.12)

    return {
      minVal: Number((min - pad).toFixed(2)),
      maxVal: Number((max + pad).toFixed(2)),
    }
  }, [data, isComparison, activeSymbol])

  // Custom rich tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const point = payload[0]?.payload as DataPoint
    if (!point) return null

    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md text-xs font-mono space-y-2 min-w-52 z-50">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 text-zinc-400">
          <span className="font-sans font-medium text-zinc-300">{point.time}</span>
          <Badge variant="outline" className="text-[10px] border-zinc-800 font-mono">
            XETRA • {timeFrame}
          </Badge>
        </div>

        {isComparison ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="size-2 rounded-full bg-blue-500 inline-block" />
                SXR8 (S&P 500):
              </span>
              <span className="font-semibold text-zinc-100">
                {point.sxr8Pct >= 0 ? "+" : ""}
                {point.sxr8Pct.toFixed(2)}% ({formatCurrency(point.sxr8)})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="size-2 rounded-full bg-purple-500 inline-block" />
                SXRV (Nasdaq 100):
              </span>
              <span className="font-semibold text-zinc-100">
                {point.sxrvPct >= 0 ? "+" : ""}
                {point.sxrvPct.toFixed(2)}% ({formatCurrency(point.sxrv)})
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Kurz ETF (EUR):</span>
              <span className="font-bold text-zinc-100 text-sm">
                {formatCurrency(activeSymbol === "SXR8" ? point.sxr8 : point.sxrv)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Zmena od počiatku:</span>
              <span
                className={
                  (activeSymbol === "SXR8" ? point.sxr8Pct : point.sxrvPct) >= 0
                    ? "text-emerald-400 font-semibold"
                    : "text-rose-400 font-semibold"
                }
              >
                {(activeSymbol === "SXR8" ? point.sxr8Pct : point.sxrvPct) >= 0 ? "+" : ""}
                {(activeSymbol === "SXR8" ? point.sxr8Pct : point.sxrvPct).toFixed(2)}%
              </span>
            </div>

            {showSma20 && (
              <div className="flex items-center justify-between text-amber-400">
                <span>SMA 20:</span>
                <span>
                  {formatCurrency(
                    (activeSymbol === "SXR8" ? point.sxr8Sma20 : point.sxrvSma20) ?? 0
                  )}
                </span>
              </div>
            )}

            {showSma50 && (
              <div className="flex items-center justify-between text-indigo-400">
                <span>SMA 50:</span>
                <span>
                  {formatCurrency(
                    (activeSymbol === "SXR8" ? point.sxr8Sma50 : point.sxrvSma50) ?? 0
                  )}
                </span>
              </div>
            )}

            {showVolume && (
              <div className="flex items-center justify-between text-zinc-400 border-t border-zinc-900 pt-1">
                <span>Objem:</span>
                <span>{formatLargeNumber(point.volume)} ks</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const primaryColor = activeSymbol === "SXR8" ? "#3b82f6" : "#a855f7"
  const gradientId = `gradient-${activeSymbol}-${isComparison ? "comp" : "single"}`

  return (
    <div className="w-full h-80 sm:h-96 md:h-[420px] select-none">
      <ResponsiveContainer width="100%" height="100%">
        {chartStyle === "area" && !isComparison ? (
          <AreaChart data={data} margin={{ top: 12, right: 12, left: -5, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
              opacity={0.5}
            />

            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              dy={8}
            />

            <YAxis
              domain={[minVal, maxVal]}
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              tickFormatter={(val) => `${val.toFixed(1)} €`}
              width={65}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey={activeSymbol === "SXR8" ? "sxr8" : "sxrv"}
              stroke={primaryColor}
              strokeWidth={2.2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />

            {showSma20 && (
              <Line
                type="monotone"
                dataKey={activeSymbol === "SXR8" ? "sxr8Sma20" : "sxrvSma20"}
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                isAnimationActive={false}
              />
            )}

            {showSma50 && (
              <Line
                type="monotone"
                dataKey={activeSymbol === "SXR8" ? "sxr8Sma50" : "sxrvSma50"}
                stroke="#818cf8"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="6 3"
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 12, right: 12, left: -5, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
              opacity={0.5}
            />

            <XAxis
              dataKey="time"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              dy={8}
            />

            <YAxis
              domain={[minVal, maxVal]}
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#27272a" }}
              tickFormatter={(val) =>
                isComparison ? `${val >= 0 ? "+" : ""}${val.toFixed(1)}%` : `${val.toFixed(1)} €`
              }
              width={65}
            />

            <Tooltip content={<CustomTooltip />} />

            {isComparison ? (
              <>
                <ReferenceLine y={0} stroke="#52525b" strokeDasharray="3 3" />
                <Line
                  name="SXR8 (S&P 500) %"
                  type="monotone"
                  dataKey="sxr8Pct"
                  stroke="#3b82f6"
                  strokeWidth={2.4}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  name="SXRV (Nasdaq 100) %"
                  type="monotone"
                  dataKey="sxrvPct"
                  stroke="#a855f7"
                  strokeWidth={2.4}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <>
                <Line
                  name={activeSymbol}
                  type="monotone"
                  dataKey={activeSymbol === "SXR8" ? "sxr8" : "sxrv"}
                  stroke={primaryColor}
                  strokeWidth={2.2}
                  dot={false}
                  isAnimationActive={false}
                />
                {showSma20 && (
                  <Line
                    type="monotone"
                    dataKey={activeSymbol === "SXR8" ? "sxr8Sma20" : "sxrvSma20"}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 4"
                    isAnimationActive={false}
                  />
                )}
                {showSma50 && (
                  <Line
                    type="monotone"
                    dataKey={activeSymbol === "SXR8" ? "sxr8Sma50" : "sxrvSma50"}
                    stroke="#818cf8"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="6 3"
                    isAnimationActive={false}
                  />
                )}
              </>
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
