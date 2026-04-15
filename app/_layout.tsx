import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { theme } from "../constants/theme";
import { migrateDbIfNeeded } from "../services/db";

// On bloque l'écran d'accueil Expo au lancement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Cette fonction gère le cycle de vie de l'initialisation
  const handleDbInit = async (db: any) => {
    try {
      console.log("Démarrage de la vérification SQLite...");
      await migrateDbIfNeeded(db);
      console.log("SQLite prêt ! Libération de l'écran.");

      // Une fois la migration terminée, on retire le splash screen
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error("Erreur critique d'initialisation DB:", error);
    }
  };

  return (
    // SQLiteProvider met en pause le rendu du <Stack> tant que onInit tourne
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
