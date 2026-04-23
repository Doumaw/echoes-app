import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { GAME_STRINGS } from '../constants/game';
import { aiService } from '../services/aiService';
import { Message } from '../types/Message';

export function useMessages() {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const loadMessages = useCallback(async () => {
    const result = await db.getAllAsync<Message>('SELECT * FROM messages ORDER BY createdAt DESC');
    setMessages(result);
  }, [db]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const addMessage = async (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      createdAt: Date.now(),
      isUser: isUser ? 1 : 0,
    };
    await db.runAsync(
      'INSERT INTO messages (id, text, createdAt, isUser) VALUES (?, ?, ?, ?)',
      [newMessage.id, newMessage.text, newMessage.createdAt, newMessage.isUser]
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

  const getAIResponse = async (history: Message[]) => {
    if (isTyping) return;
    setIsTyping(true);
    try {
      const response = await aiService.getResponse(history);
      await addMessage(response, false);
    } catch (e) {
      console.error(e);
      await addMessage("Le signal est trop faible, je ne reçois rien...", false);
    } finally {
      setIsTyping(false);
    }
  };

  return { messages, isTyping, sendMessage: addMessage, sendFirstSOS, getAIResponse };
}