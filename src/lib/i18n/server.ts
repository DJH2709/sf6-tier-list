import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, localeFromHeader, translator, type Locale } from "./config";

// The language someone picked in the switcher, otherwise their browser's language.
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  try {
    return localeFromHeader((await headers()).get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getT() {
  return translator(await getLocale());
}
