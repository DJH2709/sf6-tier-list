import type { Metadata } from "next";
import GameHome from "@/components/GameHome";
import { DEFAULT_GAME } from "@/lib/games";
import { gameName } from "@/lib/i18n/games";
import { getT } from "@/lib/i18n/server";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const game = gameName(DEFAULT_GAME, t);
  // The layout's title template skips a page in its own folder, so add the name here.
  return { title: `${t("site.gameTitle", { game })} · ${SITE_NAME}`, description: t("site.gameDescription", { game }) };
}

export default function Home() {
  return <GameHome gameId={DEFAULT_GAME.id} />;
}
