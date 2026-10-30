"use client";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  return (
    <label className="flex items-center gap-1.5 text-sm text-neutral-400">
      <span aria-hidden>🌐</span>
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(e) => {
          if (!isLocale(e.target.value)) return;
          setLocale(e.target.value);
          // Server-rendered bits (page title, link previews) pick the new language up on refresh.
          router.refresh();
        }}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-200"
      >
        {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LOCALE_NAMES[l]}</option>)}
      </select>
    </label>
  );
}
