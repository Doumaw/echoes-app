// app/chat.tsx
import React, { useEffect, useRef } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatHeader } from '../components/ChatHeader';
import { ChatInput } from '../components/ChatInput';
import { MessageBubble } from '../components/MessageBubble';
import { theme } from '../constants/theme';
import { useGameState } from '../hooks/useGameState';
import { useMessages } from '../hooks/useMessages';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { messages, isTyping, sendMessage, sendFirstSOS, getAIResponse } = useMessages();
  const { gameState, saveGameState, isLoading } = useGameState();
  const appState = useRef(AppState.currentState);

  // Premier message automatique à l'ouverture du chat (repris dans le intro.rs)
  useEffect(() => {
    if (!isLoading && gameState && !gameState.hasSeenIntro && !isTyping) {
      sendFirstSOS(() => saveGameState({ hasSeenIntro: true }));
    }
  }, [isLoading, gameState?.hasSeenIntro]);

  const handleSend = async (text: string) => {
    const userMsg = await sendMessage(text, true);
    getAIResponse([userMsg, ...messages]);
  };

  if (isLoading) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ChatHeader 
        name={gameState?.playerName || "Inconnu"} 
        status="En ligne" //TODO  Mettre en place le hors ligne quand Julie est occupé, dort etc...
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          inverted
          ListHeaderComponent={isTyping ? (
            <Text style={styles.typingHint}>Julie est en train d'écrire...</Text>
          ) : null}
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
    fontStyle: 'italic', 
    margin: 10 
  }
});