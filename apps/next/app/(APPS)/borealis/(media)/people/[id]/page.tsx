import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { PersonDetails } from "@NamelessLiberty/elysia"
import { elysia } from "@/lib/elysia"
import { buildBorealisDetailMetadata } from "@/lib/borealis-metadata"
import { PersonDetailView } from "@NamelessLiberty/borealis"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const numericId = parseInt(id, 10)
  if (isNaN(numericId) || numericId <= 0) {
    return {
      title: "Borealis | People > Not Found",
    }
  }

  try {
    const { data } = await elysia.borealis.people({ id: numericId }).get()
    const personData = (data as any)?.person ?? data
    if (!personData) {
      return {
        title: `Borealis | People > #${numericId}`,
      }
    }

    const name = personData.namePrimary || personData.nameNative || `Person #${numericId}`
    return buildBorealisDetailMetadata({
      title: `Borealis | People > ${name}`,
      description: personData.description
        ? personData.description
            .slice(0, 160)
            .replace(/<[^>]*>/g, "")
            .trim()
        : `${name} voice actor and staff information on Borealis`,
      image: personData.image,
    })
  } catch {
    return {
      title: `Borealis | People > #${numericId}`,
    }
  }
}

export default async function PersonDetailPage({ params }: Props) {
  const { id } = await params
  const numericId = parseInt(id, 10)

  if (isNaN(numericId) || numericId <= 0) {
    notFound()
  }

  const { data, error } = await elysia.borealis.people({ id: numericId }).get()

  if (error || !data) {
    notFound()
  }

  const person: PersonDetails = ((data as any)?.person ?? data) as PersonDetails

  return <PersonDetailView person={person} />
}
