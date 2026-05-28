import { DATABASE_VERSION } from "@/constants/appConstants";
import { SQLiteDatabase } from "expo-sqlite";

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode = 'wal';`);

  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentDbVersion = versionRow?.user_version ?? 0;

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        text TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        isUser INTEGER NOT NULL,
        isRead INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  if (currentDbVersion !== DATABASE_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}
