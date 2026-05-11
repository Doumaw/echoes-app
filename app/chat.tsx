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
import { usePhaseManagement } from "../hooks/usePhaseManagement";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages,
    isTyping,
    sendMessage,
    sendFirstSOS,
    getAIResponse,
  } = useMessages();
  const { gameState, saveGameState, isLoading } = useGameState();
  const { markMessagesAsRead } = usePhaseManagement(
    gameState,
    saveGameState,
  );

  // Premier message automatique à l'ouverture du chat (repris dans le intro.rs)
  useEffect(() => {
    if (!isLoading && gameState && !gameState.hasSeenIntro && !isTyping) {
      sendFirstSOS(() => {
        // Définir firstMessageTimestamp au premier message de Julie
        saveGameState({ 
          hasSeenIntro: true,
          firstMessageTimestamp: Date.now(),
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, gameState?.hasSeenIntro]);

  // Marquer les messages de Julie comme "lus" quand on accède au chat
  useEffect(() => {
    if (messages.length > 0) {
      const julieMessageIds = messages
        .filter((m) => m.isUser === 0 && m.isRead === 0)
        .map((m) => m.id);
      
      if (julieMessageIds.length > 0) {
        markMessagesAsRead(julieMessageIds);
      }
    }
  }, [messages, markMessagesAsRead]);

  const handleSend = async (text: string) => {
    const userMsg = await sendMessage(text, true, 1);
    getAIResponse([userMsg, ...messages], gameState as any, saveGameState);
  };

  if (isLoading) return null;

  const isInputDisabled = isTyping || gameState?.juliePhase === "finalTwist";

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
          keyExtractor={(m, i) => m.id + "_" + i}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          inverted
          ListHeaderComponent={
            isTyping ? (
              <Text style={styles.typingHint}>
                En train d&apos;écrire...
              </Text>
            ) : null
          }
        />

        <ChatInput onSend={handleSend} disabled={isInputDisabled} />
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
