import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types/Message';
import { theme } from '../constants/theme';

interface Props {
  message?: Message;
  isTyping?: boolean; // Nouvelle prop pour le mode "Points de suspension"
}

export const MessageBubble = React.memo(({ message, isTyping }: Props) => {
  // Si c'est Julie (ou l'inconnu), isUser est 0.
  const isUser = message ? message.isUser === 1 : false;

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.julieContainer
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.julieBubble,
        isTyping && styles.typingBubble
      ]}>
        <Text style={[
          styles.text,
          isUser && styles.userText
        ]}>
          {isTyping ? "..." : message?.text}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
    typingBubble: {
    opacity: 0.6,
    width: 50, // Bulle plus petite pour les "..."
    alignItems: 'center',
  },
  container: {
    width: '100%',
    marginVertical: theme.spacing.xs,
    flexDirection: 'row',
  },
  userContainer: {
    justifyContent: 'flex-end',
    paddingLeft: '20%',
  },
  julieContainer: {
    justifyContent: 'flex-start',
    paddingRight: '20%',
  },
  bubble: {
    padding: theme.spacing.md,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: theme.colors.primary, // On utilise ton vert
    borderBottomRightRadius: 4,
  },
  julieBubble: {
    backgroundColor: theme.colors.bubbleJulie,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.surfaceHighlight,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.typography.size.md,
    lineHeight: 22,
  },
  userText: {
    color: '#000000', // Noir pour contraster avec le fond vert
    fontWeight: theme.typography.weight.medium,
  }
});