"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import type { ReliquarySidebarNode } from "@NamelessLiberty/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectItem,
  SelectList,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { elysia } from "@/lib/elysia"
import { ReliquaryIconPicker } from "./icon-picker"
import {
  extractApiErrorMessage,
  flattenSidebarNodeOptions,
  type ReliquaryDocDetail,
} from "./reliquary-types"

export interface AddPageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: ReliquaryDocDetail
  onDocUpdated: (nextDoc: ReliquaryDocDetail) => void
}

const ROOT_VALUE = "__ROOT__"

export function AddPageDialog({
  open,
  onOpenChange,
  doc,
  onDocUpdated,
}: AddPageDialogProps) {
  const t = useTranslations("reliquary.addPageDialog")
  const tErr = useTranslations("reliquary.errors")
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [icon, setIcon] = useState("IconFileText")
  const [parentNodeId, setParentNodeId] = useState<string>(ROOT_VALUE)
  const [submitting, setSubmitting] = useState(false)

  const parentOptions = useMemo(
    () => flattenSidebarNodeOptions(doc.sidebarConfig, 4),
    [doc.sidebarConfig]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const res = await elysia.reliquary.docs({ docId: doc.id }).pages.post({
        title: title.trim(),
        icon: icon || "IconFileText",
        parentNodeId: parentNodeId === ROOT_VALUE ? null : parentNodeId,
      })

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }

      if (res.data) {
        onDocUpdated({
          ...doc,
          sidebarConfig: res.data.sidebarConfig as ReliquarySidebarNode[],
          pageIds: res.data.pageIds,
        })
        toast.success(t("createdToast"))
        onOpenChange(false)
        setTitle("")
        setParentNodeId(ROOT_VALUE)
        router.push(`/reliquary/${doc.id}/${res.data.page.id}`)
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">{t("pageTitle")}</label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder={t("pageTitlePlaceholder")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">{t("parentNode")}</label>
          <Select
            selectedKey={parentNodeId}
            onSelectionChange={(k) => setParentNodeId(String(k))}
            className="w-full"
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {() =>
                  parentNodeId === ROOT_VALUE
                    ? t("rootLevel")
                    : (parentOptions.find((o) => o.id === parentNodeId)?.label ??
                      t("rootLevel"))
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopover className="w-72 rounded-xl border border-border bg-popover p-1 shadow-lg">
              <SelectList className="flex max-h-60 flex-col gap-0.5 overflow-y-auto p-0">
                <SelectItem
                  id={ROOT_VALUE}
                  textValue={t("rootLevel")}
                  className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium"
                >
                  {t("rootLevel")}
                </SelectItem>
                {parentOptions.map((opt) => (
                  <SelectItem
                    key={opt.id}
                    id={opt.id}
                    textValue={opt.label}
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectList>
            </SelectPopover>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">{t("icon")}</label>
          <ReliquaryIconPicker value={icon} onChange={setIcon} />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onPress={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" isDisabled={submitting || !title.trim()}>
            {t("create")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
