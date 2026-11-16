"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { normalizeBorealisData } from "../normalizers"
import { StatusBadge } from "../status-badge"
import { MediaStatusBadge } from "../media-status-badge"
import { MediaListStatusBadge } from "../media-list-status-badge"

import type { BorealisCardProps } from "../types"

import { BorealisCardRoot } from "./borealis-card-root"
import { BorealisCardImage } from "./borealis-card-image"
import { BorealisCardTitle } from "./borealis-card-title"
import { BorealisCardExtras } from "./borealis-card-extras"
import { BorealisCardHoverContent } from "./borealis-card-hover-content"
import { BorealisCardExpandedContent } from "./borealis-card-expanded-content"
// 6. Main Compound Component: BorealisCard

// -----------------------------------------------------------------------------
export function BorealisCard({
  type,
  data,
  href,
  expanded = false,
  imagePosition = "left",
  showExtras = true,
  showBadges = true,
  showSubtitle = true,
  showHoverSubtitle = false,
  showTabNav = false,
  showDescription = false,
  showHoverCard = true,
  showProgress = true,
  statusIconOnly = false,
  canEdit = false,
  onStatusChange,
  onScoreChange,
  onSaveEntry,
  onEdit,
  onIncrement,
  onIncrementVolume,
  isIncrementDisabled = false,
  titlePreference = "primary",
  progress,
  aspectRatio,
  size = "md",
  hoverPlacement,
  hoverDelay = 150,
  className,
  priority = false,
  children,
}: BorealisCardProps) {
  const normalized = normalizeBorealisData(type, data, href, { titlePreference })
  if (progress) {
    normalized.progress = progress
  }

  return (
    <BorealisCardRoot
      data={normalized}
      expanded={expanded}
      imagePosition={imagePosition}
      showExtras={showExtras}
      showBadges={showBadges}
      showSubtitle={showSubtitle}
      showHoverSubtitle={showHoverSubtitle}
      showTabNav={showTabNav}
      showDescription={showDescription}
      showHoverCard={showHoverCard}
      showProgress={showProgress}
      statusIconOnly={statusIconOnly}
      canEdit={canEdit}
      onStatusChange={onStatusChange}
      onScoreChange={onScoreChange}
      onSaveEntry={onSaveEntry}
      onEdit={onEdit}
      onIncrement={onIncrement}
      onIncrementVolume={onIncrementVolume}
      isIncrementDisabled={isIncrementDisabled}
      aspectRatio={aspectRatio}
      size={size}
      hoverPlacement={hoverPlacement}
      hoverDelay={hoverDelay}
      className={className}
    >
      {children ? (
        children
      ) : expanded ? (
        <BorealisCardExpandedContent
          imagePosition={imagePosition}
          priority={priority}
          showHoverCard={showHoverCard}
        />
      ) : (
        <>
          <BorealisCardImage priority={priority} />
          <BorealisCardTitle />
          <BorealisCardExtras />
          {showHoverCard && <BorealisCardHoverContent />}
        </>
      )}
    </BorealisCardRoot>
  )
}

export function BorealisCardExpanded(props: BorealisCardProps) {
  return <BorealisCard {...props} expanded />
}

// Compound API Attachments
BorealisCard.Root = BorealisCardRoot
BorealisCard.Image = BorealisCardImage
BorealisCard.Title = BorealisCardTitle
BorealisCard.Extras = BorealisCardExtras
BorealisCard.HoverContent = BorealisCardHoverContent
BorealisCard.ExpandedContent = BorealisCardExpandedContent
BorealisCard.Expanded = BorealisCardExpanded
BorealisCard.StatusBadge = StatusBadge
BorealisCard.MediaStatusBadge = MediaStatusBadge
BorealisCard.MediaListStatusBadge = MediaListStatusBadge
