import { useGameState } from "@/hooks/useGameState";
import { useMessages } from "@/hooks/useMessages";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

interface Options {
  onIntroSent?: () => Promise<void> | void;
}

export function useIntroMessage({ onIntroSent }: Options = {}) {
  const introStartedRef = useRef(false);
  const { gameState, saveGameState, isGameStateLoading } = useGameState();
  const { isTyping, sendFirstSOS } = useMessages();

  const runIntroIfNeeded = useCallback(async () => {
    if (gameState?.hasSeenIntro) {
      introStartedRef.current = false;
      return;
    }

    if (
      isGameStateLoading ||
      !gameState ||
      isTyping ||
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

    await sendFirstSOS();
    await onIntroSent?.();
  }, [
    gameState,
    isGameStateLoading,
    isTyping,
    onIntroSent,
    saveGameState,
    sendFirstSOS,
  ]);

  useFocusEffect(
    useCallback(() => {
      void runIntroIfNeeded();
    }, [runIntroIfNeeded]),
  );
}
