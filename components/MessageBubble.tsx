import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";
import { Message } from "@/types/Message";

interface Props {
  message: Message;
}

function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

const MessageBubbleComponent = React.memo(({ message }: Props) => {
  const isUser = message.isUser === 1;
  const timeLabel = formatMessageTime(message.createdAt);

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

        <View style={styles.metaRow}>
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {timeLabel}
          </Text>
        </View>
      </View>

      {isUser && (
        <Text
          style={[
            styles.readIndicator,
            message.isRead === 1
              ? styles.readIndicatorRead
              : styles.readIndicatorUnread,
          ]}
        >
          ✓
        </Text>
      )}
    </View>
  );
});

MessageBubbleComponent.displayName = "MessageBubble";

export const MessageBubble = MessageBubbleComponent;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userContainer: {
    justifyContent: "flex-end",
    paddingLeft: "20%",
    gap: theme.spacing.xs,
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
    marginBottom: 6,
  },
  userText: {
    color: "#000000",
    fontWeight: theme.typography.weight.medium,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.xs,
  },
  timestamp: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  userTimestamp: {
    color: "rgba(0, 0, 0, 0.55)",
  },
  readIndicator: {
    fontSize: 12,
    fontWeight: theme.typography.weight.bold,
    marginLeft: theme.spacing.xs,
  },
  readIndicatorUnread: {
    color: "rgba(0, 0, 0, 0.4)",
  },
  readIndicatorRead: {
    color: "#0b6b5c",
  },
});
