import { SQLiteDatabase } from "expo-sqlite";
import { Message } from "@/types/Message";

export async function getAllMessages(db: SQLiteDatabase) {
  return db.getAllAsync<Message>(
    "SELECT * FROM messages ORDER BY createdAt DESC",
  );
}

export async function getMessagesByIds(
  db: SQLiteDatabase,
  messageIds: string[],
) {
  if (messageIds.length === 0) {
    return [];
  }

  const placeholders = messageIds.map(() => "?").join(",");
  return db.getAllAsync<Message>(
    `SELECT * FROM messages WHERE id IN (${placeholders}) ORDER BY createdAt ASC`,
    messageIds,
  );
}

export async function getLastAssistantMessage(db: SQLiteDatabase) {
  return db.getFirstAsync<Message>(
    "SELECT * FROM messages WHERE isUser = 0 ORDER BY createdAt DESC LIMIT 1",
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
      message.isRead,
    ],
  );
}

export async function markMessagesAsRead(
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
