import { AppTheme } from "@/constants/theme";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  theme: AppTheme;
}

export function ChatInput({ onSend, disabled, theme }: Props) {
  const [text, setText] = useState("");
  const styles = getStyles(theme);

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
          {
            backgroundColor: canSend
              ? theme.colors.primary
              : theme.colors.surfaceHighlight,
          },
          pressed && canSend && { opacity: 0.7, transform: [{ scale: 0.95 }] },
        ]}
      >
        <Text
          style={[
            styles.sendIcon,
            { color: canSend ? theme.colors.buttonPrimaryText : theme.colors.textMuted },
          ]}
        >
          ↑
        </Text>
      </Pressable>
    </View>
  );
}

const getStyles = (theme: AppTheme) => StyleSheet.create({
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
    maxHeight: 120, 
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20, 
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  sendIcon: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: -2,
  },
});
