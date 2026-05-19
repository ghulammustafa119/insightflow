import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Autonomous AI Agent</Text>
        </View>

        <Text style={styles.title}>InsightFlow</Text>
        <Text style={styles.subtitle}>
          Autonomous Content-to-Action Agent
        </Text>
        <Text style={styles.description}>
          Upload multiple data sources and watch 6 AI agents extract insights,
          detect contradictions, and execute a constraint-aware action chain.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/upload")}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Start New Analysis</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          {["6 AI Agents", "Contradiction Detection", "Auto Recovery"].map((f) => (
            <View key={f} style={styles.featureChip}>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>Powered by Google Gemini</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  badge: {
    backgroundColor: "#1e3a5f",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  badgeText: { color: "#60a5fa", fontSize: 12, fontWeight: "600" },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  features: {
    flexDirection: "row",
    gap: 8,
    marginTop: 32,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featureChip: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  featureText: { color: "#94a3b8", fontSize: 12 },
  footer: { color: "#334155", textAlign: "center", fontSize: 12, paddingBottom: 24 },
});
