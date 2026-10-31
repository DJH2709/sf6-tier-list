"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";
import { BTN_GHOST, BTN_MD, BTN_PRIMARY } from "@/components/ui";

// Shown when a page throws. The error itself is never printed: it may name a table or a
// setting, and Next.js already strips server-side details. It goes to the console instead.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-medium tracking-tight">{t("page.errorTitle")}</h1>
      <p className="leading-6 text-ink-300">{t("page.errorBody")}</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className={`${BTN_PRIMARY} ${BTN_MD}`}>
          {t("page.retry")}
        </button>
        <Link href="/" className={`${BTN_GHOST} ${BTN_MD}`}>
          {t("page.home")}
        </Link>
      </div>
    </main>
  );
}
