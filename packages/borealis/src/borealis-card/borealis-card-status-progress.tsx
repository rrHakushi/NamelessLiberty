"use client"

import React, { useContext, useState } from "react"
import {
  OverlayTriggerStateContext,
  RootMenuTriggerStateContext,
} from "react-aria-components"
import {
  IconCheck,
  IconPlus,
} from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { useBorealisCard } from "../borealis-card-context"
import { getMediaListStatusIcon } from "../media-list-status-badge"
import { getMediaListStatusColor } from "../status"
import {
  getMediaListStatusText,
  normalizeListStatus,
  type ListStatus,
} from "../media-list-status-text"

import { STATUS_DROPDOWN_OPTIONS } from "./shared"

function BorealisProgressCustomInput({
  max,
  unit,
  onApply,
}: {
  max?: number | null
  unit?: string
  onApply: (amount: number) => void
}) {
  const [val, setVal] = useState<string>("")
  const overlayState = useContext(OverlayTriggerStateContext)
  const rootMenuState = useContext(RootMenuTriggerStateContext)

  const handleApply = () => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num <= 0) return
    const clamped = typeof max === "number" && max > 0 ? Math.min(num, max) : num
    onApply(clamped)
    setVal("")
    overlayState?.close()
    rootMenuState?.close()
  }

  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-1"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <IconPlus className="size-3 text-primary shrink-0" />
      <input
        type="number"
        min={1}
        max={max ?? undefined}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "Enter") {
            e.preventDefault()
            handleApply()
          }
        }}
        placeholder="0"
        className="h-5 w-9 rounded border border-primary/40 bg-zinc-950/80 px-1 text-[10px] font-mono text-foreground placeholder:text-zinc-500 focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {unit && (
        <span className="text-[9px] font-medium text-foreground/80 shrink-0">
          {unit}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleApply()
        }}
        className="h-5 w-5 rounded bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground ms-auto shrink-0 cursor-pointer"
        aria-label="Apply custom increment"
      >
        <IconCheck className="size-3" />
      </Button>
    </div>
  )
}

