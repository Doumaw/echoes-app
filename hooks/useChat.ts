import { useGameState } from "@/hooks/useGameState";
import { usePhaseManagement } from "@/hooks/usePhaseManagement";
import { aiService } from "@/services/aiService";
import { parseAIResponse } from "@/services/aiResponseParser";
import { getDemoCommandAction } from "@/services/demoCommandsService";
import {
  buildAssistantStateUpdates,
  hasPendingMessages,
  isJulieAvailable,
  shouldQueueForLater,
} from "@/services/gameRulesService";
import {
  getAllMessages,
  insertMessage,
  markMessagesAsIaRead,
} from "@/services/messageRepository";
import { createMessage } from "@/services/messageService";
import { GameState } from "@/types/GameState";
import { Message } from "@/types/Message";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

export function useChat() {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const isProcessingPendingRef = useRef(false);
  const { gameState, saveGameState, loadState } = useGameState();
  const { triggerFinalTwist, resetGame, forceAwake, forceSleep, setBusy } = usePhaseManagement(
    gameState,
    saveGameState,
  );

  // Messages
  const loadMessages = useCallback(async () => {
    const storedMessages = await getAllMessages(db);
    setMessages(storedMessages);
  }, [db]);

  const addMessage = useCallback(async (messageText: string, isUser: boolean, isIaRead: number = isUser ? 0 : 1) => {
    const newMessage = createMessage(messageText, isUser, isIaRead);
    await insertMessage(db, newMessage);
    setMessages((prev) => [newMessage, ...prev]);
    return newMessage;
  }, [db]);

  const markAsIaReadAndRefresh = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      await markMessagesAsIaRead(db, messageIds);
      await loadMessages();
    } catch (error) {
      console.error("Erreur marquage messages lus", error);
    }
  }, [db, loadMessages]);

  const addAssistantFallbackMessage = useCallback(
    async (messageText: string) => {
      await addMessage(messageText, false, 1);
    },
    [addMessage],
  );

  // Réponses de Julie
  const applyAssistantResponse = useCallback(
    async (
      rawResponse: unknown,
      currentGameState: GameState,
      processedMessageIds: string[],
    ) => {
      const parsedResponse = parseAIResponse(rawResponse);

      await saveGameState(buildAssistantStateUpdates(currentGameState, parsedResponse));
      await addMessage(parsedResponse.response, false, 1);

      if (processedMessageIds.length > 0) {
        await markAsIaReadAndRefresh(processedMessageIds);
      }
    },
    [addMessage, markAsIaReadAndRefresh, saveGameState],
  );

  const requestAssistantReply = useCallback(async (
    history: Message[],
    currentGameState: GameState,
    processedMessageIds: string[] = [],
  ): Promise<boolean> => {
    if (isTyping || !isJulieAvailable(currentGameState)) {
      return false;
    }

    setIsTyping(true);
    try {
      const response = await aiService.getResponse(history, currentGameState);
      try {
        await applyAssistantResponse(response, currentGameState, processedMessageIds);
        return true;
      } catch (parseErr) {
        console.error("Erreur parsing JSON IA:", parseErr);
        await addAssistantFallbackMessage(
          "je capte mal... ton dernier message s'est affiché n'importe comment... tu peux répéter ?",
        );
        await markAsIaReadAndRefresh(processedMessageIds);
        return true;
      }
    } catch (error) {
      console.error(error);
      await addAssistantFallbackMessage(
        "Le signal est trop faible, je ne reçois rien...",
      );
      await markAsIaReadAndRefresh(processedMessageIds);
      return true;
    } finally {
      setIsTyping(false);
    }
  }, [addAssistantFallbackMessage, applyAssistantResponse, isTyping, markAsIaReadAndRefresh]);

  // Messages en attente
  const processPendingMessages = useCallback(async (
    pendingMessageIds: string[],
    currentGameState: GameState,
  ) => {
    if (pendingMessageIds.length === 0 || isProcessingPendingRef.current) {
      return false;
    }

    isProcessingPendingRef.current = true;

    try {
      const history = await getAllMessages(db);
      const didRespond = await requestAssistantReply(
        history,
        currentGameState,
        pendingMessageIds,
      );

      if (didRespond) {
        await saveGameState({ pendingMessageIds: [] });
      }

      return didRespond;
    } catch (error) {
      console.error("[useChat] Error processing pending messages:", error);
      return false;
    } finally {
      isProcessingPendingRef.current = false;
    }
  }, [db, requestAssistantReply, saveGameState]);

  // Commandes de démonstration
  const handleDemoCommandIfNeeded = useCallback(async (messageText: string) => {
    const demoCommandAction = getDemoCommandAction(messageText);

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
  }, [forceAwake, forceSleep, loadMessages, loadState, resetGame, setBusy, triggerFinalTwist]);

  // Effets automatiques
  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (
      isTyping ||
      gameState?.juliePhase !== "awake" ||
      !hasPendingMessages(gameState)
    ) {
      return;
    }

    void processPendingMessages(gameState.pendingMessageIds ?? [], gameState);
  }, [gameState, isTyping, processPendingMessages]);

  useEffect(() => {
    if (
      gameState?.juliePhase === "awake" &&
      !hasPendingMessages(gameState)
    ) {
      void loadMessages();
    }
  }, [gameState?.juliePhase, gameState?.pendingMessageIds, loadMessages]);

  // Action publique
  const handleSend = useCallback(async (messageText: string) => {
    if (!gameState) return;

    if (await handleDemoCommandIfNeeded(messageText)) {
      return;
    }

    const userMessage = await addMessage(messageText, true, 0);

    if (isTyping || shouldQueueForLater(gameState)) {
      const currentPending = gameState.pendingMessageIds || [];
      await saveGameState({
        pendingMessageIds: [...currentPending, userMessage.id],
      });
      return;
    }

    void requestAssistantReply(
      [userMessage, ...messages],
      gameState,
      [userMessage.id],
    );
  }, [addMessage, gameState, handleDemoCommandIfNeeded, isTyping, messages, requestAssistantReply, saveGameState]);

  return {
    messages,
    isTyping,
    handleSend,
  };
}
