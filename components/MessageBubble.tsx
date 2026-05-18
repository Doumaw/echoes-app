import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppTheme } from "@/constants/theme";
import { Message } from "@/types/Message";

interface Props {
  message: Message;
  theme: AppTheme;
}

function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

const MessageBubbleComponent = React.memo(({ message, theme }: Props) => {
  const styles = getStyles(theme);
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
            message.isIaRead === 1
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

const getStyles = (theme: AppTheme) => StyleSheet.create({
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
    backgroundColor: theme.colors.bubbleUser,
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
    color: theme.colors.bubbleUserText,
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
    color: theme.colors.bubbleUserMeta,
  },
  readIndicator: {
    fontSize: 12,
    fontWeight: theme.typography.weight.bold,
    marginLeft: theme.spacing.xs,
  },
  readIndicatorUnread: {
    color: theme.colors.readIndicatorUnread,
  },
  readIndicatorRead: {
    color: theme.colors.readIndicatorRead,
  },
});
