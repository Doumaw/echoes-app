import { SQLiteDatabase } from "expo-sqlite";

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;

  // Optimisation : Write-Ahead Logging
  await db.execAsync(`PRAGMA journal_mode = 'wal';`);

  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    console.log("Initialisation de la base de données SQLite (v1)...");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        text TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        isUser INTEGER NOT NULL
      );
    `);

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}
