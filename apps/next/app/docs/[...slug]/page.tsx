import Link from "next/link"
import { notFound } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"
import { IrisPage } from "@/components/iris-page"
import { getIrisDocBySlug } from "@/lib/docs-loader"

interface DocDetailPageProps {
  params: Promise<{ slug: string[] }>
}

export default async function DocDetailPage({ params }: DocDetailPageProps) {
  const { slug } = await params
  const schema = getIrisDocBySlug(slug)

  if (!schema) {
    notFound()
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          <span>Back to Docs Index</span>
        </Link>
      </div>

      <IrisPage schema={schema} showEditButton={false} />
    </main>
  )
}
