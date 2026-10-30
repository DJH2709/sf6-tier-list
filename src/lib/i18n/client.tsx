"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { HTML_LANG, LOCALE_COOKIE, translator, type Locale, type Translate } from "./config";
import { characterName } from "@/locales/characters";

type I18n = { locale: Locale; t: Translate; setLocale: (l: Locale) => void; nameOf: (id: string) => string };
const Context = createContext<I18n | null>(null);

export function I18nProvider({ initial, children }: { initial: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(initial);
  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = HTML_LANG[next];
    setLocaleState(next);
  }, []);
  const value = useMemo(
    () => ({ locale, setLocale, t: translator(locale), nameOf: (id: string) => characterName(id, locale) }),
    [locale, setLocale],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("useI18n needs <I18nProvider> above it (see app/layout.tsx).");
  return value;
}
