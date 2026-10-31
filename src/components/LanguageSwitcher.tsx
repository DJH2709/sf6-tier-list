"use client";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALES, LOCALE_NAMES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  return (
    <label className="flex h-9 items-center gap-2 text-sm text-ink-400">
      <Globe size={16} strokeWidth={1.5} aria-hidden />
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(e) => {
          if (!isLocale(e.target.value)) return;
          setLocale(e.target.value);
          // Server-rendered bits (page title, link previews) pick the new language up on refresh.
          router.refresh();
        }}
        className="h-8 rounded-md border border-line-strong bg-ink-800 px-2 text-sm text-ink-100"
      >
        {LOCALES.map((l) => <option key={l} value={l} lang={l}>{LOCALE_NAMES[l]}</option>)}
      </select>
    </label>
  );
}
