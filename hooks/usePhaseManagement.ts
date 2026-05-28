import {
  BUSY_RETURN_MESSAGES,
  FINAL_TWIST_MESSAGES,
  SLEEP_END_MESSAGES,
  SLEEP_START_MESSAGES,
} from "@/constants/appConstants";
import { createInitialGameState } from "@/services/gameStateService";
import {
  getBusyDurationMs,
  getDemoSleepDurationMs,
  getFirstSleepTimestamp,
  getNextSleepTimestamp,
  getRandomSleepDurationMs,
  shouldStartSleep,
  shouldTriggerFinalTwist,
  shouldWakeFromBusy,
  shouldWakeFromSleep,
} from "@/services/gameRulesService";
import { clearMessages, insertMessage } from "@/services/messageRepository";
import { createRandomAssistantMessage, createSystemMessages } from "@/services/messageService";
import { GameState } from "@/types/GameState";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";

export function usePhaseManagement(
  gameState: GameState | null,
  saveGameState: (updates: Partial<GameState>) => Promise<void>,
) {
  const db = useSQLiteContext();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addRandomAssistantMessage = useCallback(async (texts: string[]) => {
    await insertMessage(db, createRandomAssistantMessage(texts));
  }, [db]);

  // Actions forcées
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
    await saveGameState(createInitialGameState());
  }, [db, saveGameState]);

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
      await addRandomAssistantMessage(BUSY_RETURN_MESSAGES);
    }
  }, [addRandomAssistantMessage, gameState?.pendingMessageIds, saveGameState]);

  const forceSleep = useCallback(async () => {
    const now = Date.now();
    const forcedSleepDurationMs = getDemoSleepDurationMs();
    await addRandomAssistantMessage(SLEEP_START_MESSAGES);
    await saveGameState({
      juliePhase: "asleep",
      julieWakeUpTime: now + forcedSleepDurationMs,
      nextSleepAt: undefined,
      julieBusyUntil: undefined,
      busyReason: undefined,
    });
  }, [addRandomAssistantMessage, saveGameState]);

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

  // Transitions automatiques
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
        await addRandomAssistantMessage(BUSY_RETURN_MESSAGES);
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
        await addRandomAssistantMessage(SLEEP_END_MESSAGES);
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
      await addRandomAssistantMessage(SLEEP_START_MESSAGES);

      await saveGameState({
        juliePhase: "asleep",
        julieWakeUpTime: wakeUpTime,
        nextSleepAt: undefined,
      });
      return;
    }
  }, [addRandomAssistantMessage, gameState, saveGameState, triggerFinalTwist]);

  // Minuteur de vérification
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
