"use client";
import { useState } from "react";
import MakeList from "@/components/MakeList";
import Results from "@/components/Results";
import { configFound, demoMode, missingConfig } from "@/lib/store";
import { CURRENT_PATCH } from "@/lib/sf6";

export default function Home() {
  const [tab, setTab] = useState<"make" | "results">("results");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">SF6 Community Tier List</h1>
        <p className="text-neutral-400">
          How players at each rank see the Street Fighter 6 roster. Patch {CURRENT_PATCH}.
        </p>
        {missingConfig ? (
          <p className="rounded bg-red-900 p-3 text-sm text-red-100">
            Setup problem: this deployment has no Supabase settings, so votes can&apos;t be saved.
            <br />
            NEXT_PUBLIC_SUPABASE_URL: {configFound.url ? "found" : "missing"}. Supabase key
            (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY): {configFound.key ? "found" : "missing"}.
            <br />
            Fix the missing one in Vercel for this environment, then redeploy.
          </p>
        ) : (
          demoMode && <p className="text-sm text-yellow-400">Demo mode: votes are saved in this browser only.</p>
        )}
      </header>
      <nav className="flex gap-2">
        <button onClick={() => setTab("results")} className={`rounded px-4 py-2 ${tab === "results" ? "bg-white text-neutral-900" : "bg-neutral-800"}`}>
          Community results
        </button>
        <button onClick={() => setTab("make")} className={`rounded px-4 py-2 ${tab === "make" ? "bg-white text-neutral-900" : "bg-neutral-800"}`}>
          Make your list
        </button>
      </nav>
      {tab === "results" ? (
        <Results refreshKey={refreshKey} />
      ) : (
        <MakeList onSubmitted={() => { setRefreshKey((k) => k + 1); setTab("results"); }} />
      )}
    </main>
  );
}
