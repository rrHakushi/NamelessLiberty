import type {
  DataPoint,
  IndexQuote,
  MarketIndex,
  StockMover,
  TickEvent,
  TimeFrame,
  MarketStatusInfo,
} from "./types"

// Accurate check of XETRA trading hours (Frankfurt, Europe/Berlin)
export function getXetraMarketStatus(date = new Date()): MarketStatusInfo {
  // Convert current time to Europe/Berlin (CET/CEST)
  const cetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  })

  const parts = cetFormatter.formatToParts(date)
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? ""
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10)
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10)
  const totalMinutes = hour * 60 + minute

  const openMinutes = 9 * 60 // 09:00
  const closeMinutes = 17 * 60 + 30 // 17:30

  const isWeekend = weekday === "Sun" || weekday === "Sat"

  if (isWeekend) {
    return {
      isOpen: false,
      statusText: "ZATVORENÉ",
      reason: weekday === "Sun" ? "Víkend (Nedeľa)" : "Víkend (Sobota)",
      nextOpen: "Pondelok 09:00 SEČ",
      exchange: "XETRA (Frankfurt)",
      hours: "09:00 - 17:30 SEČ",
    }
  }

  if (totalMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: "PRE-MARKET",
      reason: "Pred otvorením burzy",
      nextOpen: "Dnes o 09:00 SEČ",
      exchange: "XETRA (Frankfurt)",
      hours: "09:00 - 17:30 SEČ",
    }
  }

  if (totalMinutes > closeMinutes) {
    const nextDay = weekday === "Fri" ? "Pondelok 09:00 SEČ" : "Zajtra 09:00 SEČ"
    return {
      isOpen: false,
      statusText: "ZATVORENÉ",
      reason: "Po závere burzy (Post-market)",
      nextOpen: nextDay,
      exchange: "XETRA (Frankfurt)",
      hours: "09:00 - 17:30 SEČ",
    }
  }

  return {
    isOpen: true,
    statusText: "OTVORENÉ",
    reason: "Prebieha riadne obchodovanie",
    nextOpen: "Dnes do 17:30 SEČ",
    exchange: "XETRA (Frankfurt)",
    hours: "09:00 - 17:30 SEČ",
  }
}

// Baseline realistic prices on XETRA (Deutsche Börse) in EUR
export const BASE_SXR8 = 576.4
export const BASE_SXRV = 212.85

export const INITIAL_SXR8_QUOTE: IndexQuote = {
  symbol: "SXR8",
  name: "iShares Core S&P 500 UCITS ETF (Acc)",
  ticker: "SXR8.DE",
  isin: "IE00B5BMR087",
  wkn: "A0YEDG",
  exchange: "XETRA (Frankfurt)",
  currency: "EUR",
  ter: "0.07% p.a.",
  price: BASE_SXR8,
  change: 3.6,
  changePercent: 0.63,
  open: 573.1,
  previousClose: 572.8,
  dayLow: 571.9,
  dayHigh: 577.8,
  yearLow: 442.5,
  yearHigh: 588.2,
  volume: 184520,
  direction: "up",
  lastTickTime: "17:30:00",
}

export const INITIAL_SXRV_QUOTE: IndexQuote = {
  symbol: "SXRV",
  name: "iShares NASDAQ 100 UCITS ETF (Acc)",
  ticker: "SXRV.DE",
  isin: "IE00B53SZB19",
  wkn: "A0YEDL",
  exchange: "XETRA (Frankfurt)",
  currency: "EUR",
  ter: "0.33% p.a.",
  price: BASE_SXRV,
  change: 1.9,
  changePercent: 0.9,
  open: 211.2,
  previousClose: 210.95,
  dayLow: 210.4,
  dayHigh: 213.6,
  yearLow: 162.1,
  yearHigh: 218.4,
  volume: 342190,
  direction: "up",
  lastTickTime: "17:30:00",
}

