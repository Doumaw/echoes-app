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
import { isDev } from "../constants/timeConfig";
import { useGameState } from "../hooks/useGameState";
import { useMessages } from "../hooks/useMessages";
import { usePhaseManagement } from "../hooks/usePhaseManagement";
import { logGameState } from "../services/debug";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages,
    isTyping,
    sendMessage,
    sendFirstSOS,
    getAIResponse,
    loadMessages,
    markAsReadAndRefresh,
    processPendingMessages,
  } = useMessages();
  const { gameState, saveGameState, isLoading, loadState } = useGameState();
  const { triggerFinalTwist, resetGame } = usePhaseManagement(gameState, saveGameState);

  // DEBUG: Log current state
  useEffect(() => {
    if (!isLoading && gameState) {
      console.log("[ChatScreen] GameState loaded:", {
        phase: gameState.juliePhase,
        hasSeenIntro: gameState.hasSeenIntro,
        firstMessageTimestamp: gameState.firstMessageTimestamp,
      });
      logGameState();
    }
  }, [isLoading, gameState]);

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

  // Traiter les messages en attente quand Julie redevient awake
  useEffect(() => {
    if (gameState?.juliePhase === "awake" && gameState?.pendingMessageIds && gameState.pendingMessageIds.length > 0) {
      console.log(`[ChatScreen] Julie is back awake, processing ${gameState.pendingMessageIds.length} pending messages`);
      void processPendingMessages(gameState.pendingMessageIds, gameState, saveGameState);
    }
  }, [gameState?.juliePhase, gameState?.pendingMessageIds, processPendingMessages, gameState, saveGameState]);

  // Marquer les messages de Julie comme "lus" quand on accède au chat
  useEffect(() => {
    if (messages.length > 0) {
      const julieMessageIds = messages
        .filter((m) => m.isUser === 0 && m.isRead === 0)
        .map((m) => m.id);
      
      if (julieMessageIds.length > 0) {
        void markAsReadAndRefresh(julieMessageIds);
      }
    }
  }, [messages, markAsReadAndRefresh]);

  const handleSend = async (text: string) => {
    if (!gameState) return;

    const trimmedText = text.trim();

    if (isDev() && trimmedText === "##twist") {
      await triggerFinalTwist();
      await loadMessages();
      return;
    }

    if (isDev() && trimmedText === "##reset") {
      await resetGame();
      await loadMessages();
      await loadState();
      return;
    }

    const userMsg = await sendMessage(text, true, 0);

    // Si Julie est occupée ou endormie, ajouter le message à la queue
    if (gameState.juliePhase === "busy" || gameState.juliePhase === "asleep") {
      console.log(`[ChatScreen] Julie is ${gameState.juliePhase}, adding to queue`);
      const currentPending = gameState.pendingMessageIds || [];
      await saveGameState({
        pendingMessageIds: [...currentPending, userMsg.id],
      });
      return; // Ne pas appeler l'IA maintenant
    }

    // Sinon, appeler l'IA immédiatement
    void getAIResponse([userMsg, ...messages], gameState, saveGameState, [userMsg.id]);
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
          gameState?.juliePhase === "asleep" ||
          gameState?.juliePhase === "busy" ||
          gameState?.juliePhase === "finalTwist"
            ? "Hors ligne"
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
