import type { Metadata } from "next";
import GameHome from "@/components/GameHome";
import { DEFAULT_GAME } from "@/lib/games";

export const metadata: Metadata = {
  title: `${DEFAULT_GAME.name} Community Tier List`,
  description: `${DEFAULT_GAME.name} tier lists voted by the community, split by player rank.`,
};

export default function Home() {
  return <GameHome gameId={DEFAULT_GAME.id} />;
}
