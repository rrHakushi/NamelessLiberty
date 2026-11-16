"use client"

import {
  ReactiveBackground,
  type ReactiveBackgroundVariantProps,
} from "./reactive-background"

const UV_RECT = [0.4375, 0, 0.5625, 0.999111] as const

/** Hover-reactive full-body Gemini twin character background in calligraphic wireframe style. */
export function GeminiFullBackground(props: ReactiveBackgroundVariantProps) {
  return (
    <ReactiveBackground
      textureUrl="/images/reactive-backgrounds/gemini-full.png"
      swayMaskUrl="/images/reactive-backgrounds/masks/gemini-full.png"
      uvRect={UV_RECT}
      textureWidth={2048}
      textureHeight={2048}
      roughness={0.83}
      specularTint={1}
      {...props}
    />
  )
}

