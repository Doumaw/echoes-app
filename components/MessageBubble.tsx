import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";
import { Message } from "../types/Message";

interface Props {
  message: Message;
}

export const MessageBubble = React.memo(({ message }: Props) => {
  const isUser = message.isUser === 1;

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.julieContainer,
      ]}
    >
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.julieBubble]}
      >
        <Text style={[styles.text, isUser && styles.userText]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: theme.spacing.xs,
    flexDirection: "row",
  },
  userContainer: {
    justifyContent: "flex-end",
    paddingLeft: "20%",
  },
  julieContainer: {
    justifyContent: "flex-start",
    paddingRight: "20%",
  },
  bubble: {
    padding: theme.spacing.md,
    borderRadius: 18,
    maxWidth: "100%",
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
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
    color: "#000000",
    fontWeight: theme.typography.weight.medium,
  },
});
