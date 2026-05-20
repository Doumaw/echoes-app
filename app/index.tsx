import { useGameState } from "@/hooks/useGameState";
import { useLastAssistantMessage } from "@/hooks/useLastAssistantMessage";
import { AppTheme, getTheme } from "@/constants/theme";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { gameState, loadState, isLoading } = useGameState();
  const { lastMessage, loadLastMessage } = useLastAssistantMessage();

  const currentTheme = getTheme(gameState?.theme || "dark");
  const styles = getStyles(currentTheme);

  useFocusEffect(
    useCallback(() => {
      void loadState();
      void loadLastMessage();
    }, [loadState, loadLastMessage])
  );

  if (isLoading || !gameState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }] }>
        <Text style={styles.headerTitle}>Discussions</Text>
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.listContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.chatRow,
            pressed && { backgroundColor: currentTheme.colors.surfaceHighlight },
          ]}
          onPress={() => router.push("/chat")}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>?</Text>
          </View>

          <View style={styles.chatInfo}>
            <Text style={styles.contactName}>
              {gameState?.contactName || "Petit problème"}
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage?.text || "Aucun message"}
            </Text>
          </View>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.title,
    fontWeight: theme.typography.weight.bold,
  },
  listContainer: {
    flex: 1,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
  },
  chatInfo: {
    flex: 1,
  },
  contactName: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    marginBottom: 4,
  },
  lastMessage: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.md,
  },
  settingsButton: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    padding: 4,
  },
  settingsIcon: {
    fontSize: 24,
  },
});
