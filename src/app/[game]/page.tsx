import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import GameHome from "@/components/GameHome";
import { DEFAULT_GAME, GAMES, getGame } from "@/lib/games";
import { gameName } from "@/lib/i18n/games";
import { getT } from "@/lib/i18n/server";

type Params = { params: Promise<{ game: string }> };

// One page per game, built at deploy time. Any other address is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return GAMES.map((g) => ({ game: g.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = getGame((await params).game);
  if (!found) return {};
  const t = await getT();
  const game = gameName(found, t);
  return { title: t("site.gameTitle", { game }), description: t("site.gameDescription", { game }) };
}

export default async function GamePage({ params }: Params) {
  const { game: id } = await params;
  // The default game lives at the home page, so there's one address to share.
  if (id === DEFAULT_GAME.id) redirect("/");
  if (!getGame(id)) notFound();
  return <GameHome gameId={id} />;
}
