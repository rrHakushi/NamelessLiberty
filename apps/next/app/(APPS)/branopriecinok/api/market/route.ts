import { NextRequest, NextResponse } from "next/server"
import type { TimeFrame, MarketIndex, MarketApiResponse } from "../../components/types"
import {
  INITIAL_SXR8_QUOTE,
  INITIAL_SXRV_QUOTE,
  INITIAL_CONSTITUENTS,
  generateSeriesForTimeFrame,
  createLiveTick,
  tickConstituents,
  getXetraMarketStatus,
} from "../../components/market-data-service"

// In-memory state on the Next.js server for continuous tick generation
let currentSxr8 = { ...INITIAL_SXR8_QUOTE }
let currentSxrv = { ...INITIAL_SXRV_QUOTE }
let currentConstituents = [...INITIAL_CONSTITUENTS]
let storedTicks: any[] = []

// Fetch real Yahoo Finance quote for German Xetra ETF if network allows
async function fetchYahooQuote(symbol: "SXR8.DE" | "SXRV.DE") {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 15 },
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta || typeof meta.regularMarketPrice !== "number") return null

    const price = Number(meta.regularMarketPrice.toFixed(2))
    const prevClose = Number((meta.previousClose ?? meta.chartPreviousClose ?? price).toFixed(2))
    const change = Number((price - prevClose).toFixed(2))
    const changePercent = Number(((change / prevClose) * 100).toFixed(2))

    return {
      price,
      previousClose: prevClose,
      change,
      changePercent,
      dayLow: Number((meta.regularMarketDayLow ?? price * 0.995).toFixed(2)),
      dayHigh: Number((meta.regularMarketDayHigh ?? price * 1.005).toFixed(2)),
      volume: meta.regularMarketVolume ?? 150000,
    }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tfParam = (searchParams.get("timeframe") as TimeFrame) || "1D"
  const validTimeFrames: TimeFrame[] = ["1D", "1W", "1M", "1Y", "5Y"]
  const timeFrame: TimeFrame = validTimeFrames.includes(tfParam) ? tfParam : "1D"

  // Attempt live quote fetch from Xetra via Yahoo Finance proxy
  const [liveSxr8, liveSxrv] = await Promise.all([
    fetchYahooQuote("SXR8.DE"),
    fetchYahooQuote("SXRV.DE"),
  ])

  let dataSource: "live" | "simulated" = "simulated"

  if (liveSxr8) {
    dataSource = "live"
    currentSxr8 = {
      ...currentSxr8,
      price: liveSxr8.price,
      change: liveSxr8.change,
      changePercent: liveSxr8.changePercent,
      previousClose: liveSxr8.previousClose,
      dayLow: liveSxr8.dayLow,
      dayHigh: liveSxr8.dayHigh,
      volume: liveSxr8.volume,
      direction: liveSxr8.change >= 0 ? "up" : "down",
      lastTickTime: new Date().toTimeString().split(" ")[0] ?? "17:30:00",
    }
  }

  if (liveSxrv) {
    dataSource = "live"
    currentSxrv = {
      ...currentSxrv,
      price: liveSxrv.price,
      change: liveSxrv.change,
      changePercent: liveSxrv.changePercent,
      previousClose: liveSxrv.previousClose,
      dayLow: liveSxrv.dayLow,
      dayHigh: liveSxrv.dayHigh,
      volume: liveSxrv.volume,
      direction: liveSxrv.change >= 0 ? "up" : "down",
      lastTickTime: new Date().toTimeString().split(" ")[0] ?? "17:30:00",
    }
  }

  const series = generateSeriesForTimeFrame(timeFrame)
  const marketStatus = getXetraMarketStatus()

  const responsePayload: MarketApiResponse = {
    success: true,
    source: dataSource,
    marketStatus,
    sxr8: currentSxr8,
    sxrv: currentSxrv,
    series,
    recentTicks: storedTicks.slice(0, 15),
    constituents: currentConstituents,
    serverTime: new Date().toISOString(),
  }

  return NextResponse.json(responsePayload)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const symbol: MarketIndex = body.symbol === "SXRV" ? "SXRV" : "SXR8"

    const isSxr8 = symbol === "SXR8"
    const targetQuote = isSxr8 ? currentSxr8 : currentSxrv
    const { quote: newQuote, tick: newTick } = createLiveTick(targetQuote, symbol)

    if (isSxr8) {
      currentSxr8 = newQuote
    } else {
      currentSxrv = newQuote
    }

    storedTicks = [newTick, ...storedTicks.slice(0, 29)]
    currentConstituents = tickConstituents(currentConstituents)

    return NextResponse.json({
      success: true,
      symbol,
      quote: newQuote,
      tick: newTick,
      sxr8: currentSxr8,
      sxrv: currentSxrv,
      constituents: currentConstituents,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Error generating tick" },
      { status: 500 }
    )
  }
}
