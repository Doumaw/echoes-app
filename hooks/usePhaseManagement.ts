import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";
import { getBusyDurationMs } from "@/constants/timeConfig";
import { clearMessages, insertMessage } from "@/services/messageRepository";
import {
  FINAL_TWIST_MESSAGES,
  SLEEP_END_MESSAGES,
  SLEEP_START_MESSAGES,
  createResetGameState,
  getCurrentGameHour,
  getNextWakeUpTime,
  pickRandomMessage,
  shouldJulieBeAsleep,
  shouldTriggerFinalTwist,
  shouldWakeFromBusy,
  shouldWakeFromSleep,
} from "@/services/phaseService";
import { GameState } from "@/types/GameState";

/**
 * Hook pour gérer :
 * - Les transitions de phase (awake -> asleep/busy -> awake)
 * - Le sommeil automatique (22h-8h)
 * - Le système de busy avec timer
 * - Le traitement de la file d'attente des messages
 */
export function usePhaseManagement(
  gameState: GameState | null,
  saveGameState: (updates: Partial<GameState>) => Promise<void>,
) {
  const db = useSQLiteContext();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerFinalTwist = useCallback(async () => {
    await saveGameState({
      juliePhase: "finalTwist",
      julieBusyUntil: undefined,
      julieWakeUpTime: undefined,
      busyReason: undefined,
      pendingMessageIds: [],
    });

    for (const [index, text] of FINAL_TWIST_MESSAGES.entries()) {
      await insertMessage(db, {
        id: `${Date.now()}_${index}`,
        text,
        createdAt: Date.now() + index,
        isUser: 0,
        isIaRead: 1,
      });
    }
  }, [db, saveGameState]);

  const resetGame = useCallback(async () => {
    await clearMessages(db);
    await saveGameState(createResetGameState(gameState));
  }, [db, gameState, saveGameState]);

  const forceAwake = useCallback(async () => {
    await saveGameState({
      juliePhase: "awake",
      julieBusyUntil: undefined,
      julieWakeUpTime: undefined,
      busyReason: undefined,
    });
  }, [saveGameState]);

  const forceSleep = useCallback(async () => {
    const now = Date.now();
    const forcedSleepDurationMs = 10 * 60 * 1000;
    await insertMessage(db, {
      id: `${now}_sleep_manual`,
      text: pickRandomMessage(SLEEP_START_MESSAGES),
      createdAt: now,
      isUser: 0,
      isIaRead: 1,
    });
    await saveGameState({
      juliePhase: "asleep",
      julieWakeUpTime: now + forcedSleepDurationMs,
      julieBusyUntil: undefined,
      busyReason: undefined,
    });
  }, [db, saveGameState]);

  /**
   * Marquer les messages de Julie comme "lus"
   */
  /**
   * Passer Julie en mode "busy" avec durée
   */
  const setBusy = useCallback(
    async (durationMinutes: number, reason?: string) => {
      if (!gameState) return;
      
      const now = Date.now();
      const actualDurationMs = getBusyDurationMs(durationMinutes);
      const busynessUntil = now + actualDurationMs;

      await saveGameState({
        juliePhase: "busy",
        julieBusyUntil: busynessUntil,
        busyReason: reason,
      });
    },
    [gameState, saveGameState],
  );

  /**
   * Vérifier et mettre à jour les transitions de phase
   * Ne pas appliquer le sommeil automatique si hasSeenIntro est false (début du jeu)
   */
  const checkPhaseTransitions = useCallback(async () => {
    if (!gameState) return;

    const now = Date.now();
    const { juliePhase } = gameState;

    if (shouldTriggerFinalTwist(gameState, now)) {
      console.log("[usePhaseManagement] Plot twist triggered!");
      await triggerFinalTwist();
      return;
    }

    if (shouldWakeFromBusy(gameState, now)) {
      console.log("[usePhaseManagement] Busy ended, Julie is awake");
      await saveGameState({
        juliePhase: "awake",
        julieBusyUntil: undefined,
        busyReason: undefined,
      });
      return;
    }

    if (shouldWakeFromSleep(gameState, now)) {
      console.log("[usePhaseManagement] Julie woke up");
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
      });
      await insertMessage(db, {
        id: `${Date.now()}_wake`,
        text: pickRandomMessage(SLEEP_END_MESSAGES),
        createdAt: Date.now(),
        isUser: 0,
        isIaRead: 1,
      });
      return;
    }

    if (
      gameState.hasSeenIntro &&
      juliePhase === "awake" &&
      shouldJulieBeAsleep() &&
      (!gameState.pendingMessageIds || gameState.pendingMessageIds.length === 0)
    ) {
      const wakeUpTime = getNextWakeUpTime();
      await insertMessage(db, {
        id: `${Date.now()}_sleep`,
        text: pickRandomMessage(SLEEP_START_MESSAGES),
        createdAt: Date.now(),
        isUser: 0,
        isIaRead: 1,
      });

      console.log("[usePhaseManagement] Time to sleep (22h+)");
      await saveGameState({
        juliePhase: "asleep",
        julieWakeUpTime: wakeUpTime,
      });
      return;
    }

    if (juliePhase === "asleep" && !shouldJulieBeAsleep()) {
      console.log("[usePhaseManagement] Time to wake up");
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
      });
      await insertMessage(db, {
        id: `${Date.now()}_wake_early`,
        text: pickRandomMessage(SLEEP_END_MESSAGES),
        createdAt: Date.now(),
        isUser: 0,
        isIaRead: 1,
      });
    }
  }, [db, gameState, saveGameState, triggerFinalTwist]);

  /**
   * Setup du timer pour vérifier les transitions régulièrement
   */
  useEffect(() => {
    checkPhaseTransitions();

    // Vérifier toutes les 10 secondes
    timerRef.current = setInterval(checkPhaseTransitions, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkPhaseTransitions]);

  return {
    setBusy,
    forceAwake,
    forceSleep,
    checkPhaseTransitions,
    shouldJulieBeAsleep,
    getCurrentGameHour,
    triggerFinalTwist,
    resetGame,
  };
}
