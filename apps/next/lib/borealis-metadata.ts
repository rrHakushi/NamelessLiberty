import type { Metadata } from "next"

export function buildBorealisDetailMetadata({
  title,
  description,
  image,
}: {
  title: string
  description: string
  image?: string | null
}): Metadata {
  const cleanImage = typeof image === "string" && image.trim() ? image.trim() : null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(cleanImage ? { images: [{ url: cleanImage, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(cleanImage ? { images: [cleanImage] } : {}),
    },
  }
}
