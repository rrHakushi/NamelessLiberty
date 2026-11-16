"use client"

import React, { useState } from "react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Badge } from "@workspace/ui/components/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  IconCheck,
  IconEye,
  IconEyeOff,
  IconFolderOpen,
  IconPlugConnected,
  IconAlertTriangle,
} from "@tabler/icons-react"
import {
  servarrRequest,
  type ServarrApp,
  type ServarrField,
  type ServarrValidationError,
} from "./servarr-client"
import { ServarrFilesystemDialog } from "./servarr-filesystem-dialog"

export interface ServarrSchemaFieldsProps {
  app: ServarrApp
  fields: ServarrField[]
  onChange: (name: string, value: any) => void
  onRunAction?: (actionName: string) => Promise<void>
  validationErrors?: ServarrValidationError[]
}

/**
 * Renders all non-hidden *arr `Field[]` inputs directly (no Advanced Mode toggle).
 */
export function ServarrSchemaFields({
  app,
  fields,
  onChange,
  onRunAction,
  validationErrors = [],
}: ServarrSchemaFieldsProps) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [fsField, setFsField] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  const sorted = [...fields]
    .filter((f) => f.hidden !== "hidden")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const getError = (name: string) =>
    validationErrors.find(
      (e) => e.propertyName.toLowerCase() === name.toLowerCase()
    )?.errorMessage

  return (
    <div className="space-y-4">
      {sorted.map((field) => {
        const err = getError(field.name)
        const val = field.value
        const isPath =
          field.type === "path" ||
          field.type === "filePath" ||
          field.name.toLowerCase().endsWith("path")

        if (field.type === "checkbox") {
          return (
            <div
              key={field.name}
              className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3"
            >
              <div className="space-y-0.5 text-start">
                <Label className="text-sm font-medium text-zinc-100">
                  {field.label || field.name}
                </Label>
                {field.helpText && (
                  <p className="text-xs text-zinc-400">{field.helpText}</p>
                )}
                {field.helpTextWarning && (
                  <p className="text-xs text-amber-400">{field.helpTextWarning}</p>
                )}
                {err && <p className="text-xs text-red-400">{err}</p>}
              </div>
              <Switch
                isSelected={Boolean(val)}
                onChange={(checked) => onChange(field.name, checked)}
              />
            </div>
          )
        }

        if (field.type === "select" || field.selectOptions?.length) {
          const options = field.selectOptions ?? []
          const stringVal = val !== undefined && val !== null ? String(val) : ""
          return (
            <div key={field.name} className="space-y-1.5 text-start">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-zinc-200">
                  {field.label || field.name}
                </Label>
                {field.selectOptionsProviderAction && onRunAction && (
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={actionBusy === field.selectOptionsProviderAction}
                    onPress={async () => {
                      setActionBusy(field.selectOptionsProviderAction!)
                      try {
                        await onRunAction(field.selectOptionsProviderAction!)
                      } finally {
                        setActionBusy(null)
                      }
                    }}
                  >
                    Refresh Options
                  </Button>
                )}
              </div>
              <Select
                selectedKey={stringVal || null}
                onSelectionChange={(next) => {
                  const nextStr = String(next ?? "")
                  const matched = options.find((o) => String(o.value) === nextStr)
                  onChange(field.name, matched ? matched.value : nextStr)
                }}
                placeholder="Select..."
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectList>
                    {options.map((opt) => (
                      <SelectItem key={String(opt.value)} id={String(opt.value)}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectList>
                </SelectContent>
              </Select>
              {field.helpText && (
                <p className="text-xs text-zinc-400">{field.helpText}</p>
              )}
              {err && <p className="text-xs text-red-400">{err}</p>}
            </div>
          )
        }

        if (field.type === "action" && onRunAction) {
          return (
            <div key={field.name} className="space-y-1.5 text-start">
              <Button
                variant="outline"
                disabled={actionBusy === (field.selectOptionsProviderAction || field.name)}
                onPress={async () => {
                  const act = field.selectOptionsProviderAction || field.name
                  setActionBusy(act)
                  try {
                    await onRunAction(act)
                  } finally {
                    setActionBusy(null)
                  }
                }}
                className="gap-2"
              >
                {actionBusy && <Spinner className="size-3.5" />}
                {field.label || field.name}
              </Button>
              {field.helpText && (
                <p className="text-xs text-zinc-400">{field.helpText}</p>
              )}
            </div>
          )
        }

        if (field.type === "password") {
          const show = Boolean(revealed[field.name])
          return (
            <div key={field.name} className="space-y-1.5 text-start">
              <Label className="text-xs font-medium text-zinc-200">
                {field.label || field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type={show ? "text" : "password"}
                  value={val ?? ""}
                  placeholder={field.placeholder || ""}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onPress={() =>
                    setRevealed((prev) => ({
                      ...prev,
                      [field.name]: !prev[field.name],
                    }))
                  }
                >
                  {show ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                </Button>
              </div>
              {field.helpText && (
                <p className="text-xs text-zinc-400">{field.helpText}</p>
              )}
              {err && <p className="text-xs text-red-400">{err}</p>}
            </div>
          )
        }

        const isArrayVal = Array.isArray(val)
        return (
          <div key={field.name} className="space-y-1.5 text-start">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-zinc-200">
                {field.label || field.name}
              </Label>
              {field.unit && (
                <Badge variant="outline" className="text-[10px]">
                  {field.unit}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {field.type === "textbox" && String(val ?? "").length > 100 ? (
                <Textarea
                  value={isArrayVal ? val.join(",") : (val ?? "")}
                  placeholder={field.placeholder || ""}
                  onChange={(e) =>
                    onChange(
                      field.name,
                      isArrayVal
                        ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        : e.target.value
                    )
                  }
                  className="bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  step={field.isFloat ? "any" : undefined}
                  value={isArrayVal ? val.join(",") : (val ?? "")}
                  placeholder={field.placeholder || ""}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (field.type === "number") {
                      onChange(field.name, raw === "" ? null : Number(raw))
                    } else if (isArrayVal) {
                      onChange(
                        field.name,
                        raw.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    } else {
                      onChange(field.name, raw)
                    }
                  }}
                  className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              )}
              {isPath && (
                <Button
                  size="icon"
                  variant="outline"
                  onPress={() => setFsField(field.name)}
                  aria-label="Browse path"
                >
                  <IconFolderOpen className="size-4" />
                </Button>
              )}
            </div>
            {field.helpText && (
              <p className="text-xs text-zinc-400">{field.helpText}</p>
            )}
            {field.helpTextWarning && (
              <p className="text-xs text-amber-400">{field.helpTextWarning}</p>
            )}
            {err && <p className="text-xs text-red-400">{err}</p>}
          </div>
        )
      })}

      <ServarrFilesystemDialog
        isOpen={fsField !== null}
        onClose={() => setFsField(null)}
        app={app}
        initialPath={
          fsField
            ? String(fields.find((f) => f.name === fsField)?.value ?? "")
            : ""
        }
        onSelect={(selectedPath) => {
          if (fsField) onChange(fsField, selectedPath)
        }}
      />
    </div>
  )
}

export interface ServarrProviderModalProps {
  isOpen: boolean
  onClose: () => void
  app: ServarrApp
  resource: "indexer" | "downloadclient" | "importlist" | "metadata" | "autotagging"
  title: string
  initialItem?: any | null
  schemas: any[]
  onSaved: () => void
}

export function ServarrProviderModal({
  isOpen,
  onClose,
  app,
  resource,
  title,
  initialItem,
  schemas,
  onSaved,
}: ServarrProviderModalProps) {
  const [draft, setDraft] = useState<any>(() => initialItem ?? null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  )
  const [validationErrors, setValidationErrors] = useState<
    ServarrValidationError[]
  >([])

  React.useEffect(() => {
    if (isOpen) {
      setDraft(initialItem ? structuredClone(initialItem) : null)
      setStatusMsg(null)
      setValidationErrors([])
    }
  }, [isOpen, initialItem])

  const updateField = (name: string, value: any) => {
    setDraft((prev: any) => ({
      ...prev,
      fields: (prev?.fields ?? []).map((f: ServarrField) =>
        f.name === name ? { ...f, value } : f
      ),
    }))
  }

  const handleTest = async () => {
    if (!draft) return
    setTesting(true)
    setStatusMsg(null)
    setValidationErrors([])
    const res = await servarrRequest(app, `providers/${resource}/test`, {
      method: "POST",
      body: JSON.stringify(draft),
    })
    setTesting(false)
    if (res.success) {
      setStatusMsg({ ok: true, text: "Test succeeded" })
    } else {
      setValidationErrors(res.validationErrors ?? [])
      setStatusMsg({ ok: false, text: res.message || "Test failed" })
    }
  }

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    setStatusMsg(null)
    setValidationErrors([])
    const isEdit = Boolean(draft.id)
    const res = await servarrRequest(
      app,
      isEdit ? `providers/${resource}/${draft.id}` : `providers/${resource}`,
      {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(draft),
      }
    )
    setSaving(false)
    if (res.success) {
      onSaved()
      onClose()
    } else {
      setValidationErrors(res.validationErrors ?? [])
      setStatusMsg({ ok: false, text: res.message || "Save failed" })
    }
  }

  const handleAction = async (actionName: string) => {
    if (!draft) return
    const res = await servarrRequest(
      app,
      `providers/${resource}/action/${encodeURIComponent(actionName)}`,
      {
        method: "POST",
        body: JSON.stringify(draft),
      }
    )
    if (res.success && res.data) {
      if (Array.isArray(res.data.options)) {
        setDraft((prev: any) => ({
          ...prev,
          fields: (prev?.fields ?? []).map((f: ServarrField) =>
            f.selectOptionsProviderAction === actionName
              ? { ...f, selectOptions: res.data.options }
              : f
          ),
        }))
      }
      if (res.data.redirectUrl) {
        window.open(res.data.redirectUrl, "_blank", "noopener,noreferrer")
      }
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-6"
    >
      <DialogHeader>
          <DialogTitle className="text-start">{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pe-2">
          {!draft ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {schemas.map((schema, idx) => (
                <button
                  key={`${schema.implementation}-${idx}`}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...structuredClone(schema),
                      name: schema.implementationName || schema.implementation,
                    })
                  }
                  className="flex flex-col items-start gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-start transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <span className="text-sm font-semibold text-zinc-100">
                    {schema.implementationName || schema.implementation}
                  </span>
                  {schema.protocol && (
                    <Badge variant="outline" className="text-[10px]">
                      {schema.protocol}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5 text-start">
                <Label className="text-xs font-medium text-zinc-200">Name</Label>
                <Input
                  value={draft.name ?? ""}
                  onChange={(e) =>
                    setDraft((prev: any) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              </div>

              {"enable" in draft && (
                <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
                  <Label className="text-sm text-zinc-100">Enable</Label>
                  <Switch
                    isSelected={Boolean(draft.enable)}
                    onChange={(v) =>
                      setDraft((prev: any) => ({ ...prev, enable: v }))
                    }
                  />
                </div>
              )}

              {"enabled" in draft && (
                <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
                  <Label className="text-sm text-zinc-100">Enabled</Label>
                  <Switch
                    isSelected={Boolean(draft.enabled)}
                    onChange={(v) =>
                      setDraft((prev: any) => ({ ...prev, enabled: v }))
                    }
                  />
                </div>
              )}

              {"enableRss" in draft && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["enableRss", "Enable RSS"],
                      ["enableAutomaticSearch", "Auto Search"],
                      ["enableInteractiveSearch", "Interactive Search"],
                    ] as const
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5"
                    >
                      <Label className="text-xs text-zinc-200">{label}</Label>
                      <Switch
                        isSelected={Boolean(draft[key])}
                        onChange={(v) =>
                          setDraft((prev: any) => ({ ...prev, [key]: v }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {"priority" in draft && (
                <div className="space-y-1.5 text-start">
                  <Label className="text-xs font-medium text-zinc-200">
                    Priority
                  </Label>
                  <Input
                    type="number"
                    value={draft.priority ?? 25}
                    onChange={(e) =>
                      setDraft((prev: any) => ({
                        ...prev,
                        priority: Number(e.target.value),
                      }))
                    }
                    className="bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
              )}

              {Array.isArray(draft.fields) && (
                <ServarrSchemaFields
                  app={app}
                  fields={draft.fields}
                  onChange={updateField}
                  onRunAction={handleAction}
                  validationErrors={validationErrors}
                />
              )}
            </div>
          )}
        </ScrollArea>

        {statusMsg && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              statusMsg.ok
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            {statusMsg.ok ? (
              <IconCheck className="size-4 shrink-0" />
            ) : (
              <IconAlertTriangle className="size-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          {draft && (
            <>
              <Button
                variant="outline"
                disabled={testing || saving}
                onPress={handleTest}
                className="gap-1.5"
              >
                {testing ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <IconPlugConnected className="size-4" />
                )}
                Test
              </Button>
              <Button disabled={saving || testing} onPress={handleSave}>
                {saving && <Spinner className="me-1.5 size-3.5" />}
                Save
              </Button>
            </>
          )}
        </DialogFooter>
    </Dialog>
  )
}
