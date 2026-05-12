import { GameState } from "@/types/GameState";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBusyDurationMs } from "../constants/timeConfig";
import { GAME_STRINGS } from "../constants/game";
import { aiService } from "../services/aiService";
import { Message } from "../types/Message";

const ALLOWED_DURATIONS = [0, 5, 10, 15, 20] as const;
const ALLOWED_NEXT_SITUATIONS = ["leg_freed", null] as const;

export function useMessages() {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const isProcessingPendingRef = useRef(false);

  const loadMessages = useCallback(async () => {
    const result = await db.getAllAsync<Message>(
      "SELECT * FROM messages ORDER BY createdAt DESC",
    );
    setMessages(result);
  }, [db]);

  const markAsReadAndRefresh = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    try {
      const placeholders = messageIds.map(() => "?").join(",");
      await db.runAsync(
        `UPDATE messages SET isRead = 1 WHERE id IN (${placeholders})`,
        messageIds,
      );
      await loadMessages();
    } catch (error) {
      console.error("Erreur marquage messages lus", error);
    }
  }, [db, loadMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const addMessage = async (text: string, isUser: boolean, isRead: number = isUser ? 0 : 1) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      isUser: isUser ? 1 : 0,
      isRead,
    };
    await db.runAsync(
      "INSERT INTO messages (id, text, createdAt, isUser, isRead) VALUES (?, ?, ?, ?, ?)",
      [newMessage.id, newMessage.text, newMessage.createdAt, newMessage.isUser, newMessage.isRead],
    );
    setMessages((prev) => [newMessage, ...prev]);
    return newMessage;
  };

  const sendFirstSOS = async (onComplete: () => void) => {
    setIsTyping(true);
    await addMessage(GAME_STRINGS.introStartMessage, false, 1);
    setIsTyping(false);
    onComplete();
  };

  const buildHistoryFromDb = useCallback(async () => {
    return db.getAllAsync<Message>(
      "SELECT * FROM messages ORDER BY createdAt DESC",
    );
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
        const obj = typeof response === "string" ? JSON.parse(response) : response;
        const nextSituation = obj?.next_situation ?? null;

        if (
          typeof obj === "object" &&
          typeof obj.stress_change === "number" &&
          typeof obj.trust_change === "number" &&
          typeof obj.response === "string" &&
          typeof obj.duration_minutes === "number" &&
          ALLOWED_DURATIONS.includes(obj.duration_minutes) &&
          ALLOWED_NEXT_SITUATIONS.includes(nextSituation)
        ) {
          console.log(`[useMessages] IA Response (valid):`, {
            duration_minutes: obj.duration_minutes,
            stress_change: obj.stress_change,
            trust_change: obj.trust_change,
            next_situation: nextSituation,
          });
          
          const newStress = Math.min(
            100,
            Math.max(0, (gameState.iaStress ?? 0) + obj.stress_change),
          );
          const newTrust = Math.min(
            100,
            Math.max(0, (gameState.iaTrust ?? 0) + obj.trust_change),
          );

          const stateUpdates: Partial<GameState> = {
            iaStress: newStress,
            iaTrust: newTrust,
          };

          if (nextSituation === "leg_freed" && gameState.julieSituation !== "leg_freed") {
            console.log(`[useMessages] Situation progression: ${gameState.julieSituation} → leg_freed`);
            stateUpdates.julieSituation = "leg_freed";
          }

          if (obj.duration_minutes > 0) {
            const now = Date.now();
            const actualDurationMs = getBusyDurationMs(obj.duration_minutes);

            stateUpdates.juliePhase = "busy";
            stateUpdates.julieBusyUntil = now + actualDurationMs;
            stateUpdates.busyReason = obj.response;
          }

          await saveGameState(stateUpdates);
          await addMessage(obj.response, false, 1);

          if (processedMessageIds.length > 0) {
            await markAsReadAndRefresh(processedMessageIds);
          }

          return true;
        } else {
          if (typeof obj?.duration_minutes === "number" && !ALLOWED_DURATIONS.includes(obj.duration_minutes)) {
            console.error(`[useMessages] ⚠️ IA proposed invalid duration: ${obj.duration_minutes}min`);
            throw new Error(`Durée invalide: ${obj.duration_minutes}`);
          }
          if (!ALLOWED_NEXT_SITUATIONS.includes(nextSituation)) {
            console.error(`[useMessages] ⚠️ IA proposed invalid next_situation: ${nextSituation}`);
            throw new Error(`Situation invalide: ${nextSituation}`);
          }
          throw new Error("Format inattendu");
        }
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
    gameState: GameState,
    saveGameState: (updates: Partial<GameState>) => Promise<void>,
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
    markAsReadAndRefresh,
    processPendingMessages,
  };
}
