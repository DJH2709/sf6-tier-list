"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME } from "@/lib/site";
import AccountBar, { type useAccount } from "./Account";
import LanguageSwitcher from "./LanguageSwitcher";

type Props = { account: ReturnType<typeof useAccount>; back?: boolean };

// Wordmark on the left, language and account on the right. On phones the account row has
// its own line with its height reserved, so nothing below moves when the session loads.
export default function SiteHeader({ account, back }: Props) {
  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-2.5 sm:flex sm:min-h-14 sm:items-start sm:justify-between">
      <Link href="/" className="flex h-9 shrink-0 items-center gap-2 text-base font-medium tracking-tight text-ink-100">
        {back && <ArrowLeft size={16} strokeWidth={1.5} className="text-ink-400" aria-hidden />}
        {SITE_NAME}
      </Link>
      <div className="contents sm:flex sm:items-start sm:gap-4">
        <LanguageSwitcher />
        <div className="col-span-2 flex min-h-9 justify-end">
          <AccountBar account={account} />
        </div>
      </div>
    </header>
  );
}
