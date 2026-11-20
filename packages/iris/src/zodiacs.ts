import type { ComponentType } from "react"
import {
  AquariusBackground,
  AquariusFullBackground,
  AriesBackground,
  AriesFullBackground,
  CancerBackground,
  CancerFullBackground,
  CapricornBackground,
  CapricornFullBackground,
  GeminiBackground,
  GeminiFullBackground,
  LeoBackground,
  LeoFullBackground,
  LibraBackground,
  LibraFullBackground,
  PiscesBackground,
  PiscesFullBackground,
  SagittariusBackground,
  SagittariusFullBackground,
  ScorpioBackground,
  ScorpioFullBackground,
  TaurusBackground,
  TaurusFullBackground,
  VirgoBackground,
  VirgoFullBackground,
  type ImageFilterPreset,
  type ReactiveBackgroundVariantProps,
} from "@/components/reactive-backgrounds"
import {
  AquariusIcon,
  AriesIcon,
  CancerIcon,
  CapricornIcon,
  GeminiIcon,
  LeoIcon,
  LibraIcon,
  PiscesIcon,
  SagittariusIcon,
  ScorpioIcon,
  TaurusIcon,
  VirgoIcon,
  type ReactiveIconVariantProps,
} from "@/components/reactive-icons"

export type ZodiacId =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces"

export type FullZodiacBackgroundId = `${ZodiacId}-full`

export type BackgroundId = ZodiacId | FullZodiacBackgroundId
export type BackgroundSelection = BackgroundId | "none"
export type IconSelection = ZodiacId | "none"

export interface BackgroundEntry {
  id: BackgroundId
  name: string
  zhName: string
  Background: ComponentType<ReactiveBackgroundVariantProps>
}

export interface ZodiacEntry {
  id: ZodiacId
  name: string
  zhName: string
  Background: ComponentType<ReactiveBackgroundVariantProps>
  Icon: ComponentType<ReactiveIconVariantProps>
}

export const ZODIAC_VARIANTS: readonly ZodiacEntry[] = [
  {
    id: "aries",
    name: "Aries",
    zhName: "ç™½ç¾Šåº§",
    Background: AriesBackground,
    Icon: AriesIcon,
  },
  {
    id: "taurus",
    name: "Taurus",
    zhName: "é‡‘ç‰›åº§",
    Background: TaurusBackground,
    Icon: TaurusIcon,
  },
  {
    id: "gemini",
    name: "Gemini",
    zhName: "åŒå­åº§",
    Background: GeminiBackground,
    Icon: GeminiIcon,
  },
  {
    id: "cancer",
    name: "Cancer",
    zhName: "å·¨èŸ¹åº§",
    Background: CancerBackground,
    Icon: CancerIcon,
  },
  {
    id: "leo",
    name: "Leo",
    zhName: "ç‹®å­åº§",
    Background: LeoBackground,
    Icon: LeoIcon,
  },
  {
    id: "virgo",
    name: "Virgo",
    zhName: "å¤„å¥³åº§",
    Background: VirgoBackground,
    Icon: VirgoIcon,
  },
  {
    id: "libra",
    name: "Libra",
    zhName: "å¤©ç§¤åº§",
    Background: LibraBackground,
    Icon: LibraIcon,
  },
  {
    id: "scorpio",
    name: "Scorpio",
    zhName: "å¤©èŽåº§",
    Background: ScorpioBackground,
    Icon: ScorpioIcon,
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    zhName: "å°„æ‰‹åº§",
    Background: SagittariusBackground,
    Icon: SagittariusIcon,
  },
  {
    id: "capricorn",
    name: "Capricorn",
    zhName: "æ‘©ç¾¯åº§",
    Background: CapricornBackground,
    Icon: CapricornIcon,
  },
  {
    id: "aquarius",
    name: "Aquarius",
    zhName: "æ°´ç“¶åº§",
    Background: AquariusBackground,
    Icon: AquariusIcon,
  },
  {
    id: "pisces",
    name: "Pisces",
    zhName: "åŒé±¼åº§",
    Background: PiscesBackground,
    Icon: PiscesIcon,
  },
] as const

