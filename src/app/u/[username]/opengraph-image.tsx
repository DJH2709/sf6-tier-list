import { ImageResponse } from "next/og";
import { DEFAULT_GAME, getGame, TIERS } from "@/lib/games";
import { getListsFor, getProfileByUsername } from "@/lib/profiles";
import { OG_SIZE, OgCard } from "@/components/og";

// The picture Discord, X and others show when someone shares a profile link.
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Fighting game tier list";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username).catch(() => null);
  // Signed out, so only public lists come back. Newest first.
  const list = profile ? (await getListsFor(profile.id).catch(() => []))[0] : undefined;
  const game = (list && getGame(list.game)) || DEFAULT_GAME;
  const name = profile ? profile.display_name || profile.username : "Fighting game tier lists";
  const rows = list
    ? Object.fromEntries(TIERS.map((tier) => [tier.score, game.characters.filter((c) => list.placements[c.id] === tier.score).map((c) => c.name)]))
    : undefined;

  return new ImageResponse(
    <OgCard
      title={profile ? `${name}'s tier list` : name}
      subtitle={list ? `${game.name} · Patch ${list.patch}` : "Voted by the community, split by rank"}
      game={game}
      rows={rows}
    />,
    size,
  );
}
