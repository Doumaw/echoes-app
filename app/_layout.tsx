import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { theme } from "../constants/theme";
import { migrateDbIfNeeded } from "../services/db";

// On bloque l'écran d'accueil Expo au lancement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const handleDbInit = async (db: any) => {
    try {
      console.log("Démarrage de la vérification SQLite...");
      await migrateDbIfNeeded(db);
      console.log("SQLite prêt ! Libération de l'écran.");

      await SplashScreen.hideAsync();
    } catch (error) {
      console.error("Erreur critique d'initialisation DB:", error);
    }
  };

  return (
    <SQLiteProvider databaseName="echoes.db" onInit={handleDbInit}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </SQLiteProvider>
  );
}
