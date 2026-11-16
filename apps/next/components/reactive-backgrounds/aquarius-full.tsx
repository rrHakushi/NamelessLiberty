"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.575397, 0, 0.424603, 0.999111] as const

/** Hover-reactive full-body Aquarius character background in calligraphic wireframe style. */
export function AquariusFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/aquarius-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/aquarius-full.png"
      uvRect={UV_RECT}
      textureWidth={1872}
      textureHeight={2480}
      roughness={0.8}
      specularTint={0.69803922}
      {...props}
    />
  )
}
