import { FIRST_IA_MESSAGE } from "@/constants/appConstants";
import { useGameState } from "@/hooks/useGameState";
import { insertMessage } from "@/services/messageRepository";
import { createAssistantMessage } from "@/services/messageService";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef } from "react";

export function useIntroMessage(loadLastMessage: () => Promise<void>) {
  const db = useSQLiteContext();
  const introStartedRef = useRef(false);
  const { gameState, saveGameState, isGameStateLoading } = useGameState();

  const runIntroIfNeeded = useCallback(async () => {
    if (gameState?.hasSeenIntro) {
      introStartedRef.current = false;
      return;
    }

    if (
      isGameStateLoading ||
      !gameState ||
      introStartedRef.current
    ) {
      return;
    }

    introStartedRef.current = true;

    const firstMessageTimestamp = Date.now();
    await saveGameState({
      hasSeenIntro: true,
      firstMessageTimestamp,
    });

    await insertMessage(db, createAssistantMessage(FIRST_IA_MESSAGE));
    await loadLastMessage();
  }, [
    db,
    gameState,
    isGameStateLoading,
    loadLastMessage,
    saveGameState,
  ]);

  useFocusEffect(
    useCallback(() => {
      void runIntroIfNeeded();
    }, [runIntroIfNeeded]),
  );
}