export const INITIAL_CONSTITUENTS: StockMover[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 138.8,
    change: 2.95,
    changePercent: 2.17,
    weight: "7.9%",
    sector: "Polovodiče & AI akcelerátory",
    index: "both",
  },
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 216.5,
    change: 1.5,
    changePercent: 0.7,
    weight: "7.2%",
    sector: "Spotrebná elektronika",
    index: "both",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 401.2,
    change: 2.8,
    changePercent: 0.7,
    weight: "6.6%",
    sector: "Softvér & Cloud (Azure)",
    index: "both",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 198.2,
    change: 2.1,
    changePercent: 1.07,
    weight: "4.1%",
    sector: "E-commerce & AWS Cloud",
    index: "both",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc. (Class A)",
    price: 169.8,
    change: -0.4,
    changePercent: -0.23,
    weight: "3.7%",
    sector: "Internet & Vyhľadávanie",
    index: "both",
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    price: 554.6,
    change: 7.8,
    changePercent: 1.43,
    weight: "2.9%",
    sector: "Sociálne siete & Reklama",
    index: "both",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 321.4,
    change: 11.2,
    changePercent: 3.61,
    weight: "2.5%",
    sector: "Elektromobily & Autonómne AI",
    index: "both",
  },
  {
    symbol: "AVGO",
    name: "Broadcom Inc.",
    price: 159.9,
    change: 1.85,
    changePercent: 1.17,
    weight: "2.3%",
    sector: "Polovodiče & Sieťový hardvér",
    index: "both",
  },
  {
    symbol: "BRK.B",
    name: "Berkshire Hathaway",
    price: 444.5,
    change: 0.7,
    changePercent: 0.16,
    weight: "1.8%",
    sector: "Financie & Konglomerát",
    index: "sxr8",
  },
  {
    symbol: "COST",
    name: "Costco Wholesale",
    price: 902.5,
    change: 4.6,
    changePercent: 0.51,
    weight: "2.2%",
    sector: "Maloobchod & Spotrebný tovar",
    index: "sxrv",
  },
]

// Simple Moving Average calculation
function calculateSMA(data: number[], windowSize: number): (number | undefined)[] {
  return data.map((_, idx, arr) => {
    if (idx < windowSize - 1) return undefined
    const slice = arr.slice(idx - windowSize + 1, idx + 1)
    const sum = slice.reduce((acc, curr) => acc + curr, 0)
    return Number((sum / windowSize).toFixed(2))
  })
}

