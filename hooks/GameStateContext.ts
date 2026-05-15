import { createContext } from "react";
import { GameState } from "@/types/GameState";

export interface GameStateContextValue {
  gameState: GameState | null;
  isLoading: boolean;
  loadState: () => Promise<void>;
  saveGameState: (updates: Partial<GameState>) => Promise<void>;
}

export const GameStateContext = createContext<GameStateContextValue | null>(null);
