import React from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChatInput } from "../components/ChatInput";
import { MessageBubble } from "../components/MessageBubble";
import { GAME_STRINGS } from "../constants/game";
import { theme } from "../constants/theme";
import { useMessages } from "../hooks/useMessages";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isTyping, sendMessage, simulateJulieResponse } =
    useMessages();

  // Variable locale pour le nom (sera bientôt liée au GameContext/AsyncStorage)
  const contactName = GAME_STRINGS.defaultContactName;

  const handleSend = async (text: string) => {
    await sendMessage(text);
    simulateJulieResponse();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header avec nom variable */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{contactName}</Text>
        <Text style={styles.headerStatus}>
          {isTyping ? "en train d'écrire..." : "En ligne"}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          inverted
          // Indicateur d'écriture textuel sous forme de "système"
          ListHeaderComponent={
            isTyping ? (
              <View style={styles.typingContainer}>
                <Text style={styles.typingText}>
                  {contactName.toLowerCase()} est en train d'écrire...
                </Text>
              </View>
            ) : null
          }
        />

        <ChatInput onSend={handleSend} disabled={isTyping} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.md,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold,
  },
  headerStatus: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.xs,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  typingContainer: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  typingText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.size.xs,
    fontStyle: "italic",
  },
});
