import { getLastAssistantMessage } from "@/services/messageRepository";
import { Message } from "@/types/Message";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

export function useLastAssistantMessage() {
  const db = useSQLiteContext();
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  const loadLastMessage = useCallback(async () => {
    try {
      const result = await getLastAssistantMessage(db);
      setLastMessage(result ?? null);
    } catch (error) {
      console.error("Erreur lecture dernier message", error);
    }
  }, [db]);

  return { lastMessage, loadLastMessage };
}
