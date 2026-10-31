import type { MetadataRoute } from "next";
import { DEFAULT_GAME, GAMES } from "@/lib/games";
import { SITE_URL } from "@/lib/site";

// Every public page that exists at build time. Profiles (/u/<name>) are found through links;
// /following is personal, so it's left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const games = GAMES.map((g) => ({
    url: g.id === DEFAULT_GAME.id ? `${SITE_URL}/` : `${SITE_URL}/${g.id}`,
    changeFrequency: "daily" as const,
    priority: g.id === DEFAULT_GAME.id ? 1 : 0.8,
  }));
  const pages = ["/players", "/privacy", "/terms"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
  return [...games, ...pages];
}
