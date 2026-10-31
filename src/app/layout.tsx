import type { Metadata } from "next";
import "./globals.css";
import { HTML_LANG } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    // Page titles get " · LobbyTier" added, e.g. "Tekken 8 Community Tier List · LobbyTier".
    title: { default: `${SITE_NAME} · ${t("site.title")}`, template: `%s · ${SITE_NAME}` },
    description: t("site.description"),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={HTML_LANG[locale]}>
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-emerald-500/30">
        <I18nProvider initial={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