// Generate realistic dataset for each timeframe on XETRA in EUR
export function generateSeriesForTimeFrame(timeFrame: TimeFrame): DataPoint[] {
  let count = 42
  let stepMinutes = 10
  let sxr8Start = 573.1
  let sxrvStart = 211.2

  const now = new Date()
  const points: {
    time: string
    timestamp: number
    sxr8: number
    sxrv: number
    volume: number
  }[] = []

  switch (timeFrame) {
    case "1D": {
      // XETRA trading hours: 09:00 to 17:30 CET (42 points with 12-minute steps)
      count = 42
      stepMinutes = 12
      const startTime = new Date(now)
      startTime.setHours(9, 0, 0, 0)

      let sxr8Current = sxr8Start
      let sxrvCurrent = sxrvStart

      for (let i = 0; i < count; i++) {
        const timePoint = new Date(startTime.getTime() + i * stepMinutes * 60 * 1000)
        const hourStr = timePoint.getHours().toString().padStart(2, "0")
        const minStr = timePoint.getMinutes().toString().padStart(2, "0")

        // Brownian motion around base
        const sxr8Delta = (Math.sin(i / 6) * 0.25 + (Math.random() - 0.48) * 0.45)
        const sxrvDelta = (Math.sin(i / 6) * 0.3 + (Math.random() - 0.48) * 0.35)

        sxr8Current = Number((sxr8Current + sxr8Delta).toFixed(2))
        sxrvCurrent = Number((sxrvCurrent + sxrvDelta).toFixed(2))

        const vol = Math.floor(2500 + Math.random() * 4500)

        points.push({
          time: `${hourStr}:${minStr}`,
          timestamp: timePoint.getTime(),
          sxr8: sxr8Current,
          sxrv: sxrvCurrent,
          volume: vol,
        })
      }
      break
    }
    case "1W": {
      // 5 trading days on XETRA
      count = 35
      const startTime = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      let sxr8Current = sxr8Start * 0.988
      let sxrvCurrent = sxrvStart * 0.985

      const daysOfWeek = ["Po", "Ut", "St", "Št", "Pi"]

      for (let i = 0; i < count; i++) {
        const dayIdx = Math.min(4, Math.floor(i / 7))
        const hour = 9 + Math.floor((i % 7) * 1.2)
        const sxr8Delta = (Math.random() - 0.48) * 1.8 + 0.15
        const sxrvDelta = (Math.random() - 0.48) * 1.2 + 0.12

        sxr8Current = Number((sxr8Current + sxr8Delta).toFixed(2))
        sxrvCurrent = Number((sxrvCurrent + sxrvDelta).toFixed(2))

        points.push({
          time: `${daysOfWeek[dayIdx]} ${hour}:00`,
          timestamp: startTime.getTime() + i * 3 * 3600 * 1000,
          sxr8: sxr8Current,
          sxrv: sxrvCurrent,
          volume: Math.floor(18000 + Math.random() * 12000),
        })
      }
      break
    }
    case "1M": {
      // 30 days
      count = 30
      let sxr8Current = sxr8Start * 0.97
      let sxrvCurrent = sxrvStart * 0.965

      for (let i = 0; i < count; i++) {
        const dayDate = new Date(now.getTime() - (30 - i) * 24 * 3600 * 1000)
        const sxr8Delta = (Math.random() - 0.46) * 3.2
        const sxrvDelta = (Math.random() - 0.46) * 2.1

        sxr8Current = Number((sxr8Current + sxr8Delta).toFixed(2))
        sxrvCurrent = Number((sxrvCurrent + sxrvDelta).toFixed(2))

        const label = `${dayDate.getDate()}. ${dayDate.getMonth() + 1}.`

        points.push({
          time: label,
          timestamp: dayDate.getTime(),
          sxr8: sxr8Current,
          sxrv: sxrvCurrent,
          volume: Math.floor(160000 + Math.random() * 90000),
        })
      }
      break
    }
    case "1Y": {
      // 52 weeks
      count = 52
      let sxr8Current = 485.0
      let sxrvCurrent = 175.0

      for (let i = 0; i < count; i++) {
        const weekDate = new Date(now.getTime() - (52 - i) * 7 * 24 * 3600 * 1000)
        const sxr8Delta = (Math.random() - 0.44) * 4.5 + 1.8
        const sxrvDelta = (Math.random() - 0.44) * 2.8 + 0.75

        sxr8Current = Number((sxr8Current + sxr8Delta).toFixed(2))
        sxrvCurrent = Number((sxrvCurrent + sxrvDelta).toFixed(2))

        const monthName = weekDate.toLocaleDateString("sk-SK", {
          month: "short",
        })

        points.push({
          time: `${monthName} w${Math.floor(i % 4) + 1}`,
          timestamp: weekDate.getTime(),
          sxr8: sxr8Current,
          sxrv: sxrvCurrent,
          volume: Math.floor(950000 + Math.random() * 400000),
        })
      }
      break
    }
    case "5Y": {
      // 60 months
      count = 60
      let sxr8Current = 310.0
      let sxrvCurrent = 110.0

      for (let i = 0; i < count; i++) {
        const monthDate = new Date(now.getTime() - (60 - i) * 30 * 24 * 3600 * 1000)
        const dip = i === 24 || i === 25 ? -15 : 0
        const sxr8Delta = (Math.random() - 0.43) * 6.5 + 4.2 + dip
        const sxrvDelta = (Math.random() - 0.42) * 3.8 + 1.9 + dip * 0.7

        sxr8Current = Number((sxr8Current + sxr8Delta).toFixed(2))
        sxrvCurrent = Number((sxrvCurrent + sxrvDelta).toFixed(2))

        const yearLabel = monthDate.getFullYear().toString()
        const monthLabel = monthDate.toLocaleDateString("sk-SK", { month: "short" })

        points.push({
          time: `${monthLabel} '${yearLabel.slice(2)}`,
          timestamp: monthDate.getTime(),
          sxr8: sxr8Current,
          sxrv: sxrvCurrent,
          volume: Math.floor(4500000 + Math.random() * 1500000),
        })
      }
      break
    }
  }

  // Ensure last point aligns with current baseline
  const lastPoint = points[points.length - 1]
  if (lastPoint) {
    lastPoint.sxr8 = BASE_SXR8
    lastPoint.sxrv = BASE_SXRV
  }

  const sxr8Values = points.map((p) => p.sxr8)
  const sxrvValues = points.map((p) => p.sxrv)

  const sxr8Sma20 = calculateSMA(sxr8Values, 10)
  const sxr8Sma50 = calculateSMA(sxr8Values, 20)
  const sxrvSma20 = calculateSMA(sxrvValues, 10)
  const sxrvSma50 = calculateSMA(sxrvValues, 20)

  const firstSxr8 = points[0]?.sxr8 ?? BASE_SXR8
  const firstSxrv = points[0]?.sxrv ?? BASE_SXRV

  return points.map((p, idx) => ({
    time: p.time,
    timestamp: p.timestamp,
    sxr8: p.sxr8,
    sxrv: p.sxrv,
    sxr8Pct: Number((((p.sxr8 - firstSxr8) / firstSxr8) * 100).toFixed(2)),
    sxrvPct: Number((((p.sxrv - firstSxrv) / firstSxrv) * 100).toFixed(2)),
    sxr8Sma20: sxr8Sma20[idx],
    sxr8Sma50: sxr8Sma50[idx],
    sxrvSma20: sxrvSma20[idx],
    sxrvSma50: sxrvSma50[idx],
    volume: p.volume,
  }))
}

