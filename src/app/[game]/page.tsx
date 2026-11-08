import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import GameHome from "@/components/GameHome";
import { DEFAULT_GAME, GAMES, getGame } from "@/lib/games";
import { gameName } from "@/lib/i18n/games";
import { getT } from "@/lib/i18n/server";
import { initialResults } from "@/lib/serverResults";
import { breadcrumbSchema, JsonLd, pageMeta } from "@/lib/seo";

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
  return pageMeta(`/${found.id}`, t("site.gameTitle", { game }), t("site.gameDescription", { game }));
}

export default async function GamePage({ params }: Params) {
  const { game: id } = await params;
  // The default game lives at the home page, so there's one address to share. Permanent (308),
  // so search engines move any ranking from /sf6 to the home page.
  if (id === DEFAULT_GAME.id) permanentRedirect("/");
  const found = getGame(id);
  if (!found) notFound();
  const t = await getT();
  return (
    <>
      <JsonLd data={breadcrumbSchema(gameName(found, t), `/${found.id}`, t("games.link"))} />
      <GameHome gameId={id} initialResults={await initialResults(found)} />
    </>
  );
}
