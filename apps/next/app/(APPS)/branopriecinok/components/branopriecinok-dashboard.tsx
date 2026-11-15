"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardHeader,
  CardContent,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconBolt,
  IconTrendingDown,
  IconChartArea,
  IconChartLine,
  IconGauge,
  IconActivity,
  IconClock,
  IconServer,
  IconLock,
  IconAlertCircle,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import type {
  ChartStyle,
  DataPoint,
  IndexQuote,
  MarketIndex,
  StockMover,
  TickEvent,
  TimeFrame,
  ViewTab,
  MarketApiResponse,
  MarketStatusInfo,
} from "./types"
import {
  INITIAL_SXR8_QUOTE,
  INITIAL_SXRV_QUOTE,
  INITIAL_CONSTITUENTS,
  generateSeriesForTimeFrame,
  createLiveTick,
  tickConstituents,
  formatCurrency,
  getXetraMarketStatus,
} from "./market-data-service"
import { MetricCard } from "./metric-card"
import { StockChart } from "./stock-chart"
import { LiveTickerTape } from "./live-ticker-tape"
import { TopConstituents } from "./top-constituents"

export function BranopriecinokDashboard() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D")
  const [viewTab, setViewTab] = useState<ViewTab>("overview")
  const [chartStyle, setChartStyle] = useState<ChartStyle>("area")
  const [tickSpeed, setTickSpeed] = useState<number>(2000)
  const [showSma20, setShowSma20] = useState<boolean>(true)
  const [showSma50, setShowSma50] = useState<boolean>(false)
  const [showVolume, setShowVolume] = useState<boolean>(true)

  // Market status detection (XETRA)
  const [marketStatus, setMarketStatus] = useState<MarketStatusInfo>(() =>
    getXetraMarketStatus()
  )

  // Simulation mode: disabled by default outside trading hours
  const [simulationEnabled, setSimulationEnabled] = useState<boolean>(false)
  // Live ticker active only if market is currently open OR simulation was explicitly turned on
  const [isLive, setIsLive] = useState<boolean>(() => getXetraMarketStatus().isOpen)

  // Quotes state (iShares XETRA in EUR)
  const [sxr8Quote, setSxr8Quote] = useState<IndexQuote>(INITIAL_SXR8_QUOTE)
  const [sxrvQuote, setSxrvQuote] = useState<IndexQuote>(INITIAL_SXRV_QUOTE)
  const [constituents, setConstituents] = useState<StockMover[]>(INITIAL_CONSTITUENTS)

  // Chart data state
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [ticks, setTicks] = useState<TickEvent[]>([])
  const [tickCount, setTickCount] = useState<number>(0)
  const [mounted, setMounted] = useState<boolean>(false)
  const [apiConnected, setApiConnected] = useState<boolean>(false)
  const [apiSource, setApiSource] = useState<"live" | "simulated">("simulated")

  // Fetch initial market data from local Next.js API route
  const fetchFromLocalApi = useCallback(async (tf: TimeFrame) => {
    try {
      const res = await fetch(`/branopriecinok/api/market?timeframe=${tf}`)
      if (res.ok) {
        const json: MarketApiResponse = await res.json()
        if (json.success) {
          setSxr8Quote(json.sxr8)
          setSxrvQuote(json.sxrv)
          setChartData(json.series)
          if (json.marketStatus) {
            setMarketStatus(json.marketStatus)
          }
          if (json.recentTicks?.length) {
            setTicks(json.recentTicks)
          }
          if (json.constituents?.length) {
            setConstituents(json.constituents)
          }
          setApiSource(json.source)
          setApiConnected(true)
          return
        }
      }
    } catch {
      // Local fallback
    }

    const fallbackSeries = generateSeriesForTimeFrame(tf)
    setChartData(fallbackSeries)
  }, [])

  // Initial load
  useEffect(() => {
    setMounted(true)
    const status = getXetraMarketStatus()
    setMarketStatus(status)
    // If market is closed (weekend/evening), keep live streaming off by default
    setIsLive(status.isOpen)

    fetchFromLocalApi("1D")

    const now = new Date()
    const tStr = now.toTimeString().split(" ")[0] ?? "17:30:00"
    setTicks([
      {
        id: "init-1",
        timestamp: tStr,
        symbol: "SXR8",
        price: INITIAL_SXR8_QUOTE.price,
        delta: 0.45,
        changePercent: 0.078,
        size: 35,
        type: "buy",
      },
      {
        id: "init-2",
        timestamp: tStr,
        symbol: "SXRV",
        price: INITIAL_SXRV_QUOTE.price,
        delta: 0.32,
        changePercent: 0.15,
        size: 80,
        type: "buy",
      },
    ])
  }, [fetchFromLocalApi])

  // Timeframe change handler
  const handleTimeFrameChange = (newTf: TimeFrame) => {
    setTimeFrame(newTf)
    fetchFromLocalApi(newTf)
  }

  // Live tick execution via Next.js API route (or local fallback)
  const executeTick = useCallback(async () => {
    const symbolToTick: MarketIndex = Math.random() > 0.45 ? "SXR8" : "SXRV"

    try {
      const res = await fetch("/branopriecinok/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: symbolToTick }),
      })

      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setSxr8Quote(json.sxr8)
          setSxrvQuote(json.sxrv)
          setConstituents(json.constituents)

          if (json.tick) {
            setTicks((prev) => [json.tick, ...prev.slice(0, 24)])
            setTickCount((c) => c + 1)
          }

          setChartData((prev) => {
            if (!prev.length) return prev
            const lastIndex = prev.length - 1
            const updated = [...prev]
            const currentPoint = updated[lastIndex]
            const basePoint = updated[0]
            if (!currentPoint || !basePoint) return prev

            const updatedPoint: DataPoint = {
              ...currentPoint,
              sxr8: json.sxr8.price,
              sxrv: json.sxrv.price,
              sxr8Pct: Number(
                (((json.sxr8.price - basePoint.sxr8) / basePoint.sxr8) * 100).toFixed(2)
              ),
              sxrvPct: Number(
                (((json.sxrv.price - basePoint.sxrv) / basePoint.sxrv) * 100).toFixed(2)
              ),
              volume: currentPoint.volume + (json.tick?.size ?? 25),
            }

            updated[lastIndex] = updatedPoint
            return updated
          })
          return
        }
      }
    } catch {
      // Local engine fallback
    }

    // Client fallback simulation
    let newSxr8 = sxr8Quote
    let newSxrv = sxrvQuote
    let latestTick: TickEvent | null = null

    if (symbolToTick === "SXR8" || Math.random() > 0.6) {
      const sxr8Result = createLiveTick(sxr8Quote, "SXR8")
      newSxr8 = sxr8Result.quote
      latestTick = sxr8Result.tick
      setSxr8Quote(newSxr8)
    }

    if (symbolToTick === "SXRV" || Math.random() > 0.6) {
      const sxrvResult = createLiveTick(sxrvQuote, "SXRV")
      newSxrv = sxrvResult.quote
      if (!latestTick) latestTick = sxrvResult.tick
      setSxrvQuote(newSxrv)
    }

    if (latestTick) {
      setTicks((prev) => [latestTick!, ...prev.slice(0, 24)])
      setTickCount((c) => c + 1)
    }

    setConstituents((prev) => tickConstituents(prev))

    setChartData((prev) => {
      if (!prev.length) return prev
      const lastIndex = prev.length - 1
      const updated = [...prev]
      const currentPoint = updated[lastIndex]
      const basePoint = updated[0]
      if (!currentPoint || !basePoint) return prev

      const updatedPoint: DataPoint = {
        ...currentPoint,
        sxr8: newSxr8.price,
        sxrv: newSxrv.price,
        sxr8Pct: Number(
          (((newSxr8.price - basePoint.sxr8) / basePoint.sxr8) * 100).toFixed(2)
        ),
        sxrvPct: Number(
          (((newSxrv.price - basePoint.sxrv) / basePoint.sxrv) * 100).toFixed(2)
        ),
        volume: currentPoint.volume + (latestTick?.size ?? 25),
      }

      updated[lastIndex] = updatedPoint
      return updated
    })
  }, [sxr8Quote, sxrvQuote])

  // Live timer: ONLY runs if market is actually open, OR if user explicitly enabled demo simulation
  const shouldTick = mounted && isLive && (marketStatus.isOpen || simulationEnabled)

  useEffect(() => {
    if (!shouldTick) return

    const interval = setInterval(() => {
      executeTick()
    }, tickSpeed)

    return () => clearInterval(interval)
  }, [shouldTick, tickSpeed, executeTick])

  // Toggle demo simulation mode when market is closed
  const handleToggleSimulation = () => {
    const nextState = !simulationEnabled
    setSimulationEnabled(nextState)
    setIsLive(nextState)
  }

  // Reset function
  const handleReset = () => {
    setSxr8Quote(INITIAL_SXR8_QUOTE)
    setSxrvQuote(INITIAL_SXRV_QUOTE)
    setConstituents(INITIAL_CONSTITUENTS)
    const freshSeries = generateSeriesForTimeFrame(timeFrame)
    setChartData(freshSeries)
    setTickCount(0)
  }

  if (!mounted) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
          <IconActivity className="size-5 animate-spin" />
          <span>Načítavam stav burzy XETRA...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Live Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
              iShares S&P 500 & Nasdaq 100 (XETRA)
            </h1>

            {/* Dynamic Market Status Badge */}
            {marketStatus.isOpen ? (
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs px-2.5 py-0.5 transition-colors",
                  isLive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                )}
              >
                <span className="relative flex size-2 me-1.5 inline-block">
                  {isLive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex rounded-full size-2",
                      isLive ? "bg-emerald-500" : "bg-zinc-500"
                    )}
                  />
                </span>
                {isLive ? "BURZA OTVORENÁ (ŽIVÝ TOK)" : "POZASTAVENÉ"}
              </Badge>
            ) : simulationEnabled ? (
              <Badge
                variant="outline"
                className="font-mono text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/30"
              >
                <span className="relative flex size-2 me-1.5 inline-block">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
                </span>
                TESTOVACIA SIMULÁCIA (OFF-MARKET)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="font-mono text-xs px-2.5 py-0.5 bg-zinc-900 text-zinc-300 border-zinc-700 flex items-center gap-1"
              >
                <IconLock className="size-3 text-zinc-400" />
                BURZA ZATVORENÁ ({marketStatus.reason.toUpperCase()})
              </Badge>
            )}

            <Badge
              variant="outline"
              className="hidden sm:flex font-mono text-[11px] text-zinc-400 border-zinc-800 items-center gap-1"
            >
              <IconServer className="size-3 text-zinc-400" />
              API: /branopriecinok/api/market
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Nemecká burza XETRA (Frankfurt) • SXR8 (Core S&P 500) & SXRV (Nasdaq 100) v EUR (€)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Market Open or Simulation Active Controls */}
          {marketStatus.isOpen ? (
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onPress={() => setIsLive(!isLive)}
              className={cn(
                "font-mono text-xs gap-1.5 transition-all",
                isLive
                  ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  : "border-zinc-800 text-zinc-300 hover:bg-zinc-900"
              )}
            >
              {isLive ? (
                <>
                  <IconPlayerPause className="size-4" />
                  Pozastaviť live tok
                </>
              ) : (
                <>
                  <IconPlayerPlay className="size-4 text-emerald-400" />
                  Obnoviť live tok
                </>
              )}
            </Button>
          ) : (
            <Button
              variant={simulationEnabled ? "default" : "outline"}
              size="sm"
              onPress={handleToggleSimulation}
              className={cn(
                "font-mono text-xs gap-1.5 transition-all",
                simulationEnabled
                  ? "bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold"
                  : "border-zinc-800 text-zinc-300 hover:bg-zinc-900"
              )}
            >
              {simulationEnabled ? (
                <>
                  <IconPlayerPause className="size-4" />
                  Vypnúť víkendovú simuláciu
                </>
              ) : (
                <>
                  <IconPlayerPlay className="size-4 text-amber-400" />
                  Spustiť víkendovú simuláciu (Demo)
                </>
              )}
            </Button>
          )}

          {/* Manual Tick Button */}
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              if (!simulationEnabled && !marketStatus.isOpen) {
                setSimulationEnabled(true)
                setIsLive(true)
              }
              executeTick()
            }}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-mono text-xs gap-1.5"
          >
            <IconBolt className="size-4 text-amber-400" />
            Okamžitý tick
          </Button>

          {/* Speed Selector */}
          <div className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-0.5 text-xs font-mono">
            <span className="text-[10px] text-zinc-400 ps-2 pe-1 font-sans">Interval:</span>
            {[
              { label: "1s", val: 1000 },
              { label: "2s", val: 2000 },
              { label: "5s", val: 5000 },
            ].map((spd) => (
              <button
                key={spd.val}
                type="button"
                onClick={() => setTickSpeed(spd.val)}
                className={cn(
                  "px-2 py-0.5 rounded-xl transition-colors cursor-pointer",
                  tickSpeed === spd.val
                    ? "bg-zinc-700 text-zinc-100 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {spd.label}
              </button>
            ))}
          </div>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onPress={handleReset}
            className="text-zinc-400 hover:text-zinc-200 font-mono text-xs gap-1"
          >
            <IconRefresh className="size-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Weekend / Market Closed Informative Banner */}
      {!marketStatus.isOpen && !simulationEnabled && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300 shrink-0">
              <IconLock className="size-5" />
            </div>
            <div>
              <div className="font-semibold text-zinc-200 flex items-center gap-2">
                Burza XETRA je momentálne zatvorená ({marketStatus.reason})
                <span className="text-[11px] font-mono text-zinc-400">
                  Hodiny: {marketStatus.hours}
                </span>
              </div>
              <p className="text-zinc-400 mt-0.5 text-[11px]">
                Zobrazujú sa oficiálne záverečné ceny z piatka. Automatické tiky sú v súlade so skutočným trhom zastavené. Najbližšie otvorenie:{" "}
                <span className="font-semibold text-zinc-200">{marketStatus.nextOpen}</span>.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onPress={handleToggleSimulation}
            className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 font-mono text-xs shrink-0 self-start sm:self-auto gap-1.5"
          >
            <IconPlayerPlay className="size-3.5 text-amber-400" />
            Spustiť víkendovú simuláciu (Demo)
          </Button>
        </div>
      )}

      {/* Hero Metric Cards for XETRA ETFs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* iShares S&P 500 (SXR8) Metric Card */}
        <div className="lg:col-span-2">
          <MetricCard
            quote={sxr8Quote}
            isLive={isLive}
            isMarketOpen={marketStatus.isOpen}
            isSimulating={simulationEnabled}
            isSelected={viewTab === "sxr8"}
            onClick={() => setViewTab(viewTab === "sxr8" ? "overview" : "sxr8")}
          />
        </div>

        {/* iShares Nasdaq 100 (SXRV) Metric Card */}
        <div className="lg:col-span-2">
          <MetricCard
            quote={sxrvQuote}
            isLive={isLive}
            isMarketOpen={marketStatus.isOpen}
            isSimulating={simulationEnabled}
            isSelected={viewTab === "sxrv"}
            onClick={() => setViewTab(viewTab === "sxrv" ? "overview" : "sxrv")}
          />
        </div>
      </div>

      {/* Market Sentiment & Secondary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Real Market Status Widget for XETRA */}
        <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-xl",
                marketStatus.isOpen
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-zinc-800 text-zinc-300"
              )}
            >
              {marketStatus.isOpen ? (
                <IconClock className="size-4" />
              ) : (
                <IconLock className="size-4" />
              )}
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Stav burzy XETRA</div>
              <div className="text-xs font-bold text-zinc-200">
                {marketStatus.statusText} ({marketStatus.reason})
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono",
              marketStatus.isOpen
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                : "text-zinc-300 border-zinc-700 bg-zinc-900"
            )}
          >
            {marketStatus.nextOpen}
          </Badge>
        </div>

        {/* Fear & Greed Index */}
        <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <IconGauge className="size-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Trhový sentiment</div>
              <div className="text-xs font-bold text-emerald-400">68 / 100 (Chamtivosť)</div>
            </div>
          </div>
          <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 w-[68%]" />
          </div>
        </div>

        {/* DAX / European Volatility */}
        <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <IconActivity className="size-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-medium">VDAX-NEW Volatilita</div>
              <div className="text-xs font-mono font-bold text-zinc-200">15.20 bodov</div>
            </div>
          </div>
          <div className="flex items-center text-xs font-mono font-semibold text-emerald-400">
            <IconTrendingDown className="size-3.5 me-0.5 inline-block" />
            -1.95%
          </div>
        </div>

        {/* API Route Status */}
        <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <IconServer className="size-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-medium">Backend API</div>
              <div className="text-xs font-mono font-bold text-zinc-200">Next.js Route Handler</div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono",
              apiConnected ? "text-emerald-400 border-emerald-500/30" : "text-amber-400"
            )}
          >
            {apiConnected ? (apiSource === "live" ? "LIVE XETRA" : "ONLINE (200 OK)") : "FALLBACK"}
          </Badge>
        </div>
      </div>

      {/* Main Chart Section Card */}
      <Card className="border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <CardHeader className="pb-3 border-b border-zinc-850">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* View Mode Tabs */}
            <div className="flex items-center flex-wrap gap-1 bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800 text-xs">
              {[
                { id: "overview", label: "Prehľad (Dva grafy)" },
                { id: "comparison", label: "Porovnanie (%)" },
                { id: "sxr8", label: "SXR8 (S&P 500) Detail" },
                { id: "sxrv", label: "SXRV (Nasdaq 100) Detail" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewTab(tab.id as ViewTab)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer",
                    viewTab === tab.id
                      ? "bg-zinc-100 text-zinc-950 font-semibold shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Timeframe & Chart Style Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Timeframe Selector */}
              <div className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900/80 p-0.5 text-xs font-mono">
                {(["1D", "1W", "1M", "1Y", "5Y"] as TimeFrame[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => handleTimeFrameChange(tf)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl transition-all cursor-pointer font-semibold",
                      timeFrame === tf
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {tf === "1D"
                      ? "1D"
                      : tf === "1W"
                        ? "1T"
                        : tf === "1M"
                          ? "1M"
                          : tf === "1Y"
                            ? "1R"
                            : "5R"}
                  </button>
                ))}
              </div>

              {/* Chart Style (Area vs Line) */}
              <div className="flex items-center rounded-2xl border border-zinc-800 bg-zinc-900/80 p-0.5 text-xs">
                <button
                  type="button"
                  title="Plošný graf"
                  onClick={() => setChartStyle("area")}
                  className={cn(
                    "p-1.5 rounded-xl transition-colors cursor-pointer",
                    chartStyle === "area"
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <IconChartArea className="size-4" />
                </button>
                <button
                  type="button"
                  title="Čiarový graf"
                  onClick={() => setChartStyle("line")}
                  className={cn(
                    "p-1.5 rounded-xl transition-colors cursor-pointer",
                    chartStyle === "line"
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <IconChartLine className="size-4" />
                </button>
              </div>

              {/* Technical Indicator Toggles */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setShowSma20(!showSma20)}
                  className={cn(
                    "px-2 py-1 rounded-xl border text-[11px] transition-colors cursor-pointer",
                    showSma20
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-300 font-semibold"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  SMA 20
                </button>

                <button
                  type="button"
                  onClick={() => setShowSma50(!showSma50)}
                  className={cn(
                    "px-2 py-1 rounded-xl border text-[11px] transition-colors cursor-pointer",
                    showSma50
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 font-semibold"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  SMA 50
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Chart Content */}
          {viewTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SXR8 Side Chart */}
              <div className="space-y-2 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-850">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-blue-500 inline-block" />
                    <span className="font-bold text-sm text-zinc-100">
                      iShares S&P 500 (SXR8)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-blue-400">
                      {formatCurrency(sxr8Quote.price)}
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      "text-xs font-mono font-semibold",
                      sxr8Quote.change >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {sxr8Quote.change >= 0 ? "+" : ""}
                    {sxr8Quote.changePercent.toFixed(2)}%
                  </div>
                </div>

                <StockChart
                  data={chartData}
                  viewMode="sxr8"
                  chartStyle={chartStyle}
                  showSma20={showSma20}
                  showSma50={showSma50}
                  showVolume={showVolume}
                  timeFrame={timeFrame}
                  singleIndex="SXR8"
                />
              </div>

              {/* SXRV Side Chart */}
              <div className="space-y-2 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-850">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-purple-500 inline-block" />
                    <span className="font-bold text-sm text-zinc-100">
                      iShares Nasdaq 100 (SXRV)
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-purple-400">
                      {formatCurrency(sxrvQuote.price)}
                    </Badge>
                  </div>
                  <div
                    className={cn(
                      "text-xs font-mono font-semibold",
                      sxrvQuote.change >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {sxrvQuote.change >= 0 ? "+" : ""}
                    {sxrvQuote.changePercent.toFixed(2)}%
                  </div>
                </div>

                <StockChart
                  data={chartData}
                  viewMode="sxrv"
                  chartStyle={chartStyle}
                  showSma20={showSma20}
                  showSma50={showSma50}
                  showVolume={showVolume}
                  timeFrame={timeFrame}
                  singleIndex="SXRV"
                />
              </div>
            </div>
          )}

          {viewTab === "comparison" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-blue-500 inline-block" />
                    <span className="font-semibold text-zinc-200">SXR8 (S&P 500):</span>
                    <span className="font-mono text-blue-400">
                      {chartData.length > 0 && chartData[chartData.length - 1] ? (
                        <>
                          {(chartData[chartData.length - 1]?.sxr8Pct ?? 0) >= 0 ? "+" : ""}
                          {(chartData[chartData.length - 1]?.sxr8Pct ?? 0).toFixed(2)}%
                        </>
                      ) : (
                        "0.00%"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-purple-500 inline-block" />
                    <span className="font-semibold text-zinc-200">SXRV (Nasdaq 100):</span>
                    <span className="font-mono text-purple-400">
                      {chartData.length > 0 && chartData[chartData.length - 1] ? (
                        <>
                          {(chartData[chartData.length - 1]?.sxrvPct ?? 0) >= 0 ? "+" : ""}
                          {(chartData[chartData.length - 1]?.sxrvPct ?? 0).toFixed(2)}%
                        </>
                      ) : (
                        "0.00%"
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-zinc-400 text-xs">
                  Normalizované porovnanie v EUR na XETRA ({timeFrame})
                </div>
              </div>

              <StockChart
                data={chartData}
                viewMode="comparison"
                chartStyle={chartStyle}
                showSma20={false}
                showSma50={false}
                showVolume={false}
                timeFrame={timeFrame}
              />
            </div>
          )}

          {viewTab === "sxr8" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                <span>
                  iShares Core S&P 500 UCITS ETF (Acc) • ISIN: {sxr8Quote.isin} • XETRA (EUR)
                </span>
                <span className="font-mono text-zinc-300">
                  Záverečný kurz: {formatCurrency(sxr8Quote.price)}
                </span>
              </div>
              <StockChart
                data={chartData}
                viewMode="sxr8"
                chartStyle={chartStyle}
                showSma20={showSma20}
                showSma50={showSma50}
                showVolume={showVolume}
                timeFrame={timeFrame}
                singleIndex="SXR8"
              />
            </div>
          )}

          {viewTab === "sxrv" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                <span>
                  iShares NASDAQ 100 UCITS ETF (Acc) • ISIN: {sxrvQuote.isin} • XETRA (EUR)
                </span>
                <span className="font-mono text-zinc-300">
                  Záverečný kurz: {formatCurrency(sxrvQuote.price)}
                </span>
              </div>
              <StockChart
                data={chartData}
                viewMode="sxrv"
                chartStyle={chartStyle}
                showSma20={showSma20}
                showSma50={showSma50}
                showVolume={showVolume}
                timeFrame={timeFrame}
                singleIndex="SXRV"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section: Live Order Flow & Top Constituents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Ticker Tape / Order Feed */}
        <div className="lg:col-span-5">
          <LiveTickerTape
            ticks={ticks}
            isLive={isLive}
            isMarketOpen={marketStatus.isOpen}
            isSimulating={simulationEnabled}
            tickCount={tickCount}
          />
        </div>

        {/* Top Heavyweights / Constituents */}
        <div className="lg:col-span-7">
          <TopConstituents
            stocks={constituents}
            filter={viewTab === "sxrv" ? "sxrv" : viewTab === "sxr8" ? "sxr8" : "all"}
          />
        </div>
      </div>
    </div>
  )
}