// Generate a live micro tick for an index on XETRA in EUR
export function createLiveTick(
  prevQuote: IndexQuote,
  symbol: MarketIndex
): { quote: IndexQuote; tick: TickEvent } {
  const isUp = Math.random() > 0.485
  const magnitude = (0.0001 + Math.random() * 0.0005) * (isUp ? 1 : -1)

  const rawDelta = prevQuote.price * magnitude
  const delta = Number(rawDelta.toFixed(2))
  const newPrice = Number((prevQuote.price + delta).toFixed(2))

  const newDayHigh = Math.max(prevQuote.dayHigh, newPrice)
  const newDayLow = Math.min(prevQuote.dayLow, newPrice)
  const newChange = Number((newPrice - prevQuote.previousClose).toFixed(2))
  const newChangePercent = Number(
    ((newChange / prevQuote.previousClose) * 100).toFixed(2)
  )

  const now = new Date()
  const timeStr = now.toTimeString().split(" ")[0] ?? "17:30:00"

  const quote: IndexQuote = {
    ...prevQuote,
    price: newPrice,
    change: newChange,
    changePercent: newChangePercent,
    dayHigh: newDayHigh,
    dayLow: newDayLow,
    volume: prevQuote.volume + Math.floor(15 + Math.random() * 85),
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    lastTickTime: timeStr,
  }

  const tick: TickEvent = {
    id: `${symbol}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: timeStr,
    symbol,
    price: newPrice,
    delta,
    changePercent: Number((magnitude * 100).toFixed(3)),
    size: Math.floor(10 + Math.random() * 90),
    type: delta >= 0 ? "buy" : "sell",
  }

  return { quote, tick }
}

// Micro tick for top constituent stocks
export function tickConstituents(constituents: StockMover[]): StockMover[] {
  return constituents.map((stock) => {
    if (Math.random() > 0.4) {
      const isUp = Math.random() > 0.48
      const deltaPercent = (Math.random() * 0.002) * (isUp ? 1 : -1)
      const delta = Number((stock.price * deltaPercent).toFixed(2))
      const newPrice = Number((stock.price + delta).toFixed(2))
      const newChange = Number((stock.change + delta).toFixed(2))
      const newChangePercent = Number(
        (stock.changePercent + deltaPercent * 100).toFixed(2)
      )

      return {
        ...stock,
        price: newPrice,
        change: newChange,
        changePercent: newChangePercent,
      }
    }
    return stock
  })
}

// Format EUR currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)} T`
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} mld. €`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} mil. €`
  }
  return value.toLocaleString("sk-SK")
}
