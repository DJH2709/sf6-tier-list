import type { Metadata } from "next";
import PlayersView from "@/components/PlayersView";
import { getT } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return pageMeta("/players", t("players.metaTitle"), t("site.description"));
}

export default function PlayersPage() {
  return <PlayersView />;
}
