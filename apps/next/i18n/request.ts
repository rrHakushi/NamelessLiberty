import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { defaultLocale, locales, type Locale } from "./routing"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as
    | Locale
    | undefined
  const locale: Locale =
    cookieLocale && locales.includes(cookieLocale)
      ? cookieLocale
      : defaultLocale

  const baseMessages = (await import(`../locales/${locale}.json`)).default
  // @app:borealis:start
  const borealisMessages = (
    await import(`@NamelessLiberty/borealis/locales/${locale}.json`)
  ).default
  // @app:borealis:end
  // @app:tesseract:start
  const tesseractMessages = (
    await import(`@NamelessLiberty/tesseract/locales/${locale}.json`)
  ).default
  // @app:tesseract:end
  // @app:reliquary:start
  const reliquaryMessages = (
    await import(`@NamelessLiberty/reliquary/locales/${locale}.json`)
  ).default
  // @app:reliquary:end

  return {
    locale,
    messages: {
      ...baseMessages,
      // @app:borealis:start
      ...borealisMessages,
      // @app:borealis:end
      // @app:tesseract:start
      ...tesseractMessages,
      // @app:tesseract:end
      // @app:reliquary:start
      ...reliquaryMessages,
      // @app:reliquary:end
    },
  }
})
