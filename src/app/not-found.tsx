import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { BTN_MD, BTN_PRIMARY } from "@/components/ui";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-medium tracking-tight">{t("page.notFoundTitle")}</h1>
      <p className="leading-6 text-ink-300">{t("page.notFoundBody")}</p>
      <Link href="/" className={`${BTN_PRIMARY} ${BTN_MD}`}>
        {t("page.home")}
      </Link>
    </main>
  );
}
