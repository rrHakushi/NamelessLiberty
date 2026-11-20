"use client"

import React from "react"
import {
  SharedByOthersPanel,
  SharedByYouPanel,
  ShelfApprovalDialog,
} from "@NamelessLiberty/tesseract"

export default function TesseractPage() {
  return (
    <div className="flex w-full flex-1 flex-col p-4 sm:p-6">
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <SharedByYouPanel />
        <SharedByOthersPanel />
      </div>

      <ShelfApprovalDialog />
    </div>
  )
}
