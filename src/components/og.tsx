import { TIERS, type Game } from "@/lib/games";
import { SITE_NAME } from "@/lib/site";

// Shared drawing for link previews (1200×630), rendered by next/og without Tailwind, so
// colours are hex. Same ink neutrals and tier colours as the site.
export const OG_SIZE = { width: 1200, height: 630 };
export const TIER_HEX: Record<string, string> = {
  S: "#f43f5e", A: "#fb923c", B: "#fcd34d", C: "#a3e635", D: "#38bdf8",
};
const INK = { page: "#0b0d14", card: "#11141c", raised: "#1a1e28", line: "#262b38", text: "#eef0f5", muted: "#a3a9b8" };

type Props = {
  title: string;
  subtitle: string;
  game: Game;
  // Character names per tier score. Empty means a plain example of the roster.
  rows?: Record<number, string[]>;
};

export function OgCard({ title, subtitle, game, rows }: Props) {
  const names = (score: number) =>
    rows ? rows[score] ?? [] : game.characters.filter((_, i) => i % 5 === 5 - score).slice(0, 5).map((c) => c.name);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: INK.page, color: INK.text, padding: 48, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 500, letterSpacing: -1 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 24, color: INK.muted }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 500 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 30 }}>
            <div style={{ height: 6, width: 30, borderRadius: 2, background: TIER_HEX.S }} />
            <div style={{ height: 6, width: 22, borderRadius: 2, background: TIER_HEX.A }} />
            <div style={{ height: 6, width: 14, borderRadius: 2, background: TIER_HEX.B }} />
          </div>
          {SITE_NAME}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `2px solid ${INK.line}`, borderRadius: 16, overflow: "hidden", background: INK.card }}>
        {TIERS.map((tier) => (
          <div key={tier.label} style={{ display: "flex", flex: 1, borderBottom: tier.score > 1 ? `2px solid ${INK.line}` : "none" }}>
            <div style={{ display: "flex", width: 80, alignItems: "center", justifyContent: "center", background: TIER_HEX[tier.label], color: INK.page, fontSize: 36, fontWeight: 600 }}>
              {tier.label}
            </div>
            <div style={{ display: "flex", flex: 1, flexWrap: "wrap", alignContent: "center", gap: 8, padding: "8px 12px", overflow: "hidden" }}>
              {names(tier.score).map((n) => (
                <div key={n} style={{ display: "flex", fontSize: 20, background: INK.raised, border: `1px solid ${INK.line}`, borderRadius: 6, padding: "4px 10px" }}>{n}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!rows && (
        <div style={{ display: "flex", marginTop: 14, fontSize: 18, color: INK.muted }}>
          Example placements. The site shows the community&apos;s averages, split by the voters&apos; rank.
        </div>
      )}
    </div>
  );
}
