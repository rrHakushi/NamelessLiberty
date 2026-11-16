"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.58, 0, 0.42, 0.999111] as const

/** Hover-reactive full-body Aries character background in calligraphic wireframe style. */
export function AriesFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/aries-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/aries-full.png"
      uvRect={UV_RECT}
      textureWidth={1792}
      textureHeight={2400}
      roughness={0.82}
      specularTint={0.64705882}
      {...props}
    />
  )
}

