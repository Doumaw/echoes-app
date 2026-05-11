import { SQLiteDatabase } from "expo-sqlite";

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 2;

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
        isUser INTEGER NOT NULL,
        isRead INTEGER NOT NULL DEFAULT 0
      );
    `);

    await db.execAsync(`PRAGMA user_version = 1`);
  }

  // Migration de v1 à v2 : ajouter la colonne isRead si elle n'existe pas
  if (currentDbVersion === 1) {
    console.log("Migration SQLite v1 → v2 (ajout colonne isRead)...");
    
    await db.execAsync(`
      ALTER TABLE messages ADD COLUMN isRead INTEGER NOT NULL DEFAULT 0;
    `).catch(err => {
      // La colonne existe déjà, pas grave
      console.log("Colonne isRead existe déjà");
    });

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}
