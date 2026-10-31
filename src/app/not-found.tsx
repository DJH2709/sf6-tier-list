import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-black tracking-tight">{t("page.notFoundTitle")}</h1>
      <p className="text-neutral-400">{t("page.notFoundBody")}</p>
      <Link href="/" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500">
        {t("page.home")}
      </Link>
    </main>
  );
}
