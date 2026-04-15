import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "../constants/theme";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  // Logique d'activation
  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Message..."
        placeholderTextColor={theme.colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        editable={!disabled}
      />

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendButton,
          // Couleur de fond dynamique
          {
            backgroundColor: canSend
              ? theme.colors.primary
              : theme.colors.surfaceHighlight,
          },
          // Feedback tactile
          pressed && canSend && { opacity: 0.7, transform: [{ scale: 0.95 }] },
        ]}
      >
        <Text
          style={[
            styles.sendIcon,
            { color: canSend ? "#000000" : theme.colors.textMuted },
          ]}
        >
          ↑
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 22,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: theme.typography.size.md,
    maxHeight: 120, // Évite que l'input ne mange tout l'écran
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20, // Cercle parfait
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2, // Alignement optique avec l'input
  },
  sendIcon: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: -2, // Ajustement visuel pour centrer la flèche
  },
});
