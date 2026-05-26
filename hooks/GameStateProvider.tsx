import {
  createInitialGameState,
  loadStoredGameState,
  saveStoredGameState,
} from "@/services/gameStateService";
import { GameStateContextValue } from "@/types/GameStateContextValue";
import { GameState } from "@/types/GameState";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const GameStateContext = createContext<GameStateContextValue | null>(null);

interface Props {
  children: ReactNode;
}

export function GameStateProvider({ children }: Props) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameStateLoading, setIsGameStateLoading] = useState(true);

  const loadState = useCallback(async () => {
    try {
      const saved = await loadStoredGameState();
      setGameState(saved ?? createInitialGameState());
    } catch (e) {
      console.error("Erreur lecture AsyncStorage", e);
      setGameState(createInitialGameState());
    } finally {
      setIsGameStateLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

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

  const value = useMemo(
    () => ({ gameState, isGameStateLoading, loadState, saveGameState }),
    [gameState, isGameStateLoading, loadState, saveGameState],
  );

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}
