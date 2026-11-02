// Turns a band's averages into tiers relative to each other.
//
// Why: when players disagree, every average drifts toward 3, so rounding put nearly the whole
// roster in B and C and left S and D empty. Ranking the averages against each other spreads
// them back out: a character goes in S because the band rates it clearly above the rest of the
// roster, not because its average happens to round to 5. The real average is still shown on
// each tile, so nothing is hidden.

export type Scored = { item_id: string; avg_score: number; votes: number };

// Characters placed by only a few lists get pulled toward the band's middle, as if PRIOR more
// lists had put them at the band average. Stops one person's lone S from topping the band in
// games where lists only place part of the roster (Clash Royale places 30 of 184).
export const PRIOR = 2;

// When the community genuinely rates everyone about the same, the averages barely differ. Below
// this spread we stop stretching, so near-identical averages stay together in B rather than
// being blown up into S and D over a few hundredths of a point.
export const MIN_SPREAD = 0.25;

// Cut-offs in standard deviations from the band's middle. On a bell-shaped spread that is
// roughly S 12%, A 23%, B 31%, C 23%, D 12%, but gaps decide: a runaway favourite can sit alone in S.
export const CUTS = { S: 1.2, A: 0.4, C: -0.4, D: -1.2 };

export function tierFromZ(z: number): number {
  if (z >= CUTS.S) return 5;
  if (z >= CUTS.A) return 4;
  if (z > CUTS.C) return 3;
  if (z > CUTS.D) return 2;
  return 1;
}

// Returns each character's tier (5 = S ... 1 = D), strongest first.
export function relativeTiers(rows: Scored[]): Record<string, number> {
  if (rows.length === 0) return {};
  const totalVotes = rows.reduce((s, r) => s + r.votes, 0);
  const mean = rows.reduce((s, r) => s + r.avg_score * r.votes, 0) / totalVotes;
  const adjusted = rows.map((r) => ({
    id: r.item_id,
    score: (r.avg_score * r.votes + mean * PRIOR) / (r.votes + PRIOR),
  }));
  const centre = adjusted.reduce((s, r) => s + r.score, 0) / adjusted.length;
  const sd = Math.sqrt(adjusted.reduce((s, r) => s + (r.score - centre) ** 2, 0) / adjusted.length);
  const spread = Math.max(sd, MIN_SPREAD);
  adjusted.sort((a, b) => b.score - a.score);
  return Object.fromEntries(adjusted.map((r) => [r.id, tierFromZ((r.score - centre) / spread)]));
}
