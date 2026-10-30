import { ImageResponse } from "next/og";
import { CHARACTERS, TIERS } from "@/lib/sf6";
import { getListsFor, getProfileByUsername } from "@/lib/profiles";

// The picture Discord, X and others show when someone shares a profile link.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Street Fighter 6 tier list";

// Same as TIER_COLOURS in TierRows.tsx, as hex because this isn't rendered with Tailwind.
const TIER_HEX: Record<string, string> = {
  S: "#f43f5e", A: "#fb923c", B: "#fcd34d", C: "#a3e635", D: "#38bdf8",
};

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username).catch(() => null);
  // Signed out, so only public lists come back. Newest first.
  const list = profile ? (await getListsFor(profile.id).catch(() => []))[0] : undefined;
  const name = profile ? profile.display_name || profile.username : "SF6 Community Tier List";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0a", color: "#f5f5f5", padding: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>{profile ? `${name}'s tier list` : name}</div>
          <div style={{ display: "flex", fontSize: 26, color: "#34d399", fontWeight: 700 }}>SF6 TIER LIST</div>
        </div>
        {list ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #262626", borderRadius: 16, overflow: "hidden" }}>
            {TIERS.map((tier) => {
              const names = CHARACTERS.filter((c) => list.placements[c.id] === tier.score).map((c) => c.name);
              return (
                <div key={tier.label} style={{ display: "flex", flex: 1, borderBottom: tier.score > 1 ? "2px solid #262626" : "none" }}>
                  <div style={{ display: "flex", width: 80, alignItems: "center", justifyContent: "center", background: TIER_HEX[tier.label], color: "#0a0a0a", fontSize: 40, fontWeight: 900 }}>
                    {tier.label}
                  </div>
                  <div style={{ display: "flex", flex: 1, flexWrap: "wrap", alignContent: "center", gap: 8, padding: "8px 12px", overflow: "hidden" }}>
                    {names.map((n) => (
                      <div key={n} style={{ display: "flex", fontSize: 20, background: "#262626", borderRadius: 6, padding: "4px 10px" }}>{n}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", fontSize: 32, color: "#a3a3a3" }}>
            Street Fighter 6 tier lists voted by the community, split by rank.
          </div>
        )}
      </div>
    ),
    size,
  );
}
