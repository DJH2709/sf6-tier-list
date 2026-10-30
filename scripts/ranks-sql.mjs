// Writes every game's rank ladder from src/lib/games.json into supabase/005_games.sql,
// between the "ranks:start" and "ranks:end" lines. Run after changing a ladder, then run
// the changed insert in the Supabase SQL editor. `npm test` fails if the two drift apart.
import { readFileSync, writeFileSync } from "node:fs";

export const SQL_FILE = "supabase/005_games.sql";

export function ranksSql() {
  const { games } = JSON.parse(readFileSync("src/lib/games.json", "utf8"));
  const q = (s) => `'${s.replace(/'/g, "''")}'`;
  const rows = games.flatMap((g) =>
    g.ranks.map((r) => `  (${q(g.id)}, ${q(r.id)}, ${q(r.band)}, ${r.needsProof ? "true" : "false"})`),
  );
  return `insert into game_ranks (game, rank_id, band, needs_proof) values\n${rows.join(",\n")}\non conflict (game, rank_id) do update set band = excluded.band, needs_proof = excluded.needs_proof;`;
}

export function withRanks(sql) {
  return sql.replace(/(-- ranks:start\n)[\s\S]*?(-- ranks:end)/, `$1${ranksSql()}\n$2`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(SQL_FILE, withRanks(readFileSync(SQL_FILE, "utf8")));
  console.log(`ranks written to ${SQL_FILE}`);
}
