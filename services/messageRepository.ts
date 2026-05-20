import { Message } from "@/types/Message";
import { SQLiteDatabase } from "expo-sqlite";

export async function getAllMessages(db: SQLiteDatabase) {
  return db.getAllAsync<Message>(
    "SELECT id, text, createdAt, isUser, isRead AS isIaRead FROM messages ORDER BY createdAt DESC",
  );
}

export async function getLastAssistantMessage(db: SQLiteDatabase) {
  return db.getFirstAsync<Message>(
    "SELECT id, text, createdAt, isUser, isRead AS isIaRead FROM messages WHERE isUser = 0 ORDER BY createdAt DESC LIMIT 1",
  );
}

export async function insertMessage(db: SQLiteDatabase, message: Message) {
  await db.runAsync(
    "INSERT INTO messages (id, text, createdAt, isUser, isRead) VALUES (?, ?, ?, ?, ?)",
    [
      message.id,
      message.text,
      message.createdAt,
      message.isUser,
      message.isIaRead,
    ],
  );
}

export async function markMessagesAsIaRead(
  db: SQLiteDatabase,
  messageIds: string[],
) {
  if (messageIds.length === 0) {
    return;
  }

  const placeholders = messageIds.map(() => "?").join(",");
  await db.runAsync(
    `UPDATE messages SET isRead = 1 WHERE id IN (${placeholders})`,
    messageIds,
  );
}

export async function clearMessages(db: SQLiteDatabase) {
  await db.runAsync("DELETE FROM messages");
}
