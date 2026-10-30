import type { Metadata } from "next";
import PlayersView from "@/components/PlayersView";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("players.metaTitle") };
}

export default function PlayersPage() {
  return <PlayersView />;
}
