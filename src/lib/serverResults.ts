// Community results read on the server, so the first HTML of a game page already carries the
// tier lists (search engines and link previews see real placements, not "0 lists").
// The browser still fetches fresh results after loading, so this copy can be a few minutes old.
import { unstable_cache } from "next/cache";
import { getGame, type Game } from "./games";
import { getResults, type BandResult } from "./store";
import { supabase } from "./supabase";

// Five minutes: one database read per game per five minutes, however many people or bots visit.
const REFRESH_SECONDS = 300;

const cached = unstable_cache(
  // Keyed by game id and patch (the arguments), so a new patch never serves the old one's results.
  async (id: string, patch: string) => getResults({ ...getGame(id)!, patch }),
  ["band_results"],
  { revalidate: REFRESH_SECONDS },
);

// Never fails the page: without Supabase (demo mode) or on any error, the page renders empty
// results and the browser fetches them as before.
export async function initialResults(game: Game): Promise<BandResult[]> {
  if (!supabase) return [];
  // A slow database must not hold the page: after 3 seconds, render without results.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timed out")), 3000); });
  try {
    return await Promise.race([cached(game.id, game.patch), timeout]);
  } catch (e) {
    console.error("Server-side results failed; the browser will fetch them instead.", e);
    return [];
  } finally {
    clearTimeout(timer);
  }
}
