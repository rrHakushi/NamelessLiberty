"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  RELIQUARY_CATEGORIES,
  RELIQUARY_VISIBILITIES,
  type ReliquaryCategory,
  type ReliquaryVisibility,
} from "@NamelessLiberty/shared"
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
import { extractApiErrorMessage, type ReliquaryDocDetail } from "./reliquary-types"

export interface CreateDocDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (doc: ReliquaryDocDetail) => void
}

export function CreateDocDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateDocDialogProps) {
  const t = useTranslations("reliquary.createDocDialog")
  const tCat = useTranslations("reliquary.categories")
  const tVis = useTranslations("reliquary.visibility")
  const tErr = useTranslations("reliquary.errors")
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("IconBook")
  const [category, setCategory] = useState<ReliquaryCategory>("GUIDES")
  const [visibility, setVisibility] = useState<ReliquaryVisibility>("PUBLIC")
  const [tagsRaw, setTagsRaw] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    try {
      const tags = tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const res = await elysia.reliquary.docs.post({
        title: title.trim(),
        description: description.trim() || null,
        icon: icon || "IconBook",
        category,
        visibility,
        tags,
      })

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }

      const createdDoc = res.data?.doc as ReliquaryDocDetail | undefined
      toast.success(t("createdToast"))
      onOpenChange(false)
      setTitle("")
      setDescription("")
      setTagsRaw("")
      if (createdDoc) {
        onCreated?.(createdDoc)
        router.push(`/reliquary/${createdDoc.id}`)
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">{t("docTitle")}</label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder={t("docTitlePlaceholder")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">{t("description")}</label>
          <Input
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDescription(e.target.value)
            }
            placeholder={t("descriptionPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("category")}</label>
            <Select
              selectedKey={category}
              onSelectionChange={(k) => setCategory(k as ReliquaryCategory)}
              className="w-full"
            >
              <SelectTrigger className="w-full">
                <SelectValue>{() => tCat(category)}</SelectValue>
              </SelectTrigger>
              <SelectPopover className="w-48 rounded-xl border border-border bg-popover p-1 shadow-lg">
                <SelectList className="flex flex-col gap-0.5 p-0">
                  {RELIQUARY_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat}
                      id={cat}
                      textValue={tCat(cat)}
                      className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium"
                    >
                      {tCat(cat)}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopover>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{t("visibility")}</label>
            <Select
              selectedKey={visibility}
              onSelectionChange={(k) => setVisibility(k as ReliquaryVisibility)}
              className="w-full"
            >
              <SelectTrigger className="w-full">
                <SelectValue>{() => tVis(visibility)}</SelectValue>
              </SelectTrigger>
              <SelectPopover className="w-48 rounded-xl border border-border bg-popover p-1 shadow-lg">
                <SelectList className="flex flex-col gap-0.5 p-0">
                  {RELIQUARY_VISIBILITIES.map((vis) => (
                    <SelectItem
                      key={vis}
                      id={vis}
                      textValue={tVis(vis)}
                      className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium"
                    >
                      {tVis(vis)}
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopover>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">{t("tags")}</label>
          <Input
            value={tagsRaw}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsRaw(e.target.value)}
            placeholder={t("tagsPlaceholder")}
          />
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
