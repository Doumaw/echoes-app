import { GameState } from "@/types/GameState";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { TIME_CONFIG } from "../constants/timeConfig";
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

  /**
   * Ajouter un message (utilisateur ou IA)
   */
  const addMessage = async (text: string, isUser: boolean, isRead: number = isUser ? 0 : 1) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      isUser: isUser ? 1 : 0,
      isRead, // Les messages utilisateur commencent non lus (0), les messages IA sont lus (1)
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
    await addMessage(GAME_STRINGS.introStartMessage, false, 1); // SOS initial est lu
    setIsTyping(false);
    onComplete();
  };

  /**
   * Obtenir la réponse de l'IA et gérer la durée de l'action
   */
  const getAIResponse = async (
    history: Message[],
    gameState: GameState,
    saveGameState?: (updates: Partial<GameState>) => Promise<void>,
    onMessageReceived?: () => void, // Callback pour marquer les messages comme lus
  ) => {
    if (isTyping) return;
    
    if (!gameState) return;
    
    // Blocage si Julie dort, est occupée ou finalTwist
    if (
      gameState.juliePhase === "asleep" ||
      gameState.juliePhase === "busy" ||
      gameState.juliePhase === "finalTwist"
    ) {
      return;
    }

    setIsTyping(true);
    try {
      const response = await aiService.getResponse(history, gameState);
      try {
        const obj = typeof response === "string" ? JSON.parse(response) : response;
        
        // Vérifier la structure
        if (
          typeof obj === "object" &&
          typeof obj.stress_change === "number" &&
          typeof obj.trust_change === "number" &&
          typeof obj.response === "string" &&
          typeof obj.duration_minutes === "number" &&
          gameState &&
          saveGameState
        ) {
          // Calculer nouveaux états
          const newStress = Math.min(
            100,
            Math.max(0, (gameState.iaStress ?? 0) + obj.stress_change),
          );
          const newTrust = Math.min(
            100,
            Math.max(0, (gameState.iaTrust ?? 0) + obj.trust_change),
          );

          await saveGameState({ iaStress: newStress, iaTrust: newTrust });

          // Ajouter la réponse de Julie (marquée comme lue)
          const newMessage = await addMessage(obj.response, false, 1);

          // Marquer les derniers messages du joueur comme "lus" (Julie les a reçus)
          if (onMessageReceived) {
            onMessageReceived();
          }

          // Si l'IA a proposé une durée, passer Julie en mode "busy"
          if (obj.duration_minutes > 0) {
            const now = Date.now();
            // Appliquer le multiplicateur de temps DEV
            const actualDurationMs =
              obj.duration_minutes * 60 * 1000 * TIME_CONFIG.timeMultiplier;
            const busynessUntil = now + actualDurationMs;

            await saveGameState({
              juliePhase: "busy",
              julieBusyUntil: busynessUntil,
              busyReason: obj.response,
            });
          }
        } else {
          throw new Error("Format réponse IA inattendu (duration_minutes manquante?)");
        }
      } catch (parseErr) {
        console.error("Erreur parsing JSON IA:", parseErr);
        await addMessage(
          "Julie a marmonné dans sa barbe... (réponse illisible)",
          false,
          1,
        );
      }
    } catch (e) {
      console.error(e);
      await addMessage(
        "Le signal est trop faible, je ne reçois rien...",
        false,
        1,
      );
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Stub pour compatibilité (la vraie logique est dans usePhaseManagement)
   */
  const checkAutoProgress = async (
    gameState: GameState,
    saveGameState: (updates: Partial<GameState>) => Promise<void>,
  ) => {
    // La gestion des phases est maintenant dans usePhaseManagement
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
  };
}

