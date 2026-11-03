"use client";
import { createContext, useContext } from "react";
import { DEFAULT_GAME, getGame, withCategory, type Game } from "@/lib/games";

// The game (and tab: characters, weapons...) whose items tiles and tier rows show. Pages pass
// ids, since a Game object can't cross from a server component.
const GameContext = createContext<Game>(DEFAULT_GAME);

export function GameProvider({ id, category, children }: { id: string; category?: string; children: React.ReactNode }) {
  return <GameContext.Provider value={withCategory(getGame(id) ?? DEFAULT_GAME, category)}>{children}</GameContext.Provider>;
}

export const useGame = () => useContext(GameContext);
