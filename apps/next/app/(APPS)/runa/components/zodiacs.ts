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
} from "../../../../components/reactive-backgrounds"
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
} from "../../../../components/reactive-icons"

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
    zhName: "白羊座",
    Background: AriesBackground,
    Icon: AriesIcon,
  },
  {
    id: "taurus",
    name: "Taurus",
    zhName: "金牛座",
    Background: TaurusBackground,
    Icon: TaurusIcon,
  },
  {
    id: "gemini",
    name: "Gemini",
    zhName: "双子座",
    Background: GeminiBackground,
    Icon: GeminiIcon,
  },
  {
    id: "cancer",
    name: "Cancer",
    zhName: "巨蟹座",
    Background: CancerBackground,
    Icon: CancerIcon,
  },
  {
    id: "leo",
    name: "Leo",
    zhName: "狮子座",
    Background: LeoBackground,
    Icon: LeoIcon,
  },
  {
    id: "virgo",
    name: "Virgo",
    zhName: "处女座",
    Background: VirgoBackground,
    Icon: VirgoIcon,
  },
  {
    id: "libra",
    name: "Libra",
    zhName: "天秤座",
    Background: LibraBackground,
    Icon: LibraIcon,
  },
  {
    id: "scorpio",
    name: "Scorpio",
    zhName: "天蝎座",
    Background: ScorpioBackground,
    Icon: ScorpioIcon,
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    zhName: "射手座",
    Background: SagittariusBackground,
    Icon: SagittariusIcon,
  },
  {
    id: "capricorn",
    name: "Capricorn",
    zhName: "摩羯座",
    Background: CapricornBackground,
    Icon: CapricornIcon,
  },
  {
    id: "aquarius",
    name: "Aquarius",
    zhName: "水瓶座",
    Background: AquariusBackground,
    Icon: AquariusIcon,
  },
  {
    id: "pisces",
    name: "Pisces",
    zhName: "双鱼座",
    Background: PiscesBackground,
    Icon: PiscesIcon,
  },
] as const

const FULL_BODY_BY_ZODIAC: Partial<Record<ZodiacId, BackgroundEntry>> = {
  aries: {
    id: "aries-full",
    name: "Aries Full",
    zhName: "白羊座 · 全身",
    Background: AriesFullBackground,
  },
  taurus: {
    id: "taurus-full",
    name: "Taurus Full",
    zhName: "金牛座 · 全身",
    Background: TaurusFullBackground,
  },
  gemini: {
    id: "gemini-full",
    name: "Gemini Full",
    zhName: "双子座 · 全身",
    Background: GeminiFullBackground,
  },
  cancer: {
    id: "cancer-full",
    name: "Cancer Full",
    zhName: "巨蟹座 · 全身",
    Background: CancerFullBackground,
  },
  leo: {
    id: "leo-full",
    name: "Leo Full",
    zhName: "狮子座 · 全身",
    Background: LeoFullBackground,
  },
  virgo: {
    id: "virgo-full",
    name: "Virgo Full",
    zhName: "处女座 · 全身",
    Background: VirgoFullBackground,
  },
  libra: {
    id: "libra-full",
    name: "Libra Full",
    zhName: "天秤座 · 全身",
    Background: LibraFullBackground,
  },
  scorpio: {
    id: "scorpio-full",
    name: "Scorpio Full",
    zhName: "天蝎座 · 全身",
    Background: ScorpioFullBackground,
  },
  sagittarius: {
    id: "sagittarius-full",
    name: "Sagittarius Full",
    zhName: "射手座 · 全身",
    Background: SagittariusFullBackground,
  },
  capricorn: {
    id: "capricorn-full",
    name: "Capricorn Full",
    zhName: "摩羯座 · 全身",
    Background: CapricornFullBackground,
  },
  aquarius: {
    id: "aquarius-full",
    name: "Aquarius Full",
    zhName: "水瓶座 · 全身",
    Background: AquariusFullBackground,
  },
  pisces: {
    id: "pisces-full",
    name: "Pisces Full",
    zhName: "双鱼座 · 全身",
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
