import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { GameState } from "../types/GameState";

const STORAGE_KEY = "ECHOES_GAME_STATE";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'état au démarrage
  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setGameState(JSON.parse(saved));
        } else {
          const initialState: GameState = {
            hasSeenIntro: false,
            playerName: "Joueur",
            lastSeenTimestamp: Date.now(),
          };
          setGameState(initialState);
        }
      } catch (e) {
        console.error("Erreur lecture AsyncStorage", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Sauvegarder l'état (Partiel pour ne mettre à jour que ce qu'on veut)
  const saveGameState = async (updates: Partial<GameState>) => {
    if (!gameState) return;
    try {
      const newState = { ...gameState, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setGameState(newState);
    } catch (e) {
      console.error("Erreur écriture AsyncStorage", e);
    }
  };

  return { gameState, saveGameState, isLoading };
}
