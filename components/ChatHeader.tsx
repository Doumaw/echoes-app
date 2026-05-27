import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTheme } from "@/constants/theme";

interface Props {
  name: string;
  status: string;
  theme: AppTheme;
  onBack: () => void;
}

export function ChatHeader({ name, status, theme, onBack }: Props) {
  const styles = getStyles(theme);

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>{name}</Text>
        <Text style={styles.headerStatus}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const getStyles = (theme: AppTheme) => StyleSheet.create({
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
