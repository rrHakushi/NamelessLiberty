export type TimeFrame = "1D" | "1W" | "1M" | "1Y" | "5Y"

export type ChartStyle = "area" | "line"

export type ViewTab = "overview" | "comparison" | "sxr8" | "sxrv"

export type MarketIndex = "SXR8" | "SXRV"

export interface MarketStatusInfo {
  isOpen: boolean
  statusText: "OTVORENÉ" | "ZATVORENÉ" | "PRE-MARKET"
  reason: string
  nextOpen: string
  exchange: string
  hours: string
}

export interface DataPoint {
  time: string
  timestamp: number
  sxr8: number
  sxrv: number
  sxr8Pct: number
  sxrvPct: number
  sxr8Sma20?: number
  sxr8Sma50?: number
  sxrvSma20?: number
  sxrvSma50?: number
  volume: number
}

export interface IndexQuote {
  symbol: MarketIndex
  name: string
  ticker: string
  isin: string
  wkn: string
  exchange: string
  currency: string
  ter: string
  price: number
  change: number
  changePercent: number
  open: number
  previousClose: number
  dayLow: number
  dayHigh: number
  yearLow: number
  yearHigh: number
  volume: number
  direction: "up" | "down" | "flat"
  lastTickTime: string
}

export interface TickEvent {
  id: string
  timestamp: string
  symbol: MarketIndex
  price: number
  delta: number
  changePercent: number
  size: number
  type: "buy" | "sell"
}

export interface StockMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  weight: string
  sector: string
  index: "both" | "sxr8" | "sxrv"
}

export interface MarketApiResponse {
  success: boolean
  source: "live" | "simulated"
  marketStatus: MarketStatusInfo
  sxr8: IndexQuote
  sxrv: IndexQuote
  series: DataPoint[]
  recentTicks: TickEvent[]
  constituents: StockMover[]
  serverTime: string
}
