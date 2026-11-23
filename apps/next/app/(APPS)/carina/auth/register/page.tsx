import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AuthCard } from "@NamelessLiberty/carina"
import { AuthHeader } from "@NamelessLiberty/carina"
import { AuthFooterLink } from "@NamelessLiberty/carina"
import { RegisterForm } from "@NamelessLiberty/carina"
import { LanguageSelector } from "@NamelessLiberty/carina"
import { isAccountCreationAllowed } from "@/config/enabled-apps-server"

export const metadata: Metadata = {
  title: "Carina | Auth > Register",
  description: "Carina Account Register",
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register")
  const allowRegistration = isAccountCreationAllowed()

  return (
    <main className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background p-4 sm:p-6 md:p-10 lg:p-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--muted-foreground)_12%,transparent),transparent_55%)]"
      />
      <LanguageSelector variant="floating" />
      <div className="relative w-full max-w-md md:max-w-4xl lg:max-w-5xl">
        <AuthCard>
          {allowRegistration ? (
            <>
              <AuthHeader
                title={t("createCredentials")}
                description={t("createIrisProfile")}
              />
              <RegisterForm
                footer={
                  <AuthFooterLink
                    promptText={t("registeredProfile")}
                    linkText={t("signIn")}
                    href="/carina/auth/login"
                  />
                }
              />
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <AuthHeader
                title="Registration Disabled"
                description="Account creation is currently disabled by the server administrator."
              />
              <AuthFooterLink
                promptText={t("registeredProfile")}
                linkText={t("signIn")}
                href="/carina/auth/login"
              />
            </div>
          )}
        </AuthCard>
      </div>
    </main>
  )
}
