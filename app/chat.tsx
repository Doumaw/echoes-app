import React, { useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatHeader } from "../components/ChatHeader";
import { ChatInput } from "../components/ChatInput";
import { MessageBubble } from "../components/MessageBubble";
import { theme } from "../constants/theme";
import { useGameState } from "../hooks/useGameState";
import { useMessages } from "../hooks/useMessages";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages,
    isTyping,
    sendMessage,
    sendFirstSOS,
    getAIResponse,
    checkAutoProgress,
  } = useMessages();
  const { gameState, saveGameState, isLoading } = useGameState();

  // Avancement narratif automatique dès ouverture/montée
  useEffect(() => {
    if (!isLoading && gameState && saveGameState) {
      checkAutoProgress(gameState, saveGameState);
    }
  }, [isLoading, gameState?.juliePhase, checkAutoProgress]);

  // Premier message automatique à l'ouverture du chat (repris dans le intro.rs)
  useEffect(() => {
    if (!isLoading && gameState && !gameState.hasSeenIntro && !isTyping) {
      sendFirstSOS(() => saveGameState({ hasSeenIntro: true }));
    }
  }, [isLoading, gameState?.hasSeenIntro]);

  const handleSend = async (text: string) => {
    const userMsg = await sendMessage(text, true);
    getAIResponse([userMsg, ...messages], gameState as any, saveGameState);
  };

  if (isLoading) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ChatHeader
        name={gameState?.contactName || "Petit problème"}
        status={
          gameState?.juliePhase === "asleep"
            ? "Endormie"
            : gameState?.juliePhase === "busy"
            ? "Occupée"
            : gameState?.juliePhase === "finalTwist"
            ? "Hors ligne"
            : isTyping
            ? "En train d'écrire..."
            : "En ligne"
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          inverted
          ListHeaderComponent={
            isTyping ? (
              <Text style={styles.typingHint}>
                Julie est en train d'écrire...
              </Text>
            ) : null
          }
        />
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
