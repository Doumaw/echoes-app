import { useEffect, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useMessages } from "@/hooks/useMessages";
import { usePhaseManagement } from "@/hooks/usePhaseManagement";
import { getDemoCommandAction } from "@/services/demoCommandsService";
import { getChatStatus, shouldQueueForLater } from "@/services/chatService";

export function useChatController() {
  const introStartedRef = useRef(false);
  const {
    messages,
    isTyping,
    sendMessage,
    sendFirstSOS,
    getAIResponse,
    loadMessages,
    processPendingMessages,
  } = useMessages();
  const { gameState, saveGameState, isLoading, loadState } = useGameState();
  const { triggerFinalTwist, resetGame, forceAwake, forceSleep, setBusy } = usePhaseManagement(
    gameState,
    saveGameState,
  );

  const runIntroIfNeeded = async () => {
    if (gameState?.hasSeenIntro) {
      introStartedRef.current = false;
      return;
    }

    if (
      isLoading ||
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

    await sendFirstSOS(() => {});
  };

  const processPendingMessagesIfNeeded = async () => {
    if (
      isTyping ||
      gameState?.juliePhase !== "awake" ||
      !gameState.pendingMessageIds ||
      gameState.pendingMessageIds.length === 0
    ) {
      return;
    }

    await processPendingMessages(
      gameState.pendingMessageIds,
      gameState,
      saveGameState,
    );
  };

  const refreshMessagesIfJulieCameBack = async () => {
    if (
      gameState?.juliePhase === "awake" &&
      (!gameState.pendingMessageIds || gameState.pendingMessageIds.length === 0)
    ) {
      await loadMessages();
    }
  };

  const handleDemoCommandIfNeeded = async (text: string) => {
    const demoCommandAction = getDemoCommandAction(text);

    if (demoCommandAction === "twist") {
      await triggerFinalTwist();
      await loadMessages();
      return true;
    }

    if (demoCommandAction === "reset") {
      await resetGame();
      await loadMessages();
      await loadState();
      return true;
    }

    if (demoCommandAction === "awake") {
      await forceAwake();
      await loadMessages();
      return true;
    }

    if (demoCommandAction === "busy") {
      await setBusy(5, "hors ligne");
      return true;
    }

    if (demoCommandAction === "sleep") {
      await forceSleep();
      await loadMessages();
      return true;
    }

    return false;
  };

  useEffect(() => {
    void runIntroIfNeeded();
  }, [isLoading, gameState, isTyping, saveGameState, sendFirstSOS]);

  useEffect(() => {
    void processPendingMessagesIfNeeded();
  }, [
    isTyping,
    gameState?.juliePhase,
    gameState?.pendingMessageIds,
    processPendingMessages,
    gameState,
    saveGameState,
  ]);

  useEffect(() => {
    void refreshMessagesIfJulieCameBack();
  }, [gameState?.juliePhase, gameState?.pendingMessageIds, loadMessages]);

  const handleSend = async (text: string) => {
    if (!gameState) return;

    if (await handleDemoCommandIfNeeded(text)) {
      return;
    }

    const userMessage = await sendMessage(text, true, 0);

    if (isTyping || shouldQueueForLater(gameState)) {
      const currentPending = gameState.pendingMessageIds || [];
      await saveGameState({
        pendingMessageIds: [...currentPending, userMessage.id],
      });
      return;
    }

    void getAIResponse(
      [userMessage, ...messages],
      gameState,
      saveGameState,
      [userMessage.id],
    );
  };

  return {
    messages,
    isTyping,
    isLoading,
    themeMode: gameState?.theme || "dark",
    status: getChatStatus(gameState),
    contactName: gameState?.contactName || "Petit problème",
    isInputDisabled: false,
    handleSend,
  };
}
