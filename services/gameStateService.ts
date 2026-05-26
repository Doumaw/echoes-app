import AsyncStorage from "@react-native-async-storage/async-storage";
import { GAME_STATE_STORAGE_KEY } from "@/constants/appConstants";
import { GameState } from "@/types/GameState";

export function createInitialGameState(): GameState {
  return {
    hasSeenIntro: false,
    contactName: "Numéro Inconnu",
    theme: "dark",
    iaStress: 10,
    iaTrust: 50,
    juliePhase: "awake",
    julieSituation: "trapped",
    julieWakeUpTime: undefined,
    nextSleepAt: undefined,
    julieBusyUntil: undefined,
    busyReason: undefined,
    firstMessageTimestamp: undefined,
    pendingMessageIds: [],
  };
}

export async function loadStoredGameState() {
  const saved = await AsyncStorage.getItem(GAME_STATE_STORAGE_KEY);
  if (!saved) {
    return null;
  }

  return JSON.parse(saved) as GameState;
}

export async function saveStoredGameState(
  fallbackState: GameState | null,
  updates: Partial<GameState>,
) {
  const currentState = (await loadStoredGameState()) ?? fallbackState;

  if (!currentState) {
    return null;
  }

  const nextState = { ...currentState, ...updates };
  await AsyncStorage.setItem(
    GAME_STATE_STORAGE_KEY,
    JSON.stringify(nextState),
  );

  return nextState;
}
