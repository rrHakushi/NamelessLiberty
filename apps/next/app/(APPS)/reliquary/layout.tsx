import type { Metadata } from "next"
import React from "react"
import { IrisReliquaryNavProvider } from "@NamelessLiberty/reliquary"
import { ReliquaryProvider } from "@NamelessLiberty/reliquary"

export const metadata: Metadata = {
  title: {
    default: "Reliquary",
    template: "%s | Reliquary",
  },
  description: "Structured documentation books, wikis, and guides",
  openGraph: {
    title: "Reliquary",
    description: "Structured documentation books, wikis, and guides",
    siteName: "IRIS",
    images: [
      {
        url: "/banners/reliquary.png",
        width: 1200,
        height: 630,
        alt: "Reliquary - Documentation, Wikis, and Guides",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reliquary",
    description: "Structured documentation books, wikis, and guides",
    images: ["/banners/reliquary.png"],
  },
}

export default function ReliquaryLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-svh w-full overflow-hidden">
      <ReliquaryProvider>
        <IrisReliquaryNavProvider>{children}</IrisReliquaryNavProvider>
      </ReliquaryProvider>
    </div>
  )
}
