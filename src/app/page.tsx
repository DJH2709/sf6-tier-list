"use client";
import { useState } from "react";
import MakeList from "@/components/MakeList";
import Results from "@/components/Results";
import { configFound, demoMode, missingConfig } from "@/lib/store";
import { CURRENT_PATCH } from "@/lib/sf6";
import Link from "next/link";
import AccountBar, { PickUsername, useAccount } from "@/components/Account";

const STEPS = [
  { title: "Pick your rank", text: "Tell us where you play, from Rookie to Legend." },
  { title: "Rank the roster", text: "Place every character from S to D. Takes about two minutes." },
  { title: "Compare by rank", text: "See how Beginner and Elite players disagree about the same cast." },
];

export default function Home() {
  const [tab, setTab] = useState<"make" | "results">("results");
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const account = useAccount();

  function open(next: "make" | "results") {
    setTab(next);
    document.getElementById("app")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen">
      {missingConfig ? (
        <p className="bg-red-900 px-4 py-3 text-sm text-red-100">
          Setup problem: this deployment has no Supabase settings, so votes can&apos;t be saved.
          <br />
          NEXT_PUBLIC_SUPABASE_URL: {configFound.url ? "found" : "missing"}. Supabase key
          (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY): {configFound.key ? "found" : "missing"}.
          <br />
          Fix the missing one in Vercel for this environment, then redeploy.
        </p>
      ) : (
        demoMode && (
          <p className="bg-amber-950 px-4 py-2 text-center text-sm text-amber-300">
            Demo mode: votes are saved in this browser only.
          </p>
        )
      )}

      <header className="border-b border-neutral-800 bg-gradient-to-b from-amber-500/10 to-transparent">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-4 pt-4">
          <span className="pt-2 text-sm font-black tracking-tight">SF6 TIER LIST</span>
          <AccountBar account={account} />
        </div>
        <div className="mx-auto max-w-5xl space-y-8 px-4 pb-12 pt-8 sm:pb-16">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
              Street Fighter 6 · Patch {CURRENT_PATCH}
            </p>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              The tier list that changes with your rank
            </h1>
            <p className="max-w-xl text-lg text-neutral-300">
              Pro tier lists tell you what wins at the top. This one shows how players at your level rate the
              cast, voted by the community and split by rank.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => open("make")} className="rounded-lg bg-amber-400 px-5 py-3 font-semibold text-neutral-950 hover:bg-amber-300">
              Make your tier list
            </button>
            <button onClick={() => open("results")} className="rounded-lg border border-neutral-700 px-5 py-3 font-semibold hover:border-neutral-500">
              See community results
            </button>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                <span className="text-sm font-bold text-amber-400">{i + 1}</span>
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm text-neutral-400">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main id="app" className="mx-auto max-w-5xl scroll-mt-4 space-y-6 px-4 py-10">
        {account.signedIn && account.loaded && !account.profile && account.session && (
          <PickUsername session={account.session} onDone={account.setProfile} />
        )}
        {submitted && account.profile && (
          <p className="rounded-xl border border-lime-400/40 bg-lime-400/5 p-4 text-sm">
            Your list is on your profile.{" "}
            <Link href={`/u/${account.profile.username}`} className="font-semibold text-lime-300 underline">
              View and share it
            </Link>
          </p>
        )}
        {submitted && account.loaded && !account.signedIn && !demoMode && (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
            Want friends to see your list? Sign in with Discord at the top. Your vote comes with you.
          </p>
        )}
        <nav className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
          {(["results", "make"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${tab === t ? "bg-amber-400 text-neutral-950" : "text-neutral-300 hover:text-white"}`}
            >
              {t === "results" ? "Community results" : "Make your list"}
            </button>
          ))}
        </nav>
        {tab === "results" ? (
          <Results refreshKey={refreshKey} onMakeList={() => setTab("make")} />
        ) : (
          <MakeList onSubmitted={() => { setRefreshKey((k) => k + 1); setSubmitted(true); setTab("results"); }} />
        )}
      </main>

      <footer className="border-t border-neutral-800 px-4 py-8 text-center text-xs text-neutral-500">
        A fan project. Not affiliated with or endorsed by Capcom. Street Fighter is a trademark of Capcom.
      </footer>
    </div>
  );
}
