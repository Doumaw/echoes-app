import { GameState } from "@/types/GameState";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { GAME_STRINGS } from "../constants/game";
import { aiService } from "../services/aiService";
import { Message } from "../types/Message";

// Script narratif super simple à modifier
const narrativeScript = [
  // index 0 : introduction jour 1
  { phase: "awake", minElapsed: 0, next: 1, sleepAfter: 10 * 60 * 1000 }, // 10min awake, puis sommeil (prod: plusieurs heures)
  // index 1 : Julie dort
  { phase: "asleep", sleepDuration: 10 * 60 * 1000, next: 2 }, // 10min sommeil (prod: nuit)
  // index 2 : 2e phase réveil/exploration
  { phase: "awake", minElapsed: 1 * 60 * 60 * 1000, next: 3 }, // 1h après le réveil
  { phase: "finalTwist", triggerAfterDays: 4 }, // after 4 days
];

export function useMessages() {
  // Vérifie le temps réel et bascule la phase de Julie si besoin
  const checkAutoProgress = async (
    gameState: GameState,
    saveGameState: (updates: Partial<GameState>) => Promise<void>,
  ) => {
    if (!gameState) return;
    const now = Date.now();
    const { juliePhase, julieWakeUpTime, scriptIndex, firstMessageTimestamp } =
      gameState;

    // Plot twist si > 4 jours depuis le début (prod: 4*24*60*60*1000)
    if (
      firstMessageTimestamp &&
      now - firstMessageTimestamp > 4 * 24 * 60 * 60 * 1000 &&
      juliePhase !== "finalTwist"
    ) {
      await saveGameState({ juliePhase: "finalTwist" });
      await addMessage(
        "🔔 INFO: Le corps d'une jeune fille disparue en 2016 a été retrouvé dans une vieille mine désaffectée.",
        false,
      );
      return;
    }
    // Réveil/après busy
    if (
      (juliePhase === "asleep" || juliePhase === "busy") &&
      julieWakeUpTime &&
      now >= julieWakeUpTime
    ) {
      // Avance le script
      await saveGameState({
        juliePhase: "awake",
        julieWakeUpTime: undefined,
        scriptIndex: scriptIndex + 1,
      });
      await addMessage("Je suis de retour... Tu es là ?", false);
    }
    // (Peut ajouter plus de transitions ici si on modifie le script narratif)
  };
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

  // Ajoute le message et retourne sa référence (inchangé)
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
    // Blocage si Julie dort ou est occupée ou finalTwist
    if (!gameState) return;
    if (
      gameState.juliePhase === "asleep" ||
      gameState.juliePhase === "busy" ||
      gameState.juliePhase === "finalTwist"
    ) {
      // Elle ne répond pas mais on inscrit quand même le message joueur via addMessage dans handleSend côté chat
      return;
    }

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
          await saveGameState({ iaStress: newStress, iaTrust: newTrust });
          await addMessage(obj.response, false);
        } else {
          throw new Error("Format réponse IA inattendu");
        }
      } catch (parseErr) {
        console.error("Erreur parsing JSON IA:", parseErr);
        await addMessage(
          "Julie a marmonné dans sa barbe... (réponse illisible)",
          false,
        );
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
    checkAutoProgress,
  };
}
