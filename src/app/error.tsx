"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/client";

// Shown when a page throws. The error itself is never printed: it may name a table or a
// setting, and Next.js already strips server-side details. It goes to the console instead.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => console.error(error), [error]);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-black tracking-tight">{t("page.errorTitle")}</h1>
      <p className="text-neutral-400">{t("page.errorBody")}</p>
      <div className="flex gap-3">
        <button type="button" onClick={reset} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500">
          {t("page.retry")}
        </button>
        <Link href="/" className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold hover:bg-neutral-800">
          {t("page.home")}
        </Link>
      </div>
    </main>
  );
}
