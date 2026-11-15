"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.560874, 0, 0.439126, 0.999111] as const

/** Hover-reactive full-body Pisces character background in calligraphic wireframe style. */
export function PiscesFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/pisces-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/pisces-full.png"
      uvRect={UV_RECT}
      textureWidth={1936}
      textureHeight={2480}
      roughness={0.78}
      specularTint={0.8}
      {...props}
    />
  )
}
