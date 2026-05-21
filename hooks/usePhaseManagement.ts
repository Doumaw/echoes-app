import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";
import {
  BUSY_RETURN_MESSAGES,
  FINAL_TWIST_MESSAGES,
  SLEEP_END_MESSAGES,
  SLEEP_START_MESSAGES,
} from "@/constants/appConstants";
import { createResetGameState } from "@/services/gameStateService";
import { clearMessages, insertMessage } from "@/services/messageRepository";
import {
  getBusyDurationMs,
  getDemoSleepDurationMs,
  getFirstSleepTimestamp,
  getNextSleepTimestamp,
  getRandomSleepDurationMs,
  pickRandomMessage,
  shouldStartSleep,
  shouldTriggerFinalTwist,
  shouldWakeFromBusy,
  shouldWakeFromSleep,
} from "@/services/phaseService";
import { GameState } from "@/types/GameState";

/**
 * Gère les transitions automatiques de Julie : busy, sommeil et twist final.
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
    const hasPendingMessages = Boolean(
      gameState?.pendingMessageIds && gameState.pendingMessageIds.length > 0,
    );

    await saveGameState({
      juliePhase: "awake",
      julieBusyUntil: undefined,
      julieWakeUpTime: undefined,
      nextSleepAt: getNextSleepTimestamp(Date.now()),
      busyReason: undefined,
    });

    if (!hasPendingMessages) {
      await insertMessage(db, {
        id: `${Date.now()}_forced_awake`,
        text: pickRandomMessage(BUSY_RETURN_MESSAGES),
        createdAt: Date.now(),
        isUser: 0,
        isIaRead: 1,
      });
    }
  }, [db, gameState?.pendingMessageIds, saveGameState]);

  const forceSleep = useCallback(async () => {
    const now = Date.now();
    const forcedSleepDurationMs = getDemoSleepDurationMs();
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
      nextSleepAt: undefined,
      julieBusyUntil: undefined,
      busyReason: undefined,
    });
  }, [db, saveGameState]);

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

      if (!gameState.pendingMessageIds || gameState.pendingMessageIds.length === 0) {
        await insertMessage(db, {
          id: `${Date.now()}_busy_return`,
          text: pickRandomMessage(BUSY_RETURN_MESSAGES),
          createdAt: Date.now(),
          isUser: 0,
          isIaRead: 1,
        });
      }

      return;
    }

    if (shouldWakeFromSleep(gameState, now)) {
      console.log("[usePhaseManagement] Julie woke up");
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
        nextSleepAt: getNextSleepTimestamp(now),
      });

      if (!gameState.pendingMessageIds || gameState.pendingMessageIds.length === 0) {
        await insertMessage(db, {
          id: `${Date.now()}_wake`,
          text: pickRandomMessage(SLEEP_END_MESSAGES),
          createdAt: Date.now(),
          isUser: 0,
          isIaRead: 1,
        });
      }

      return;
    }

    if (
      gameState.hasSeenIntro &&
      !gameState.nextSleepAt &&
      gameState.firstMessageTimestamp &&
      juliePhase !== "asleep" &&
      juliePhase !== "finalTwist"
    ) {
      await saveGameState({
        nextSleepAt: getFirstSleepTimestamp(gameState.firstMessageTimestamp),
      });
      return;
    }

    if (shouldStartSleep(gameState, now)) {
      const wakeUpTime = now + getRandomSleepDurationMs();
      await insertMessage(db, {
        id: `${Date.now()}_sleep`,
        text: pickRandomMessage(SLEEP_START_MESSAGES),
        createdAt: Date.now(),
        isUser: 0,
        isIaRead: 1,
      });

      console.log("[usePhaseManagement] Julie is too tired, going to sleep");
      await saveGameState({
        juliePhase: "asleep",
        julieWakeUpTime: wakeUpTime,
        nextSleepAt: undefined,
      });
      return;
    }
  }, [db, gameState, saveGameState, triggerFinalTwist]);

  useEffect(() => {
    checkPhaseTransitions();

    timerRef.current = setInterval(checkPhaseTransitions, 10000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkPhaseTransitions]);

  return {
    setBusy,
    forceAwake,
    forceSleep,
    triggerFinalTwist,
    resetGame,
  };
}
