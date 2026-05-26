import {
  BUSY_RETURN_MESSAGES,
  FINAL_TWIST_MESSAGES,
  SLEEP_END_MESSAGES,
  SLEEP_START_MESSAGES,
} from "@/constants/appConstants";
import { createResetGameState } from "@/services/gameStateService";
import { clearMessages, insertMessage } from "@/services/messageRepository";
import { createMessage, createSystemMessages } from "@/services/messageService";
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
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";

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

    for (const message of createSystemMessages(FINAL_TWIST_MESSAGES)) {
      await insertMessage(db, message);
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
      await insertMessage(db, createMessage(
        pickRandomMessage(BUSY_RETURN_MESSAGES),
        false,
        1,
      ));
    }
  }, [db, gameState?.pendingMessageIds, saveGameState]);

  const forceSleep = useCallback(async () => {
    const now = Date.now();
    const forcedSleepDurationMs = getDemoSleepDurationMs();
    await insertMessage(db, createMessage(
      pickRandomMessage(SLEEP_START_MESSAGES),
      false,
      1,
    ));
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
      await triggerFinalTwist();
      return;
    }

    if (shouldWakeFromBusy(gameState, now)) {
      await saveGameState({
        juliePhase: "awake",
        julieBusyUntil: undefined,
        busyReason: undefined,
      });

      if (!gameState.pendingMessageIds || gameState.pendingMessageIds.length === 0) {
        await insertMessage(db, createMessage(
          pickRandomMessage(BUSY_RETURN_MESSAGES),
          false,
          1,
        ));
      }

      return;
    }

    if (shouldWakeFromSleep(gameState, now)) {
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
        nextSleepAt: getNextSleepTimestamp(now),
      });

      if (!gameState.pendingMessageIds || gameState.pendingMessageIds.length === 0) {
        await insertMessage(db, createMessage(
          pickRandomMessage(SLEEP_END_MESSAGES),
          false,
          1,
        ));
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
      await insertMessage(db, createMessage(
        pickRandomMessage(SLEEP_START_MESSAGES),
        false,
        1,
      ));

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
