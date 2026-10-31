import type { Metadata } from "next";
import { geistMono, geistSans } from "./fonts";
import "./globals.css";
import { HTML_LANG } from "@/lib/i18n/config";
import { getLocale, getT } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    metadataBase: new URL(SITE_URL),
    // Page titles get " · LobbyTier" added, e.g. "Tekken 8 Community Tier List · LobbyTier".
    title: { default: `${SITE_NAME} · ${t("site.title")}`, template: `%s · ${SITE_NAME}` },
    description: t("site.description"),
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={HTML_LANG[locale]} className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-ink-900 text-ink-100 antialiased selection:bg-emerald-500/30">
        <I18nProvider initial={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
