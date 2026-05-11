import { useGameState } from "@/hooks/useGameState";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";
import { Message } from "../types/Message";

export default function HomeScreen() {
  const router = useRouter();
  const { gameState, loadState } = useGameState();
  const db = useSQLiteContext();
  const [lastMessage, setLastMessage] = useState<Message | null>(null);

  // Charger le dernier message de Julie uniquement (isUser = 0)
  const loadLastMessage = useCallback(async () => {
    try {
      const result = await db.getFirstAsync<Message>(
        "SELECT * FROM messages WHERE isUser = 0 ORDER BY createdAt DESC LIMIT 1"
      );
      if (result) {
        setLastMessage(result);
      }
    } catch (error) {
      console.error("Erreur lecture dernier message", error);
    }
  }, [db]);

  // Re-charger gameState et dernier message à chaque fois que l'écran gagne le focus
  useFocusEffect(
    useCallback(() => {
      loadState();
      loadLastMessage();
    }, [loadState, loadLastMessage])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
            pressed && { backgroundColor: theme.colors.surfaceHighlight },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
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
