import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

// Shared frame for the privacy notice and the terms. Both are written in English only for
// now, so the text is plain JSX rather than translated strings.
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl space-y-8 px-4 pb-8 pt-2">
      <nav className="flex min-h-14 items-center" aria-label="Home">
        <Link href="/" className="flex h-9 items-center gap-2 text-base font-medium tracking-tight text-ink-100">
          <ArrowLeft size={16} strokeWidth={1.5} className="text-ink-400" aria-hidden />
          {SITE_NAME}
        </Link>
      </nav>
      <main className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
        <p className="font-mono text-xs text-ink-400">Last updated {updated}</p>
      </header>
      <article className="space-y-6 leading-6 text-ink-300 [&_a]:text-ink-100 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-ink-100 [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </article>
      </main>
      <footer className="flex gap-4 border-t border-line pt-6 text-sm text-ink-400">
        <Link href="/privacy" className="flex h-6 items-center hover:text-ink-100">Privacy</Link>
        <Link href="/terms" className="flex h-6 items-center hover:text-ink-100">Terms</Link>
        <Link href="/" className="flex h-6 items-center hover:text-ink-100">Home</Link>
      </footer>
    </div>
  );
}
