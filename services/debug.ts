import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ECHOES_GAME_STATE";

export async function resetGameState() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("✅ Game state reset successfully");
  } catch (error) {
    console.error("❌ Error resetting game state:", error);
  }
}

export async function logGameState() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      console.log("📊 Current game state:", JSON.stringify(state, null, 2));
    } else {
      console.log("📊 No game state saved yet");
    }
  } catch (error) {
    console.error("❌ Error reading game state:", error);
  }
}
