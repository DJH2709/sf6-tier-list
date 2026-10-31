import { ImageResponse } from "next/og";
import { DEFAULT_GAME, getGame } from "@/lib/games";
import { gameName } from "@/lib/i18n/games";
import { getT } from "@/lib/i18n/server";
import { OG_SIZE, OgCard } from "@/components/og";

// The picture shown when a game page link is shared.
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Community tier list split by player rank";

export default async function Image({ params }: { params: Promise<{ game: string }> }) {
  const t = await getT();
  const game = getGame((await params).game) ?? DEFAULT_GAME;
  return new ImageResponse(
    <OgCard title={t("site.gameTitle", { game: gameName(game, t) })} subtitle={t("home.title")} game={game} />,
    size,
  );
}
