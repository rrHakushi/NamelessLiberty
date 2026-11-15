"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import type { CollaboratorRole } from "@NamelessLiberty/db"
import {
  RELIQUARY_CATEGORIES,
  RELIQUARY_VISIBILITIES,
  type ReliquaryCategory,
  type ReliquaryVisibility,
} from "@NamelessLiberty/shared"
import { IconSearch, IconTrash, IconUserPlus } from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { elysia } from "@/lib/elysia"
import { ReliquaryIconPicker } from "./icon-picker"
import {
  extractApiErrorMessage,
  type ReliquaryCollaboratorItem,
  type ReliquaryDocDetail,
  type ReliquaryUserPreview,
} from "./reliquary-types"

export interface DocSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: ReliquaryDocDetail
  onDocUpdated: (nextDoc: ReliquaryDocDetail) => void
}

export function DocSettingsDialog({
  open,
  onOpenChange,
  doc,
  onDocUpdated,
}: DocSettingsDialogProps) {
  const t = useTranslations("reliquary.settingsDialog")
  const tMeta = useTranslations("reliquary.createDocDialog")
  const tCat = useTranslations("reliquary.categories")
  const tVis = useTranslations("reliquary.visibility")
  const tErr = useTranslations("reliquary.errors")
  const router = useRouter()

  const [tab, setTab] = useState("general")
  const [title, setTitle] = useState(doc.title)
  const [description, setDescription] = useState(doc.description ?? "")
  const [icon, setIcon] = useState(doc.icon ?? "IconBook")
  const [category, setCategory] = useState<ReliquaryCategory>(doc.category)
  const [visibility, setVisibility] = useState<ReliquaryVisibility>(doc.visibility)
  const [tagsRaw, setTagsRaw] = useState(doc.tags.join(", "))
  const [saving, setSaving] = useState(false)

  const [collaborators, setCollaborators] = useState<ReliquaryCollaboratorItem[]>(
    doc.collaborators ?? []
  )
  const [userQuery, setUserQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ReliquaryUserPreview[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(doc.title)
    setDescription(doc.description ?? "")
    setIcon(doc.icon ?? "IconBook")
    setCategory(doc.category)
    setVisibility(doc.visibility)
    setTagsRaw(doc.tags.join(", "))
    setCollaborators(doc.collaborators ?? [])
    setConfirmDelete(false)

    elysia.reliquary
      .docs({ docId: doc.id })
      .collaborators.get()
      .then((res) => {
        if (res.data?.collaborators) {
          setCollaborators(res.data.collaborators as ReliquaryCollaboratorItem[])
        }
      })
      .catch(() => {})
  }, [open, doc])

  useEffect(() => {
    if (!open || !userQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await elysia.reliquary.users.search.get({
          query: { q: userQuery.trim() },
        })
        if (res.data?.users) {
          setSearchResults(res.data.users as ReliquaryUserPreview[])
        }
      } catch {
        setSearchResults([])
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [open, userQuery])

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      const tags = tagsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const res = await elysia.reliquary.docs({ docId: doc.id }).patch({
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

      if (res.data?.doc) {
        onDocUpdated(res.data.doc as unknown as ReliquaryDocDetail)
        toast.success(t("savedToast"))
        onOpenChange(false)
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    } finally {
      setSaving(false)
    }
  }

  const handleUpsertCollaborator = async (
    targetUserId: string,
    role: CollaboratorRole
  ) => {
    try {
      const res = await elysia.reliquary
        .docs({ docId: doc.id })
        .collaborators.post({ userId: targetUserId, role })

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }

      if (res.data?.collaborator) {
        const item = res.data.collaborator as ReliquaryCollaboratorItem
        setCollaborators((prev) => {
          const exists = prev.some((c) => c.userId === item.userId)
          return exists
            ? prev.map((c) => (c.userId === item.userId ? item : c))
            : [...prev, item]
        })
        setUserQuery("")
        setSearchResults([])
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    }
  }

  const handleRemoveCollaborator = async (targetUserId: string) => {
    try {
      const res = await elysia.reliquary
        .docs({ docId: doc.id })
        .collaborators({ userId: targetUserId })
        .delete()

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }

      setCollaborators((prev) => prev.filter((c) => c.userId !== targetUserId))
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    }
  }

  const handleDeleteDoc = async () => {
    setSaving(true)
    try {
      const res = await elysia.reliquary.docs({ docId: doc.id }).delete()
      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }
      onOpenChange(false)
      router.push("/reliquary")
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    } finally {
      setSaving(false)
    }
  }

  const existingIds = new Set([doc.creatorId, ...collaborators.map((c) => c.userId)])

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      <Tabs
        selectedKey={tab}
        onSelectionChange={(k) => setTab(String(k))}
        className="w-full"
      >
        <TabsList className="w-full">
          <TabsTrigger id="general" className="flex-1 cursor-pointer text-xs">
            {t("generalTab")}
          </TabsTrigger>
          <TabsTrigger id="collaborators" className="flex-1 cursor-pointer text-xs">
            {t("collaboratorsTab")}
          </TabsTrigger>
          <TabsTrigger id="danger" className="flex-1 cursor-pointer text-xs">
            {t("dangerTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent id="general" className="pt-4">
          <form onSubmit={handleSaveMeta} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {tMeta("docTitle")}
              </label>
              <Input
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                placeholder={tMeta("docTitlePlaceholder")}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {tMeta("description")}
              </label>
              <Input
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDescription(e.target.value)
                }
                placeholder={tMeta("descriptionPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {tMeta("tags")}
              </label>
              <Input
                value={tagsRaw}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTagsRaw(e.target.value)
                }
                placeholder={tMeta("tagsPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {tMeta("icon")}
              </label>
              <ReliquaryIconPicker value={icon} onChange={setIcon} />
            </div>

            <DialogFooter>
              <Button type="submit" isDisabled={saving || !title.trim()}>
                {t("saveMeta")}
              </Button>
            </DialogFooter>
          </form>
        </TabsContent>

        <TabsContent id="collaborators" className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              {t("inviteLabel")}
            </label>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute top-2.5 start-3 size-3.5 text-muted-foreground" />
              <Input
                value={userQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUserQuery(e.target.value)
                }
                placeholder={t("searchUsersPlaceholder")}
                className="ps-8 text-xs"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 rounded-xl border border-border/60 bg-muted/30 p-2">
                {searchResults
                  .filter((u) => !existingIds.has(u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted/60"
                    >
                      <span className="font-medium">@{u.username}</span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onPress={() => handleUpsertCollaborator(u.id, "VIEWER")}
                        >
                          {t("roleViewer")}
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          onPress={() => handleUpsertCollaborator(u.id, "EDITOR")}
                          className="gap-1"
                        >
                          <IconUserPlus className="size-3" />
                          <span>{t("roleEditor")}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {collaborators.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noCollaborators")}</p>
            ) : (
              collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">@{c.user.username}</span>
                    {c.user.displayName && (
                      <span className="text-muted-foreground">({c.user.displayName})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={c.role === "EDITOR" ? "default" : "secondary"}
                      className="cursor-pointer"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleUpsertCollaborator(
                            c.userId,
                            c.role === "EDITOR" ? "VIEWER" : "EDITOR"
                          )
                        }
                        className="cursor-pointer"
                      >
                        {c.role === "EDITOR" ? t("roleEditor") : t("roleViewer")}
                      </button>
                    </Badge>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      aria-label={t("remove")}
                      onPress={() => handleRemoveCollaborator(c.userId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent id="danger" className="space-y-4 pt-4">
          <p className="text-xs text-muted-foreground">{t("deleteWarning")}</p>
          {!confirmDelete ? (
            <Button
              type="button"
              variant="destructive"
              onPress={() => setConfirmDelete(true)}
            >
              {t("deleteButton")}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onPress={() => setConfirmDelete(false)}
              >
                {tMeta("cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                isDisabled={saving}
                onPress={handleDeleteDoc}
              >
                {t("confirmDeleteButton")}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Dialog>
  )
}
