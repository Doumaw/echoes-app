import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { Message } from "../types/Message";

export function useMessages() {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // 1. Charger l'historique depuis la DB
  const loadMessages = useCallback(async () => {
    try {
      // On récupère les messages triés par date décroissante pour la FlatList inverted
      const result = await db.getAllAsync<Message>(
        "SELECT * FROM messages ORDER BY createdAt DESC",
      );
      setMessages(result);
    } catch (error) {
      console.error("Erreur lors du chargement des messages :", error);
    }
  }, [db]);

  // Charger au montage du hook
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 2. Envoyer un message (Joueur ou Julie)
  const addMessage = async (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      isUser: isUser ? 1 : 0, // SQLite stocke 0 ou 1 pour les entiers
    };

    try {
      // Requête paramétrée avec des "?" pour la sécurité
      await db.runAsync(
        "INSERT INTO messages (id, text, createdAt, isUser) VALUES (?, ?, ?, ?)",
        [
          newMessage.id,
          newMessage.text,
          newMessage.createdAt,
          newMessage.isUser,
        ],
      );

      // Mise à jour de l'état local pour un affichage instantané
      setMessages((prev) => [newMessage, ...prev]);

      return newMessage;
    } catch (error) {
      console.error("Erreur lors de l'insertion du message :", error);
    }
  };

  // 3. Simuler la réponse de Julie (Mock IA)
  const simulateJulieResponse = async () => {
    setIsTyping(true);

    // On simule un délai de réflexion (Phase 4 : Illusion de vie)
    setTimeout(async () => {
      const responses = [
        "Je ne sais pas où je suis...",
        "Il fait si noir ici. Tu es toujours là ?",
        "J'ai entendu un bruit. On aurait dit un craquement.",
        "Merci d'avoir répondu. J'ai cru que j'allais devenir folle.",
      ];
      const randomText =
        responses[Math.floor(Math.random() * responses.length)];

      await addMessage(randomText, false);
      setIsTyping(false);
    }, 2500);
  };

  return {
    messages,
    isTyping,
    sendMessage: (text: string) => addMessage(text, true),
    simulateJulieResponse,
  };
}
