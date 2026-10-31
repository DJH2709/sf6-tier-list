// The one connection to Supabase, shared by everything in src/lib. Without the settings the
// client is null and the site runs in demo mode.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase now issues sb_publishable_ keys; its Connect panel names the variable
// ..._PUBLISHABLE_DEFAULT_KEY. Older projects still have an anon key.
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

// Without Supabase settings the site runs in demo mode, saving to this browser only.
export const demoMode = !supabase;
// Shown on the page so a setup problem says which setting the build didn't see.
export const configFound = { url: !!url, key: !!key };
// Vercel sets NEXT_PUBLIC_VERCEL_ENV. A deployed site with no Supabase settings must not
// quietly fall back to demo mode, or votes vanish without anyone noticing.
export const missingConfig = demoMode && !!process.env.NEXT_PUBLIC_VERCEL_ENV;

// Turns a database error into one that says what to fix.
export function explain(error: { message: string; code?: string }) {
  // "Failed to fetch" means the browser never reached Supabase: a wrong URL setting,
  // a paused project or an ad blocker. Say which address it tried.
  if (/fetch/i.test(error.message)) {
    return new Error(`Couldn't reach Supabase at ${url}. Check the URL setting in Vercel, and try with ad blockers off.`);
  }
  // save_list refuses a rank that isn't on the game's ladder in game_ranks.
  if (error.code === "22023") {
    return new Error("The database doesn't know that rank yet. Run the latest file in supabase/ in the Supabase SQL editor (see README).");
  }
  // Missing column, permission or function: the site is ahead of the database.
  if (error.code === "42703" || error.code === "42501" || error.code === "PGRST202") {
    return new Error("The database is behind the site. Run the latest file in supabase/ in the Supabase SQL editor (see README).");
  }
  return error;
}
