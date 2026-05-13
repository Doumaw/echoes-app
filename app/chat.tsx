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
import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { theme } from "@/constants/theme";
import { useChatController } from "@/hooks/useChatController";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages,
    isTyping,
    isLoading,
    status,
    contactName,
    isInputDisabled,
    handleSend,
  } = useChatController();

  if (isLoading) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ChatHeader name={contactName} status={status} />

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
