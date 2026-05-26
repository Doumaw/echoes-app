import { theme } from "@/constants/theme";
import { GameStateProvider } from "@/hooks/GameStateProvider";
import { migrateDbIfNeeded } from "@/services/databaseService";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";

// On garde écran de chargement jusqu'a ce que l'init DB soit fait pour éviter des soucis UI
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  // onInit du SQLiteProvider est déclenché par le Provider UNE SEULE FOIS à l'ouverture de la DB
  // Il se comporte comme un useEffect avec un tableau vide [], inutile d'en rajouter un
  const handleDbInit = async (db: SQLiteDatabase) => {
    try {
      await migrateDbIfNeeded(db);
    } catch (error) {
      console.error("Erreur critique d'initialisation DB:", error);
    } finally {
      await SplashScreen.hideAsync();
    }
  };

  return (
    <SQLiteProvider databaseName="echoes.db" onInit={handleDbInit}>
      <GameStateProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </GameStateProvider>
    </SQLiteProvider>
  );
}
