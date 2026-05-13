import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";
import { getBusyDurationMs } from "@/constants/timeConfig";
import { clearMessages, insertMessage } from "@/services/messageRepository";
import {
  FINAL_TWIST_MESSAGES,
  createResetGameState,
  getCurrentGameHour,
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
      return;
    }

    // Sommeil automatique SEULEMENT après le premier message (hasSeenIntro = true)
    // DÉSACTIVÉ POUR LE MVP
    /*
    if (hasSeenIntro && juliePhase === "awake" && shouldJulieBeAsleep()) {
      console.log("[usePhaseManagement] Time to sleep (22h+)");
      const wakeUpTime = getNextWakeUpTime();
      await saveGameState({
        juliePhase: "asleep",
        julieWakeUpTime: wakeUpTime,
      });
      return;
    }
    */

    // Réveil automatique selon l'horaire
    if (juliePhase === "asleep" && !shouldJulieBeAsleep()) {
      console.log("[usePhaseManagement] Time to wake up");
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
      });
    }
  }, [gameState, saveGameState, triggerFinalTwist]);

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
    checkPhaseTransitions,
    shouldJulieBeAsleep,
    getCurrentGameHour,
    triggerFinalTwist,
    resetGame,
  };
}
