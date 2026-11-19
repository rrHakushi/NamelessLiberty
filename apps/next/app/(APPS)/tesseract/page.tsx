"use client"

import React, { useState } from "react"
import {
  DirectSendDialog,
  IncomingTransferDialog,
  SharedByOthersPanel,
  SharedByYouPanel,
  ShelfApprovalDialog,
  type TesseractPeer,
} from "@NamelessLiberty/tesseract"

export default function TesseractPage() {
  const [directTargetPeer, setDirectTargetPeer] =
    useState<TesseractPeer | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-4 sm:p-6">
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <SharedByYouPanel />
        <SharedByOthersPanel
          onOpenDirectSend={(peer) => setDirectTargetPeer(peer)}
        />
      </div>

      <DirectSendDialog
        targetPeer={directTargetPeer}
        onClose={() => setDirectTargetPeer(null)}
      />
      <IncomingTransferDialog />
      <ShelfApprovalDialog />
    </div>
  )
}
