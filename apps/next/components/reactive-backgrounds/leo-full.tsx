"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.58, 0, 0.42, 0.999111] as const

/** Hover-reactive full-body Leo character background in calligraphic wireframe style. */
export function LeoFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/leo-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/leo-full.png"
      uvRect={UV_RECT}
      textureWidth={1792}
      textureHeight={2400}
      roughness={0.85}
      specularTint={0.78431373}
      {...props}
    />
  )
}

