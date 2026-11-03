import type { Metadata } from "next";
import GamesView from "@/components/GamesView";
import { GAMES } from "@/lib/games";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("games.metaTitle"), description: t("games.description", { count: GAMES.length }) };
}

export default function GamesPage() {
  return <GamesView />;
}
