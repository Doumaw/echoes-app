import { useGameState } from "@/hooks/useGameState";
import { AppTheme, getTheme } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { gameState, saveGameState, isLoading } = useGameState();
  const [tempName, setTempName] = useState(gameState?.contactName || "");

  const currentTheme = getTheme(gameState?.theme || "dark");
  const styles = getStyles(currentTheme);

  useEffect(() => {
    if (gameState?.contactName) {
      setTempName(gameState.contactName);
    }
  }, [gameState?.contactName]);

  if (isLoading || !gameState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  const handleSave = async () => {
    await saveGameState({ contactName: tempName.trim() || gameState.contactName });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Nom du contact</Text>
          <TextInput
            style={styles.input}
            value={tempName}
            onChangeText={setTempName}
            placeholderTextColor={currentTheme.colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Mode Sombre</Text>
            <Switch
              value={gameState.theme === "dark"}
              trackColor={{ false: currentTheme.colors.switchTrackOff, true: currentTheme.colors.primary }}
              onValueChange={(value) => {
                void saveGameState({ theme: value ? "dark" : "light" });
              }}
            />
          </View>
        </View>

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Sauvegarder</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (theme: AppTheme) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { marginRight: 15 },
  backIcon: { color: theme.colors.primary, fontSize: 30, fontWeight: "bold" },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.title,
    fontWeight: theme.typography.weight.bold,
  },
  content: { padding: theme.spacing.md, flex: 1 },
  section: { marginBottom: 30 },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: theme.colors.surfaceHighlight,
    color: theme.colors.text,
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 30,
  },
  saveButtonText: { color: theme.colors.buttonPrimaryText, fontWeight: "bold", fontSize: 16 },
});
