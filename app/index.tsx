import { useGameState } from "@/hooks/useGameState";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";

// TODO : Le nom du contact ne change pas sur l'index après modification dans les paramètres. Il faut relancer l'app... 
export default function HomeScreen() {
  const router = useRouter();
  const { gameState } = useGameState();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discussions</Text>
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
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
              {gameState?.contactName || "Petit problème"}
              {/* TODO: Ajouter des paramètres pour personnaliser le nom */}
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {" "}
              {/* TODO mettre le dernier message de Julie OU faire en sorte que ce soit nouveau et pas un message déjà lu*/}
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
  settingsButton: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    padding: 4,
  },
  settingsIcon: {
    fontSize: 24,
  },
});
