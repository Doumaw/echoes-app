import { createInitialGameState, loadStoredGameState, saveStoredGameState } from "@/services/gameStateService";
import { GameState } from "@/types/GameState";
import { useCallback, useEffect, useState } from "react";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const saved = await loadStoredGameState();
      setGameState(saved ?? createInitialGameState());
    } catch (e) {
      console.error("Erreur lecture AsyncStorage", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameState = useCallback(async (updates: Partial<GameState>) => {
    try {
      const nextState = await saveStoredGameState(gameState, updates);
      if (nextState) {
        setGameState(nextState);
      }
    } catch (e) {
      console.error("Erreur écriture AsyncStorage", e);
    }
  }, [gameState]);

  return { gameState, saveGameState, isLoading, loadState };
}
