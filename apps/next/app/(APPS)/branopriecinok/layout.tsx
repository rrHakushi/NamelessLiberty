import type { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
  title: {
    default: "iShares S&P 500 & Nasdaq 100 (XETRA) | Braňopriečinok",
    template: "%s | Braňopriečinok",
  },
  description: "Živé grafy a kurzy ETF iShares Core S&P 500 (SXR8) a NASDAQ 100 (SXRV) na nemeckej burze Xetra v EUR",
  openGraph: {
    title: "iShares S&P 500 & Nasdaq 100 (XETRA) | Braňopriečinok",
    description: "Živé grafy a kurzy ETF iShares Core S&P 500 (SXR8) a NASDAQ 100 (SXRV) na nemeckej burze Xetra v EUR",
    siteName: "IRIS",
    type: "website",
  },
}

export default function BranopriecinokLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
