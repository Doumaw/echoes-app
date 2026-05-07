import { GameState } from "@/types/GameState";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { GAME_STRINGS } from "../constants/game";
import { aiService } from "../services/aiService";
import { Message } from "../types/Message";

export function useMessages() {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const loadMessages = useCallback(async () => {
    const result = await db.getAllAsync<Message>(
      "SELECT * FROM messages ORDER BY createdAt DESC",
    );
    setMessages(result);
  }, [db]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const addMessage = async (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      isUser: isUser ? 1 : 0,
    };
    await db.runAsync(
      "INSERT INTO messages (id, text, createdAt, isUser) VALUES (?, ?, ?, ?)",
      [newMessage.id, newMessage.text, newMessage.createdAt, newMessage.isUser],
    );
    setMessages((prev) => [newMessage, ...prev]);
    return newMessage;
  };

  const sendFirstSOS = async (onComplete: () => void) => {
    setIsTyping(true);
    await addMessage(GAME_STRINGS.introStartMessage, false);
    setIsTyping(false);
    onComplete();
  };

  const getAIResponse = async (
    history: Message[],
    gameState: GameState,
    saveGameState?: (updates: Partial<GameState>) => Promise<void>,
  ) => {
    if (isTyping) return;
    setIsTyping(true);
    try {
      const response = await aiService.getResponse(history, gameState);
      try {
        // Tentative de parsing strict JSON
        const obj =
          typeof response === "string" ? JSON.parse(response) : response;

        // Sécurité : vérifier structure attendue
        if (
          typeof obj === "object" &&
          typeof obj.stress_change === "number" &&
          typeof obj.trust_change === "number" &&
          typeof obj.response === "string" &&
          gameState &&
          saveGameState
        ) {
          // Calcul nouveaux états bornés
          const newStress = Math.min(
            100,
            Math.max(0, (gameState.iaStress ?? 0) + obj.stress_change),
          );
          const newTrust = Math.min(
            100,
            Math.max(0, (gameState.iaTrust ?? 0) + obj.trust_change),
          );
          console.log("[IA]", {
            stressAvant: gameState.iaStress,
            trustAvant: gameState.iaTrust,
            stressChange: obj.stress_change,
            trustChange: obj.trust_change,
            stressApres: newStress,
            trustApres: newTrust,
          });
          await saveGameState({ iaStress: newStress, iaTrust: newTrust });
          await addMessage(obj.response, false);
        } else {
          throw new Error("Format réponse IA inattendu");
        }
      } catch (parseErr) {
        console.error("Erreur parsing JSON IA:", parseErr);
        await addMessage("Je je je, quoi? Hein? Erreur???", false);
      }
    } catch (e) {
      console.error(e);
      await addMessage(
        "Le signal est trop faible, je ne reçois rien...",
        false,
      );
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    sendMessage: addMessage,
    sendFirstSOS,
    getAIResponse,
  };
}
