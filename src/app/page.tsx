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
  const [submitted, setSubmitted] = useState<{ isPublic: boolean; updated: boolean } | null>(null);
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
          <p className="bg-emerald-950 px-4 py-2 text-center text-sm text-emerald-300">
            Demo mode: votes are saved in this browser only.
          </p>
        )
      )}

      <header className="border-b border-neutral-800 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.16),transparent_60%)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 pt-4">
          <span className="text-sm font-black tracking-tight">SF6 TIER LIST</span>
          <AccountBar account={account} />
        </div>
        <div className="mx-auto max-w-3xl space-y-8 px-4 pb-14 pt-12 text-center sm:pb-20 sm:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
            Street Fighter 6 · Patch {CURRENT_PATCH}
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            The tier list that changes with your rank
          </h1>
          <p className="mx-auto max-w-xl text-lg text-neutral-300">
            Pro tier lists tell you what wins at the top. This one shows how players at your level rate the
            cast, voted by the community and split by rank.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => open("make")} className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-neutral-950 hover:bg-emerald-400">
              Make your tier list
            </button>
            <button onClick={() => open("results")} className="rounded-full border border-neutral-600 px-6 py-3 font-semibold hover:border-neutral-400">
              See community results
            </button>
          </div>
          <hr className="mx-auto w-16 border-neutral-700" />
          <ol className="grid gap-6 text-left sm:grid-cols-3 sm:text-center">
            {STEPS.map((step, i) => (
              <li key={step.title} className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">Step {i + 1}</span>
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
            {submitted.isPublic ? (
              <>
                Your list is on your profile.{" "}
                <Link href={`/u/${account.profile.username}`} className="font-semibold text-lime-300 underline">
                  View and share it
                </Link>
              </>
            ) : (
              "Saved. Your list is hidden from your profile, but it still counts in the community results."
            )}
          </p>
        )}
        {submitted && account.loaded && !account.signedIn && !demoMode && (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
            {submitted.updated ? "Updated." : "Saved."} Want friends to see your list? Sign in with Discord at the top. Your vote comes with you.
          </p>
        )}
        {submitted && demoMode && (
          <p className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-300">
            {submitted.updated ? "Updated" : "Saved"} in this browser. Open &quot;Make your list&quot; again to change it.
          </p>
        )}
        <nav className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900 p-1">
          {(["results", "make"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${tab === t ? "bg-emerald-500 text-neutral-950" : "text-neutral-300 hover:text-white"}`}
            >
              {t === "results" ? "Community results" : "Make your list"}
            </button>
          ))}
        </nav>
        {tab === "results" ? (
          <Results refreshKey={refreshKey} onMakeList={() => setTab("make")} />
        ) : (
          <MakeList
            profile={account.profile}
            onSubmitted={(r) => { setRefreshKey((k) => k + 1); setSubmitted(r); setTab("results"); }}
          />
        )}
      </main>

      <footer className="border-t border-neutral-800 px-4 py-8 text-center text-xs text-neutral-500">
        A fan project. Not affiliated with or endorsed by Capcom. Street Fighter is a trademark of Capcom.
      </footer>
    </div>
  );
}
