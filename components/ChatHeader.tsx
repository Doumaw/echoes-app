import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

interface Props {
  name: string;
  status: string;
}

export function ChatHeader({ name, status }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{name}</Text>
      <Text
        style={[
          styles.headerStatus,
          status.includes("écrire") && { color: theme.colors.primary },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: theme.spacing.md,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
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
