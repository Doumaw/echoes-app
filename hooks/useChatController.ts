import { useEffect, useRef } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useMessages } from "@/hooks/useMessages";
import { usePhaseManagement } from "@/hooks/usePhaseManagement";
import { getDevCommandAction } from "@/services/devCommandsService";
import { logGameState } from "@/services/debug";
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

  useEffect(() => {
    if (!isLoading && gameState) {
      console.log("[ChatScreen] GameState loaded:", {
        phase: gameState.juliePhase,
        hasSeenIntro: gameState.hasSeenIntro,
        firstMessageTimestamp: gameState.firstMessageTimestamp,
      });
      logGameState();
    }
  }, [isLoading, gameState]);

  useEffect(() => {
    if (gameState?.hasSeenIntro) {
      introStartedRef.current = false;
      return;
    }

    if (
      !isLoading &&
      gameState &&
      !gameState.hasSeenIntro &&
      !isTyping &&
      !introStartedRef.current
    ) {
      introStartedRef.current = true;

      void (async () => {
        const firstMessageTimestamp = Date.now();
        await saveGameState({
          hasSeenIntro: true,
          firstMessageTimestamp,
        });

        await sendFirstSOS(() => {});
      })();
    }
  }, [isLoading, gameState, isTyping, saveGameState, sendFirstSOS]);

  useEffect(() => {
    if (
      gameState?.juliePhase === "awake" &&
      gameState.pendingMessageIds &&
      gameState.pendingMessageIds.length > 0
    ) {
      console.log(
        `[ChatScreen] Julie is back awake, processing ${gameState.pendingMessageIds.length} pending messages`,
      );
      void processPendingMessages(
        gameState.pendingMessageIds,
        gameState,
        saveGameState,
      );
    }
  }, [
    gameState?.juliePhase,
    gameState?.pendingMessageIds,
    processPendingMessages,
    gameState,
    saveGameState,
  ]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const julieMessageIds = messages
      .filter((message) => message.isUser === 0 && message.isRead === 0)
      .map((message) => message.id);

    if (julieMessageIds.length > 0) {
      void markAsReadAndRefresh(julieMessageIds);
    }
  }, [messages, markAsReadAndRefresh]);

  const handleSend = async (text: string) => {
    if (!gameState) return;

    const devCommandAction = getDevCommandAction(text);
    if (devCommandAction === "twist") {
      await triggerFinalTwist();
      await loadMessages();
      return;
    }

    if (devCommandAction === "reset") {
      await resetGame();
      await loadMessages();
      await loadState();
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
    status: getChatStatus(gameState),
    contactName: gameState?.contactName || "Petit problème",
    isInputDisabled: isTyping || gameState?.juliePhase === "finalTwist",
    handleSend,
  };
}
