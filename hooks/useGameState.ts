import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { GameState } from "../types/GameState";

const STORAGE_KEY = "ECHOES_GAME_STATE";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setGameState(JSON.parse(saved));
      } else {
        const initialState: GameState = {
          hasSeenIntro: false,
          lastSeenTimestamp: Date.now(),
          scriptIndex: 0,
          contactName: "Numéro Inconnu",
          theme: "dark",
          iaStress: 10,
          iaTrust: 50,
          juliePhase: "awake",
          julieSituation: "trapped", // Julie commence coincée
          julieWakeUpTime: undefined,
          firstMessageTimestamp: undefined,
          pendingMessageIds: [],
        };
        setGameState(initialState);
      }
    } catch (e) {
      console.error("Erreur lecture AsyncStorage", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameState = useCallback(async (updates: Partial<GameState>) => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const currentState = saved
        ? (JSON.parse(saved) as GameState)
        : gameState;

      if (!currentState) return;

      const newState = { ...currentState, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setGameState(newState);
    } catch (e) {
      console.error("Erreur écriture AsyncStorage", e);
    }
  }, [gameState]);

  return { gameState, saveGameState, isLoading, loadState };
}
