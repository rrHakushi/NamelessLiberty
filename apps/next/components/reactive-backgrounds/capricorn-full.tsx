"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.560096, 0, 0.439904, 0.999111] as const

/** Hover-reactive full-body Capricorn character background in calligraphic wireframe style. */
export function CapricornFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/capricorn-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/capricorn-full.png"
      uvRect={UV_RECT}
      textureWidth={1952}
      textureHeight={2496}
      roughness={0.85}
      specularTint={0.62352941}
      {...props}
    />
  )
}
