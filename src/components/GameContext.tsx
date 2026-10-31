"use client";
import { createContext, useContext } from "react";
import { DEFAULT_GAME, getGame, type Game } from "@/lib/games";

// The game whose characters tiles and tier rows show. Pages pass the id, since a
// Game object can't cross from a server component.
const GameContext = createContext<Game>(DEFAULT_GAME);

export function GameProvider({ id, children }: { id: string; children: React.ReactNode }) {
  return <GameContext.Provider value={getGame(id) ?? DEFAULT_GAME}>{children}</GameContext.Provider>;
}

export const useGame = () => useContext(GameContext);
