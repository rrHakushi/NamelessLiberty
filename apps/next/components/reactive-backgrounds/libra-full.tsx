"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.4375, 0, 0.5625, 0.999111] as const

/** Hover-reactive full-body Libra character background in calligraphic wireframe style. */
export function LibraFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/libra-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/libra-full.png"
      uvRect={UV_RECT}
      textureWidth={2048}
      textureHeight={2048}
      roughness={0.85}
      specularTint={0.57254902}
      {...props}
    />
  )
}
