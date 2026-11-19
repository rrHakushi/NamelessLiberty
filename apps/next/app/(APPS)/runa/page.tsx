import type { Metadata } from "next"
import { RunaStudio } from "@NamelessLiberty/iris"

export const metadata: Metadata = {
  title: "Runa",
}

export default function RunaPage() {
  return <RunaStudio />
}
