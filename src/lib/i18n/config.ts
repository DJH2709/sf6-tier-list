import en, { type MessageKey, type Messages } from "@/locales/en";
import ja from "@/locales/ja";
import ko from "@/locales/ko";
import zh from "@/locales/zh";
import es from "@/locales/es";

// To add a language: create src/locales/<code>.ts typed as Messages, then add it here.
export const LOCALES = ["en", "es", "ja", "ko", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

// Each language names itself, so people can find theirs whatever the page is showing.
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", es: "Español", ja: "日本語", ko: "한국어", zh: "简体中文" };
// The value for <html lang>, which picks the right CJK glyphs in system fonts.
export const HTML_LANG: Record<Locale, string> = { en: "en", es: "es", ja: "ja", ko: "ko", zh: "zh-Hans" };

const MESSAGES: Record<Locale, Messages> = { en, es, ja, ko, zh };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Picks a language from an Accept-Language header. Traditional Chinese (Taiwan, Hong Kong)
// gets English rather than Simplified Chinese until a zh-Hant file exists.
export function localeFromHeader(header: string | null | undefined): Locale {
  for (const part of (header ?? "").split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag.startsWith("zh")) {
      if (/hant|-tw|-hk|-mo/.test(tag)) continue;
      return "zh";
    }
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

// Missing translations fall back to English, so a new string never shows up blank.
export function translator(locale: Locale): Translate {
  const messages = MESSAGES[locale];
  return (key, vars) => {
    // ?? not ||: an English string that is deliberately empty (site.machineTranslated) must stay empty, not show its key.
    const text = messages[key] ?? en[key] ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text;
  };
}

// Library code throws errors whose message is a key, e.g. new Error("error.usernameTaken").
// Anything else (a Supabase message) is shown as it is.
export function errorText(e: unknown, t: Translate, fallback: MessageKey = "make.error") {
  const message = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  if (!message) return t(fallback);
  return message in en ? t(message as MessageKey) : message;
}
