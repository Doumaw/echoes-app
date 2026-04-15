import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GAME_STRINGS } from "../constants/game";
import { theme } from "../constants/theme";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discussions</Text>
      </View>

      <View style={styles.listContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.chatRow,
            pressed && { backgroundColor: theme.colors.surfaceHighlight },
          ]}
          onPress={() => router.push("/chat")}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>?</Text>
          </View>

          <View style={styles.chatInfo}>
            <Text style={styles.contactName}>
              {GAME_STRINGS.defaultContactName}
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              Vous avez un nouveau message.
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.size.title,
    fontWeight: theme.typography.weight.bold,
  },
  listContainer: {
    flex: 1,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold,
  },
  chatInfo: {
    flex: 1,
  },
  contactName: {
    color: theme.colors.text,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.medium,
    marginBottom: 4,
  },
  lastMessage: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.size.md,
  },
});
