import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AuthCard } from "@NamelessLiberty/carina"
import { AuthHeader } from "@NamelessLiberty/carina"
import { AuthFooterLink } from "@NamelessLiberty/carina"
import { LoginForm } from "@NamelessLiberty/carina"
import { LanguageSelector } from "@NamelessLiberty/carina"
import { isAccountCreationAllowed } from "@/config/enabled-apps-server"

export const metadata: Metadata = {
  title: "Carina | Auth > Login",
  description: "Carina Account Login",
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login")
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
          <LoginForm
            header={
              <AuthHeader
                title={t("welcomeBack")}
                description={t("loginToIris")}
              />
            }
            footer={
              allowRegistration ? (
                <AuthFooterLink
                  promptText={t("dontHaveAccount")}
                  linkText={t("signUp")}
                  href="/carina/auth/register"
                />
              ) : undefined
            }
          />
        </AuthCard>
      </div>
    </main>
  )
}
