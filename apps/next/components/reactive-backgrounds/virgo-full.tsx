"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.58, 0, 0.42, 0.999111] as const

/** Hover-reactive full-body Virgo character background in calligraphic wireframe style. */
export function VirgoFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/virgo-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/virgo-full.png"
      uvRect={UV_RECT}
      textureWidth={1792}
      textureHeight={2400}
      roughness={0.8}
      specularTint={0.68235294}
      {...props}
    />
  )
}

