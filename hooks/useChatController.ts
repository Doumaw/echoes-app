import { useEffect, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useMessages } from "@/hooks/useMessages";
import { usePhaseManagement } from "@/hooks/usePhaseManagement";
import { getDevCommandAction } from "@/services/devCommandsService";
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
    markAsReadAndRefresh,
    processPendingMessages,
  } = useMessages();
  const { gameState, saveGameState, isLoading, loadState } = useGameState();
  const { triggerFinalTwist, resetGame } = usePhaseManagement(
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

  const markJulieMessagesAsReadIfNeeded = async () => {
    if (messages.length === 0) {
      return;
    }

    const julieMessageIds = messages
      .filter((message) => message.isUser === 0 && message.isRead === 0)
      .map((message) => message.id);

    if (julieMessageIds.length > 0) {
      await markAsReadAndRefresh(julieMessageIds);
    }
  };

  const handleDevCommandIfNeeded = async (text: string) => {
    const devCommandAction = getDevCommandAction(text);

    if (devCommandAction === "twist") {
      await triggerFinalTwist();
      await loadMessages();
      return true;
    }

    if (devCommandAction === "reset") {
      await resetGame();
      await loadMessages();
      await loadState();
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
    gameState?.juliePhase,
    gameState?.pendingMessageIds,
    processPendingMessages,
    gameState,
    saveGameState,
  ]);

  useEffect(() => {
    void markJulieMessagesAsReadIfNeeded();
  }, [messages, markAsReadAndRefresh]);

  const handleSend = async (text: string) => {
    if (!gameState) return;

    if (await handleDevCommandIfNeeded(text)) {
      return;
    }

    const userMessage = await sendMessage(text, true, 0);

    if (shouldQueueForLater(gameState)) {
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
    isInputDisabled: isTyping || gameState?.juliePhase === "finalTwist",
    handleSend,
  };
}
