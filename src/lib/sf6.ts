// Street Fighter 6 game data. Check the roster against the latest DLC before launch.
export const GAME = "sf6";
export const CURRENT_PATCH = "2026-10";
// What the tier list ranks. Weapons or abilities tabs would add their own category.
export const CATEGORY = "characters";

export const CHARACTERS = [
  "Ryu", "Luke", "Jamie", "Chun-Li", "Guile", "Kimberly", "Juri", "Ken",
  "Blanka", "Dhalsim", "E. Honda", "Dee Jay", "Manon", "Marisa", "JP",
  "Zangief", "Lily", "Cammy", "Rashid", "A.K.I.", "Ed", "Akuma",
  "M. Bison", "Terry", "Mai", "Elena", "Sagat", "C. Viper", "Alex", "Ingrid",
].map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name }));

export const TIERS = [
  { label: "S", score: 5 },
  { label: "A", score: 4 },
  { label: "B", score: 3 },
  { label: "C", score: 2 },
  { label: "D", score: 1 },
] as const;

export type Band = "beginner" | "intermediate" | "advanced" | "elite";

export const BANDS: { id: Band; label: string }[] = [
  { id: "beginner", label: "Beginner (Rookie to Silver)" },
  { id: "intermediate", label: "Intermediate (Gold to Platinum)" },
  { id: "advanced", label: "Advanced (Diamond to High Master)" },
  { id: "elite", label: "Elite (Grand Master and up, proof required)" },
];

export const RANKS: { id: string; label: string; band: Band; needsProof?: boolean }[] = [
  { id: "rookie", label: "Rookie", band: "beginner" },
  { id: "iron", label: "Iron", band: "beginner" },
  { id: "bronze", label: "Bronze", band: "beginner" },
  { id: "silver", label: "Silver", band: "beginner" },
  { id: "gold", label: "Gold", band: "intermediate" },
  { id: "platinum", label: "Platinum", band: "intermediate" },
  { id: "diamond", label: "Diamond", band: "advanced" },
  { id: "master", label: "Master", band: "advanced" },
  { id: "high_master", label: "High Master", band: "advanced" },
  { id: "grand_master", label: "Grand Master", band: "elite", needsProof: true },
  { id: "ultimate_master", label: "Ultimate Master", band: "elite", needsProof: true },
  { id: "legend", label: "Legend", band: "elite", needsProof: true },
];

export type Verification = "none" | "pending" | "approved" | "rejected";

// Unproven top-rank lists count one band lower until checked.
export function effectiveBand(rankId: string, verification: Verification): Band {
  const rank = RANKS.find((r) => r.id === rankId);
  if (!rank) return "beginner";
  if (rank.needsProof && verification !== "approved") return "advanced";
  return rank.band;
}

// A band's results stay hidden until this many lists exist.
export const MIN_LISTS = Number(process.env.NEXT_PUBLIC_MIN_LISTS ?? 20);
