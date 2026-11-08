import type { Metadata } from "next";
import GameHome from "@/components/GameHome";
import { DEFAULT_GAME, GAMES } from "@/lib/games";
import { getT } from "@/lib/i18n/server";
import { SITE_NAME } from "@/lib/site";
import { JsonLd, pageMeta, websiteSchema } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  // The home page shows the first game's list, but it is the front door for every game,
  // so search results name the whole site rather than one game.
  // The layout's title template skips a page in its own folder, so add the name here.
  return pageMeta("/", `${t("site.homeTitle")} · ${SITE_NAME}`, t("site.homeDescription", { count: GAMES.length }));
}

export default function Home() {
  return (
    <>
      <JsonLd data={websiteSchema} />
      <GameHome gameId={DEFAULT_GAME.id} />
    </>
  );
}
