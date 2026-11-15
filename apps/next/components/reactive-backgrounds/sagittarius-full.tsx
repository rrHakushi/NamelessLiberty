"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.560096, 0, 0.439904, 0.999111] as const

/** Hover-reactive full-body Sagittarius character background in calligraphic wireframe style. */
export function SagittariusFullBackground(
  props: ReactiveBackgroundVariantProps
) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/sagittarius-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/sagittarius-full.png"
      uvRect={UV_RECT}
      textureWidth={1952}
      textureHeight={2496}
      roughness={0.81}
      specularTint={0.6627451}
      {...props}
    />
  )
}
