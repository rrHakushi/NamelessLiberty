import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { elysia } from "@/lib/elysia"
import { buildBorealisDetailMetadata } from "@/lib/borealis-metadata"
import {
  MediaDetailView,
  toNormalizedMediaOverview,
} from "@NamelessLiberty/borealis"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId <= 0) {
    return {
      title: "Borealis | Other > Not Found",
    }
  }

  try {
    const { data } = await (elysia.borealis as any)
      .other({ otherId: numericId })
      .get()
    const item = (data as any)?.media ?? data
    if (!item) {
      return {
        title: `Borealis | Other > #${numericId}`,
      }
    }

    const title =
      item.titlePrimary || item.titleSecondary || `Other #${numericId}`
    return buildBorealisDetailMetadata({
      title: `Borealis | Other > ${title}`,
      description: item.description
        ? item.description.slice(0, 160).replace(/<[^>]*>/g, "")
        : `${title} details on Borealis`,
      image: item.coverImage,
    })
  } catch {
    return {
      title: `Borealis | Other > #${numericId}`,
    }
  }
}

export default async function OtherDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { queuedFetch } = await searchParams
  const isQueued = queuedFetch === "true"

  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId <= 0) {
    notFound()
  }

  const res = await (elysia.borealis as any)
    .other({ otherId: numericId })
    .get()
  if (res.error || !res.data) {
    notFound()
  }

  const raw = (res.data as any)?.media ?? res.data

  return (
    <MediaDetailView
      media={toNormalizedMediaOverview("other", raw)}
      isQueuedFetch={isQueued}
    />
  )
}
