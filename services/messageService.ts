import { Message } from "@/types/Message";

function createMessageId(index = 0) {
  return `${Date.now()}_${index}_${Math.random().toString(36).slice(2)}`;
}

export function createMessage(
  text: string,
  isUser: boolean,
  isIaRead: number = isUser ? 0 : 1,
): Message {
  const now = Date.now();

  return {
    id: createMessageId(),
    text,
    createdAt: now,
    isUser: isUser ? 1 : 0,
    isIaRead,
  };
}

export function createSystemMessages(texts: string[]): Message[] {
  const now = Date.now();

  return texts.map((text, index) => ({
    id: createMessageId(index),
    text,
    createdAt: now + index,
    isUser: 0,
    isIaRead: 1,
  }));
}

export function createAssistantMessage(text: string): Message {
  return createMessage(text, false, 1);
}
