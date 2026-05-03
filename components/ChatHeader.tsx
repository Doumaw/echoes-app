import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

interface Props {
  name: string;
  status: string;
}

export function ChatHeader({ name, status }: Props) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>{name}</Text>
        <Text // TODO A revoir pour correspondre au En ligne et Hors ligne de Julie (Plus si elle écrit ou non)
          style={[
            styles.headerStatus,
            status.includes("écrire") && { color: theme.colors.primary },
          ]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    minHeight: 70,
  },
  backButton: {
    position: "absolute",
    left: theme.spacing.md,
    zIndex: 10,
    padding: theme.spacing.xs,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: "bold",
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
  },
  headerStatus: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.xs,
    marginTop: 2,
  },
});