const FULL_BODY_BY_ZODIAC: Partial<Record<ZodiacId, BackgroundEntry>> = {
  aries: {
    id: "aries-full",
    name: "Aries Full",
    zhName: "ç™½ç¾Šåº§ Â· å…¨èº«",
    Background: AriesFullBackground,
  },
  taurus: {
    id: "taurus-full",
    name: "Taurus Full",
    zhName: "é‡‘ç‰›åº§ Â· å…¨èº«",
    Background: TaurusFullBackground,
  },
  gemini: {
    id: "gemini-full",
    name: "Gemini Full",
    zhName: "åŒå­åº§ Â· å…¨èº«",
    Background: GeminiFullBackground,
  },
  cancer: {
    id: "cancer-full",
    name: "Cancer Full",
    zhName: "å·¨èŸ¹åº§ Â· å…¨èº«",
    Background: CancerFullBackground,
  },
  leo: {
    id: "leo-full",
    name: "Leo Full",
    zhName: "ç‹®å­åº§ Â· å…¨èº«",
    Background: LeoFullBackground,
  },
  virgo: {
    id: "virgo-full",
    name: "Virgo Full",
    zhName: "å¤„å¥³åº§ Â· å…¨èº«",
    Background: VirgoFullBackground,
  },
  libra: {
    id: "libra-full",
    name: "Libra Full",
    zhName: "å¤©ç§¤åº§ Â· å…¨èº«",
    Background: LibraFullBackground,
  },
  scorpio: {
    id: "scorpio-full",
    name: "Scorpio Full",
    zhName: "å¤©èŽåº§ Â· å…¨èº«",
    Background: ScorpioFullBackground,
  },
  sagittarius: {
    id: "sagittarius-full",
    name: "Sagittarius Full",
    zhName: "å°„æ‰‹åº§ Â· å…¨èº«",
    Background: SagittariusFullBackground,
  },
  capricorn: {
    id: "capricorn-full",
    name: "Capricorn Full",
    zhName: "æ‘©ç¾¯åº§ Â· å…¨èº«",
    Background: CapricornFullBackground,
  },
  aquarius: {
    id: "aquarius-full",
    name: "Aquarius Full",
    zhName: "æ°´ç“¶åº§ Â· å…¨èº«",
    Background: AquariusFullBackground,
  },
  pisces: {
    id: "pisces-full",
    name: "Pisces Full",
    zhName: "åŒé±¼åº§ Â· å…¨èº«",
    Background: PiscesFullBackground,
  },
}

export const BACKGROUND_VARIANTS: readonly BackgroundEntry[] =
  ZODIAC_VARIANTS.flatMap((entry): BackgroundEntry[] => {
    const fullEntry = FULL_BODY_BY_ZODIAC[entry.id]
    return fullEntry ? [entry, fullEntry] : [entry]
  })

export const ZODIAC_BY_ID: Record<ZodiacId, ZodiacEntry> = Object.fromEntries(
  ZODIAC_VARIANTS.map((entry) => [entry.id, entry])
) as Record<ZodiacId, ZodiacEntry>

export const BACKGROUND_BY_ID: Record<BackgroundId, BackgroundEntry> =
  Object.fromEntries(
    BACKGROUND_VARIANTS.map((entry) => [entry.id, entry])
  ) as Record<BackgroundId, BackgroundEntry>

export const IMAGE_FILTER_OPTIONS: ReadonlyArray<{
  id: ImageFilterPreset
  label: string
}> = [
  { id: "none", label: "None" },
  { id: "vibrant-darkness", label: "Vibrant Darkness" },
  { id: "moon-light", label: "Moon Light" },
  { id: "overcast", label: "Overcast" },
]
