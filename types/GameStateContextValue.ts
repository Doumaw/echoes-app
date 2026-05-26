import { GameState } from "@/types/GameState";

export interface GameStateContextValue {
  gameState: GameState | null;
  isGameStateLoading: boolean;
  loadState: () => Promise<void>;
  saveGameState: (updates: Partial<GameState>) => Promise<void>;
}
