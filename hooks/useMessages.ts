import { FIRST_IA_MESSAGE } from "@/constants/appConstants";
import { aiService } from "@/services/aiService";
import {
  buildAssistantStateUpdates,
  canRequestAssistantReply,
} from "@/services/chatService";
import { parseAIResponse } from "@/services/aiResponseParser";
import {
  getAllMessages,
  insertMessage,
  markMessagesAsIaRead,
} from "@/services/messageRepository";
import { GameState } from "@/types/GameState";
import { Message } from "@/types/Message";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

export function useMessages() {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const isProcessingPendingRef = useRef(false);

  const loadMessages = useCallback(async () => {
    const result = await getAllMessages(db);
    setMessages(result);
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

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const addMessage = useCallback(async (text: string, isUser: boolean, isIaRead: number = isUser ? 0 : 1) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      isUser: isUser ? 1 : 0,
      isIaRead,
    };
    await insertMessage(db, newMessage);
    setMessages((prev) => [newMessage, ...prev]);
    return newMessage;
  }, [db]);

  const sendFirstSOS = useCallback(async () => {
    setIsTyping(true);
    await addMessage(FIRST_IA_MESSAGE, false, 1);
    setIsTyping(false);
  }, [addMessage]);

  const buildHistoryFromDb = useCallback(async () => {
    return getAllMessages(db);
  }, [db]);

  const addAssistantFallbackMessage = useCallback(
    async (text: string) => {
      await addMessage(text, false, 1);
    },
    [addMessage],
  );

  const applyAssistantResponse = useCallback(
    async (
      rawResponse: unknown,
      gameState: GameState,
      saveGameState: (updates: Partial<GameState>) => Promise<void>,
      processedMessageIds: string[],
    ) => {
      const parsedResponse = parseAIResponse(rawResponse);

      await saveGameState(buildAssistantStateUpdates(gameState, parsedResponse));
      await addMessage(parsedResponse.response, false, 1);

      if (processedMessageIds.length > 0) {
        await markAsIaReadAndRefresh(processedMessageIds);
      }
    },
    [addMessage, markAsIaReadAndRefresh],
  );

  const getAIResponse = useCallback(async (
    history: Message[],
    gameState: GameState,
    saveGameState?: (updates: Partial<GameState>) => Promise<void>,
    processedMessageIds: string[] = [],
  ): Promise<boolean> => {
    if (!saveGameState || !canRequestAssistantReply(gameState, isTyping)) {
      return false;
    }

    setIsTyping(true);
    try {
      const response = await aiService.getResponse(history, gameState);
      try {
        await applyAssistantResponse(
          response,
          gameState,
          saveGameState,
          processedMessageIds,
        );

        return true;
      } catch (parseErr) {
        console.error("Erreur parsing JSON IA:", parseErr);
        await addAssistantFallbackMessage(
          "Julie a marmonné dans sa barbe... (réponse illisible)",
        );
        return false;
      }
    } catch (e) {
      console.error(e);
      await addAssistantFallbackMessage(
        "Le signal est trop faible, je ne reçois rien...",
      );
      return false;
    } finally {
      setIsTyping(false);
    }
  }, [addAssistantFallbackMessage, applyAssistantResponse, isTyping]);

  const processPendingMessages = useCallback(async (
    pendingMessageIds: string[],
    gameState: GameState,
    saveGameState?: (updates: Partial<GameState>) => Promise<void>,
  ) => {
    if (!pendingMessageIds || pendingMessageIds.length === 0) return false;
    if (!saveGameState || isProcessingPendingRef.current) return false;

    isProcessingPendingRef.current = true;

    try {
      const history = await buildHistoryFromDb();
      const didRespond = await getAIResponse(
        history,
        gameState,
        saveGameState,
        pendingMessageIds,
      );

      if (didRespond) {
        await saveGameState({ pendingMessageIds: [] });
      }

      return didRespond;
    } catch (error) {
      console.error("[useMessages] Error processing pending messages:", error);
      return false;
    } finally {
      isProcessingPendingRef.current = false;
    }
  }, [buildHistoryFromDb, getAIResponse]);

  return {
    messages,
    isTyping,
    sendMessage: addMessage,
    sendFirstSOS,
    getAIResponse,
    loadMessages,
    processPendingMessages,
  };
}
