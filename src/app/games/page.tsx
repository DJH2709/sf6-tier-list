import type { Metadata } from "next";
import GamesView from "@/components/GamesView";
import { GAMES } from "@/lib/games";
import { getT } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return pageMeta("/games", t("games.metaTitle"), t("games.description", { count: GAMES.length }));
}

export default function GamesPage() {
  return <GamesView />;
}