export function BorealisCardStatusProgress() {
  const {
    data,
    config,
    setLocalStatus,
    setLocalProgress,
  } = useBorealisCard()

  const effectiveOnStatusChange = config.onStatusChange
  const effectiveOnIncrementVolume = config.onIncrementVolume

  const isEntity =
    data.type === "character" ||
    data.type === "staff" ||
    data.type === "studio"

  if (isEntity || config.showExtras === false) return null

  const isMovie = data.type === "movie" || data.type === "movies"
  const isReleasingMedia =
    String((data.raw?.media ?? data.raw)?.status ?? "").toUpperCase() ===
    "RELEASING"
  const hasListStatus = Boolean(data.listStatus)
  const shouldShowProgress =
    !isMovie && config.showProgress !== false && Boolean(data.progress)

  if (!hasListStatus && !shouldShowProgress) return null

  const segmentBtnClass =
    "h-5 gap-1 rounded-none px-1.5 font-mono text-[10px] font-bold text-foreground hover:bg-black/60 select-none transition-colors cursor-pointer"
  const segmentSpanClass =
    "inline-flex h-5 items-center px-1.5 font-mono text-[10px] font-medium text-foreground tabular-nums"

  return (
    <div
      className="pointer-events-auto inline-flex items-center overflow-hidden rounded-md border border-primary/40 bg-black/65 backdrop-blur-md shadow-md divide-x divide-primary/40"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Status Icon Segment */}
      {hasListStatus && (() => {
        const canonicalStatus: ListStatus =
          normalizeListStatus(data.listStatus) ?? "IN_PROGRESS"
        const StatusIcon = getMediaListStatusIcon(canonicalStatus)
        const statusColor = getMediaListStatusColor(canonicalStatus)
        const currentLabel = getMediaListStatusText(canonicalStatus, data.type)

        if (effectiveOnStatusChange) {
          return (
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                className={cn(
                  "h-5 w-6 rounded-none p-0 hover:bg-black/60 transition-colors cursor-pointer",
                  statusColor
                )}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                aria-label={`Status: ${currentLabel}. Click to change.`}
              >
                <StatusIcon className="size-3.5 stroke-2" aria-hidden="true" />
              </Button>
              <DropdownMenu
                placement="bottom start"
                className="w-auto min-w-[120px] whitespace-nowrap text-[10px] border border-primary/40 bg-black/65 text-foreground shadow-2xl backdrop-blur-md z-[100]"
              >
                {STATUS_DROPDOWN_OPTIONS.filter(
                  (opt) => !(isReleasingMedia && opt === "COMPLETED")
                ).map((opt) => {
                  const OptIcon = getMediaListStatusIcon(opt)
                  const optColor = getMediaListStatusColor(opt)
                  const optLabel = getMediaListStatusText(opt, data.type)
                  const isSelected = canonicalStatus === opt
                  return (
                    <DropdownMenuItem
                      key={opt}
                      onAction={() => {
                        setLocalStatus?.(opt)
                        if (
                          opt === "COMPLETED" &&
                          typeof data.progress?.max === "number" &&
                          data.progress.max > 0
                        ) {
                          setLocalProgress?.(data.progress.max)
                        }
                        effectiveOnStatusChange(opt)
                      }}
                      className="flex items-center gap-1.5 cursor-pointer font-medium text-[10px] py-1 px-2 min-h-6 whitespace-nowrap"
                    >
                      <OptIcon className={cn("size-3 shrink-0", optColor)} />
                      <span className={cn(isSelected && "font-bold text-foreground")}>
                        {optLabel}
                      </span>
                      {isSelected && (
                        <IconCheck className="size-3 ms-auto text-primary shrink-0" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenu>
            </DropdownMenuTrigger>
          )
        }

        return (
          <div
            className={cn(
              "flex h-5 w-6 items-center justify-center",
              statusColor
            )}
            title={currentLabel}
          >
            <StatusIcon className="size-3.5 stroke-2" aria-hidden="true" />
          </div>
        )
      })()}

      {/* Progress Segments */}
      {shouldShowProgress && data.progress && (() => {
        const isTv = data.type === "tv"
        const isMangaOrBook =
          data.type === "manga" || data.type === "books" || data.type === "book"
        const isGame = data.type === "games" || data.type === "game"
        const isOther = data.type === "other"

        const canIncrement = Boolean(config.onIncrement || effectiveOnIncrementVolume)

        if (isTv && data.progress.seasonNumber) {
          const epNum = data.progress.episodeNumber ?? data.progress.current ?? 0
          const epStr = epNum < 100 ? String(epNum).padStart(2, "0") : String(epNum)
          const maxEpInSeason = data.progress.seasonEpisodeCount
          const maxEpStr = maxEpInSeason
            ? maxEpInSeason < 100
              ? String(maxEpInSeason).padStart(2, "0")
              : String(maxEpInSeason)
            : null
          const remainingInSeason =
            maxEpInSeason && maxEpInSeason > epNum ? maxEpInSeason - epNum : 0
          const remainingTotal =
            data.progress.max && data.progress.max > data.progress.current
              ? data.progress.max - data.progress.current
              : 0
          const nextSeasonEpCount = data.progress.nextSeasonEpisodeCount
          const nextSeasonNum = data.progress.nextSeasonNumber
          const hasMoreSeasons = data.progress.hasMoreSeasons
          const currentSeasonNum = data.progress.seasonNumber

          return (
            <>
              {canIncrement ? (
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={config.isIncrementDisabled}
                    className={segmentBtnClass}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <span>S{currentSeasonNum}</span>
                  </Button>
                  <DropdownMenu
                    placement="bottom start"
                    className="w-auto min-w-[130px] whitespace-nowrap text-[10px] border border-primary/40 bg-black/65 text-foreground shadow-2xl backdrop-blur-md z-[100]"
                  >
                    {remainingInSeason > 0 ? (
                      <DropdownMenuItem
                        onAction={() => config.onIncrement?.(remainingInSeason)}
                        className="text-primary font-semibold whitespace-nowrap text-[10px] py-1 px-2 min-h-6"
                      >
                        <IconCheck className="size-3 me-1.5 text-primary shrink-0" />
                        Finish Season
                      </DropdownMenuItem>
                    ) : nextSeasonEpCount && nextSeasonEpCount > 0 ? (
                      <DropdownMenuItem
                        onAction={() => config.onIncrement?.(nextSeasonEpCount)}
                        className="text-primary font-semibold whitespace-nowrap text-[10px] py-1 px-2 min-h-6"
                      >
                        <IconPlus className="size-3 me-1.5 text-primary shrink-0" />
                        1 Season
                      </DropdownMenuItem>
                    ) : hasMoreSeasons && nextSeasonNum ? (
                      <DropdownMenuItem
                        isDisabled
                        className="text-[9px] text-foreground/75 cursor-default whitespace-nowrap py-1 px-2 min-h-6"
                      >
                        Season {nextSeasonNum} (TBA)
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        isDisabled
                        className="text-[9px] text-foreground/75 cursor-default whitespace-nowrap py-1 px-2 min-h-6"
                      >
                        Season {currentSeasonNum} Complete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenu>
                </DropdownMenuTrigger>
              ) : (
                <span className={segmentSpanClass}>S{currentSeasonNum}</span>
              )}

              {canIncrement ? (
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={config.isIncrementDisabled}
                    className={segmentBtnClass}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <span>
                      E{epStr}
                      {maxEpStr ? (
                        <>
                          <span className="text-primary">/</span>
                          {maxEpStr}
                        </>
                      ) : null}
                    </span>
                  </Button>
                  <DropdownMenu
                    placement="bottom start"
                    className="w-auto min-w-[130px] whitespace-nowrap text-[10px] border border-primary/40 bg-black/65 text-foreground shadow-2xl backdrop-blur-md z-[100]"
                  >
                    <DropdownMenuItem
                      onAction={() => config.onIncrement?.(1)}
                      className="whitespace-nowrap text-[10px] py-1 px-2 min-h-6 font-medium"
                    >
                      <IconPlus className="size-3 me-1.5 text-primary shrink-0" />
                      1 Ep
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      id="custom-ep"
                      textValue="Custom episodes"
                      shouldCloseOnSelect={false}
                      className="p-0 focus:bg-transparent focus:outline-none cursor-default min-h-6"
                    >
                      <BorealisProgressCustomInput
                        max={remainingTotal > 0 ? remainingTotal : undefined}
                        unit="eps"
                        onApply={(amount) => config.onIncrement?.(amount)}
                      />
                    </DropdownMenuItem>
                    {!isReleasingMedia && remainingTotal > 1 && (
                      <DropdownMenuItem
                        onAction={() => config.onIncrement?.(remainingTotal)}
                        className="text-emerald-400 font-semibold whitespace-nowrap text-[10px] py-1 px-2 min-h-6"
                      >
                        <IconCheck className="size-3 me-1.5 text-emerald-400 shrink-0" />
                        Finish Series
                      </DropdownMenuItem>
                    )}
                  </DropdownMenu>
                </DropdownMenuTrigger>
              ) : (
                <span className={segmentSpanClass}>
                  E{epStr}
                  {maxEpStr ? (
                    <>
                      <span className="text-primary">/</span>
                      {maxEpStr}
                    </>
                  ) : null}
                </span>
              )}
            </>
          )
        }

        if (isMangaOrBook) {
          const volCur = data.progress.volumeCurrent ?? 0
          const volMax = data.progress.volumeMax
          const chCur = data.progress.chapterCurrent ?? data.progress.current ?? 0
          const chMax = data.progress.chapterMax ?? data.progress.max
          const hasVolumes = volMax !== null || volCur > 0

          return (
            <>
              {canIncrement ? (
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={config.isIncrementDisabled}
                    className={segmentBtnClass}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <span>
                      CH{chCur}
                      {chMax ? (
                        <>
                          <span className="text-primary">/</span>
                          {chMax}
                        </>
                      ) : null}
                    </span>
                  </Button>
                  <DropdownMenu
                    placement="bottom start"
                    className="w-auto min-w-[130px] whitespace-nowrap text-[10px] border border-primary/40 bg-black/65 text-foreground shadow-2xl backdrop-blur-md z-[100]"
                  >
                    <DropdownMenuItem
                      onAction={() => config.onIncrement?.(1)}
                      className="whitespace-nowrap text-[10px] py-1 px-2 min-h-6 font-medium"
                    >
                      <IconPlus className="size-3 me-1.5 text-primary shrink-0" />
                      1 Ch
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      id="custom-ch"
                      textValue="Custom chapters"
                      shouldCloseOnSelect={false}
                      className="p-0 focus:bg-transparent focus:outline-none cursor-default min-h-6"
                    >
                      <BorealisProgressCustomInput
                        max={chMax && chMax > chCur ? chMax - chCur : undefined}
                        unit="chs"
                        onApply={(amount) => config.onIncrement?.(amount)}
                      />
                    </DropdownMenuItem>
                    {chMax && chMax > chCur + 1 && (
                      <DropdownMenuItem
                        onAction={() => config.onIncrement?.(chMax - chCur)}
                        className="text-emerald-400 font-semibold whitespace-nowrap text-[10px] py-1 px-2 min-h-6"
                      >
                        <IconCheck className="size-3 me-1.5 text-emerald-400 shrink-0" />
                        Finish Chapters
                      </DropdownMenuItem>
                    )}
                  </DropdownMenu>
                </DropdownMenuTrigger>
              ) : (
                <span className={segmentSpanClass}>
                  CH{chCur}
                  {chMax ? (
                    <>
                      <span className="text-primary">/</span>
                      {chMax}
                    </>
                  ) : null}
                </span>
              )}

              {hasVolumes &&
                (canIncrement && effectiveOnIncrementVolume ? (
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      isDisabled={config.isIncrementDisabled}
                      className={segmentBtnClass}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <span>
                        V{volCur}
                        {volMax ? (
                          <>
                            <span className="text-primary">/</span>
                            {volMax}
                          </>
                        ) : null}
                      </span>
                    </Button>
                    <DropdownMenu
                      placement="bottom start"
                      className="w-auto min-w-[130px] whitespace-nowrap text-[10px] border border-primary/40 bg-black/65 text-foreground shadow-2xl backdrop-blur-md z-[100]"
                    >
                      <DropdownMenuItem
                        onAction={() => effectiveOnIncrementVolume(1)}
                        className="whitespace-nowrap text-[10px] py-1 px-2 min-h-6 font-medium"
                      >
                        <IconPlus className="size-3 me-1.5 text-primary shrink-0" />
                        1 Vol
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        id="custom-vol"
                        textValue="Custom volumes"
                        shouldCloseOnSelect={false}
                        className="p-0 focus:bg-transparent focus:outline-none cursor-default min-h-6"
                      >
                        <BorealisProgressCustomInput
                          max={volMax && volMax > volCur ? volMax - volCur : undefined}
                          unit="vols"
                          onApply={(amount) => effectiveOnIncrementVolume(amount)}
                        />
                      </DropdownMenuItem>
                      {volMax && volMax > volCur + 1 && (
                        <DropdownMenuItem
                          onAction={() => effectiveOnIncrementVolume(volMax - volCur)}
                          className="text-cyan-400 font-semibold whitespace-nowrap text-[10px] py-1 px-2 min-h-6"
                        >
                          <IconCheck className="size-3 me-1.5 text-cyan-400 shrink-0" />
                          Finish Volumes
                        </DropdownMenuItem>
                      )}
                    </DropdownMenu>
                  </DropdownMenuTrigger>
                ) : (
                  <span className={segmentSpanClass}>
                    V{volCur}
                    {volMax ? (
                      <>
                        <span className="text-primary">/</span>
                        {volMax}
                      </>
                    ) : null}
                  </span>
                ))}
            </>
          )
        }

        let progressDisplayLabel: React.ReactNode = ""
        if (isGame) {
          progressDisplayLabel = `${data.progress.current} Hours`
        } else if (isOther) {
          progressDisplayLabel = (
            <>
              {data.progress.current}
              {data.progress.max ? (
                <>
                  <span className="text-muted-foreground/40 px-0.5 font-normal">/</span>
                  <span>{data.progress.max}</span>
                </>
              ) : null}
              {data.progress.unit ? (
                <span className="text-muted-foreground ms-1 font-normal">
                  {data.progress.unit}
                </span>
              ) : null}
            </>
          )
        } else {
          progressDisplayLabel = (
            <>
              {data.progress.current}
              {data.progress.max ? (
                <>
                  {" "}
                  <span className="text-primary">/</span>{" "}
                  {data.progress.max}
                </>
              ) : null}{" "}
              {data.progress.unit ?? "Ep"}
            </>
          )
        }

        return canIncrement ? (
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              size="sm"
              isDisabled={config.isIncrementDisabled}
              className={segmentBtnClass}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <span>{progressDisplayLabel}</span>
            </Button>
            <DropdownMenu
              placement="bottom start"
              className="w-auto min-w-[130px] whitespace-nowrap text-[10px] border border-primary/40 bg-black/65 text-foreground shadow-2xl backdrop-blur-md z-[100]"
            >
              {isGame ? (
                <>
                  <DropdownMenuItem
                    onAction={() => config.onIncrement?.(1)}
                    className="whitespace-nowrap text-[10px] py-1 px-2 min-h-6 font-medium"
                  >
                    <IconPlus className="size-3 me-1.5 text-primary shrink-0" />
                    1 Hour
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    id="custom-hours"
                    textValue="Custom hours"
                    shouldCloseOnSelect={false}
                    className="p-0 focus:bg-transparent focus:outline-none cursor-default min-h-6"
                  >
                    <BorealisProgressCustomInput
                      unit="hrs"
                      onApply={(amount) => config.onIncrement?.(amount)}
                    />
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onAction={() => config.onIncrement?.(1)}
                    className="whitespace-nowrap text-[10px] py-1 px-2 min-h-6 font-medium"
                  >
                    <IconPlus className="size-3 me-1.5 text-primary shrink-0" />
                    1 {data.progress.unit}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    id="custom-units"
                    textValue="Custom units"
                    shouldCloseOnSelect={false}
                    className="p-0 focus:bg-transparent focus:outline-none cursor-default min-h-6"
                  >
                    <BorealisProgressCustomInput
                      max={
                        data.progress.max && data.progress.max > data.progress.current
                          ? data.progress.max - data.progress.current
                          : undefined
                      }
                      unit={data.progress.unit}
                      onApply={(amount) => config.onIncrement?.(amount)}
                    />
                  </DropdownMenuItem>
                  {data.progress.max &&
                    data.progress.max > data.progress.current + 1 && (
                      <DropdownMenuItem
                        onAction={() =>
                          config.onIncrement?.(
                            data.progress!.max! - data.progress!.current
                          )
                        }
                        className="text-emerald-400 font-semibold whitespace-nowrap text-[10px] py-1 px-2 min-h-6"
                      >
                        <IconCheck className="size-3 me-1.5 text-emerald-400 shrink-0" />
                        Finish Series
                      </DropdownMenuItem>
                    )}
                </>
              )}
            </DropdownMenu>
          </DropdownMenuTrigger>
        ) : (
          <span className={segmentSpanClass}>{progressDisplayLabel}</span>
        )
      })()}
    </div>
  )
}
