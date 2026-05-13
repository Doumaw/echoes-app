import { GameState } from "@/types/GameState";
import { GAME_STRINGS } from "@/constants/game";
import { parseAIResponse } from "@/services/aiResponseParser";
import { aiService } from "@/services/aiService";
import { buildAssistantStateUpdates } from "@/services/chatService";
import {
  getAllMessages,
  insertMessage,
  markMessagesAsIaRead,
} from "@/services/messageRepository";
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

  const addMessage = async (text: string, isUser: boolean, isIaRead: number = isUser ? 0 : 1) => {
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
  };

  const sendFirstSOS = useCallback(async (onComplete: () => void) => {
    setIsTyping(true);
    await addMessage(GAME_STRINGS.introStartMessage, false, 1);
    setIsTyping(false);
    onComplete();
  }, [addMessage]);

  const buildHistoryFromDb = useCallback(async () => {
    return getAllMessages(db);
  }, [db]);

  const getAIResponse = async (
    history: Message[],
    gameState: GameState,
    saveGameState?: (updates: Partial<GameState>) => Promise<void>,
    processedMessageIds: string[] = [],
  ): Promise<boolean> => {
    if (isTyping) return false;
    if (!gameState || !saveGameState) return false;
    
    if (
      gameState.juliePhase === "asleep" ||
      gameState.juliePhase === "busy" ||
      gameState.juliePhase === "finalTwist"
    ) {
      return false;
    }

    setIsTyping(true);
    try {
      const response = await aiService.getResponse(history, gameState);
      try {
        const parsedResponse = parseAIResponse(response);
        console.log("[useMessages] IA Response (valid):", {
          duration_minutes: parsedResponse.durationMinutes,
          stress_change: parsedResponse.stressChange,
          trust_change: parsedResponse.trustChange,
          next_situation: parsedResponse.nextSituation,
        });

        const stateUpdates = buildAssistantStateUpdates(
          gameState,
          parsedResponse,
        );

        await saveGameState(stateUpdates);
        await addMessage(parsedResponse.response, false, 1);

        if (processedMessageIds.length > 0) {
          await markAsIaReadAndRefresh(processedMessageIds);
        }

        return true;
      } catch (parseErr) {
        console.error("Erreur parsing JSON IA:", parseErr);
        await addMessage("Julie a marmonné dans sa barbe... (réponse illisible)", false, 1);
        return false;
      }
    } catch (e) {
      console.error(e);
      await addMessage("Le signal est trop faible, je ne reçois rien...", false, 1);
      return false;
    } finally {
      setIsTyping(false);
    }
  };

  const processPendingMessages = async (
    pendingMessageIds: string[],
    gameState: GameState,
    saveGameState?: (updates: Partial<GameState>) => Promise<void>,
  ) => {
    if (!pendingMessageIds || pendingMessageIds.length === 0) return false;
    if (!saveGameState || isProcessingPendingRef.current) return false;

    isProcessingPendingRef.current = true;

    try {
      console.log(`[useMessages] Processing ${pendingMessageIds.length} pending messages`);

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
  };

  const checkAutoProgress = async (
    _gameState: GameState,
    _saveGameState: (updates: Partial<GameState>) => Promise<void>,
  ) => {
    return;
  };

  return {
    messages,
    isTyping,
    sendMessage: addMessage,
    sendFirstSOS,
    getAIResponse,
    checkAutoProgress,
    loadMessages,
    markAsIaReadAndRefresh,
    processPendingMessages,
  };
}
