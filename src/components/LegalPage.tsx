import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

// Shared frame for the privacy notice and the terms. Both are written in English only for
// now, so the text is plain JSX rather than translated strings.
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-8 px-4 py-8">
      <Link href="/" className="text-sm font-black tracking-tight">← {SITE_NAME}</Link>
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-sm text-neutral-400">Last updated {updated}</p>
      </header>
      <article className="space-y-6 text-neutral-300 [&_a]:text-emerald-300 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-neutral-100 [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </article>
      <footer className="flex gap-4 border-t border-neutral-800 pt-6 text-sm text-neutral-500">
        <Link href="/privacy" className="hover:text-neutral-300">Privacy</Link>
        <Link href="/terms" className="hover:text-neutral-300">Terms</Link>
        <Link href="/" className="hover:text-neutral-300">Home</Link>
      </footer>
    </div>
  );
}
