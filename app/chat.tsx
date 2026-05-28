import React from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { AppTheme, getTheme } from "@/constants/theme";
import { useChat } from "@/hooks/useChat";
import { useGameState } from "@/hooks/useGameState";
import { JuliePhase } from "@/types/GameState";

function getChatStatus(juliePhase: JuliePhase | undefined) {
  if (!juliePhase) {
    return "Problème de connexion";
  }

  if (
    juliePhase === "asleep" ||
    juliePhase === "busy" ||
    juliePhase === "finalTwist"
  ) {
    return "Hors ligne";
  }

  return "En ligne";
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages,
    isTyping,
    handleSend,
  } = useChat();
  const { gameState, isGameStateLoading } = useGameState();

  const currentTheme = getTheme(gameState?.theme ?? "dark");
  const contactName = gameState?.contactName ?? "Numéro Inconnu";
  const status = getChatStatus(gameState?.juliePhase);
  const styles = getStyles(currentTheme);

  if (isGameStateLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ChatHeader
        name={contactName}
        status={status}
        theme={currentTheme}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} theme={currentTheme} />
          )}
          contentContainerStyle={styles.listContent}
          inverted
          ListHeaderComponent={ // Flatlist inversée dans ca se met nickel au dessus de l'input
            isTyping ? (
              <Text style={styles.typingHint}>
                En train d&apos;écrire...
              </Text>
            ) : null
          }
        />

        <ChatInput
          onSend={handleSend}
          theme={currentTheme}
        />
      </KeyboardAvoidingView>
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
  flex: { flex: 1 },
  listContent: { padding: theme.spacing.md },
  typingHint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
    margin: 10,
  },
});
