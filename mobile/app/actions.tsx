import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getResults } from "../services/api";
import type { Action, PipelineResult } from "../types";

const TYPE_COLORS: Record<string, string> = {
  query: "#3b82f6",
  notify: "#f59e0b",
  update: "#8b5cf6",
  order: "#ef4444",
  monitor: "#22c55e",
};

const TYPE_ICONS: Record<string, string> = {
  query: "🔍",
  notify: "🔔",
  update: "✏️",
  order: "📦",
  monitor: "👁",
};

export default function ActionsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        const result: PipelineResult = await getResults(jobId);
        setActions(result.action_chain || []);
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
        <Text style={styles.loadingText}>Loading action chain...</Text>
      </View>
    );
  }

  const totalCost = actions.reduce((s, a) => s + (a.estimated_cost_pkr || 0), 0);
  const totalTime = actions.reduce((s, a) => s + (a.estimated_time_hours || 0), 0);
  const feasibleCount = actions.filter((a) => a.feasible).length;

  return (
    <View style={styles.container}>
      {/* Constraints banner */}
      <View style={styles.constraintsBanner}>
        <Text style={styles.constraintsText}>
          💰 Budget: PKR 500,000 &nbsp;|&nbsp; ⏱ Deadline: 24 hours
        </Text>
        <Text style={styles.constraintsSub}>
          {feasibleCount}/{actions.length} feasible · PKR {totalCost.toLocaleString()} · {totalTime.toFixed(1)}h
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {actions.map((action, idx) => {
          const isLast = idx === actions.length - 1;
          const color = TYPE_COLORS[action.type] || "#64748b";
          return (
            <View key={action.action_id}>
              <View style={styles.timelineRow}>
                {/* Left: number + connector */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.stepCircle, { backgroundColor: color }]}>
                    <Text style={styles.stepNum}>{action.step}</Text>
                  </View>
                  {!isLast && <View style={styles.connector} />}
                </View>

                {/* Right: card */}
                <View
                  style={[
                    styles.actionCard,
                    !action.feasible && styles.actionCardRejected,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.actionIcon}>{TYPE_ICONS[action.type]}</Text>
                    <Text style={styles.actionTitle} numberOfLines={2}>
                      {action.title}
                    </Text>
                    <View
                      style={[
                        styles.feasibilityBadge,
                        action.feasible
                          ? styles.feasibleBadge
                          : styles.rejectedBadge,
                      ]}
                    >
                      <Text style={styles.feasibilityText}>
                        {action.feasible ? "✓ Feasible" : "✗ Rejected"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.actionDesc}>{action.description}</Text>

                  <Text style={styles.toolCall}>$ {action.tool_call}</Text>

                  {!action.feasible && action.rejection_reason && (
                    <View style={styles.rejectionBox}>
                      <Text style={styles.rejectionText}>
                        {action.rejection_reason}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: color + "22" },
                      ]}
                    >
                      <Text style={[styles.typeText, { color }]}>
                        {action.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.costText}>
                      PKR {action.estimated_cost_pkr.toLocaleString()}
                    </Text>
                    <Text style={styles.timeText}>
                      {action.estimated_time_hours}h
                    </Text>
                    {action.depends_on_step && (
                      <Text style={styles.depText}>
                        depends on step {action.depends_on_step}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.simButton}
          onPress={() =>
            router.push({ pathname: "/simulation", params: { jobId } })
          }
        >
          <Text style={styles.simButtonText}>▶ Start Simulation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#64748b", marginTop: 12 },
  constraintsBanner: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    alignItems: "center",
  },
  constraintsText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
  constraintsSub: { color: "#475569", fontSize: 11, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  timelineRow: { flexDirection: "row", marginBottom: 0 },
  timelineLeft: { width: 44, alignItems: "center" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  stepNum: { color: "#fff", fontWeight: "700", fontSize: 14 },
  connector: { width: 2, flex: 1, backgroundColor: "#1e293b", minHeight: 16 },
  actionCard: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    marginLeft: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionCardRejected: { borderColor: "#7f1d1d", opacity: 0.8 },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  actionIcon: { fontSize: 18 },
  actionTitle: { flex: 1, color: "#e2e8f0", fontWeight: "700", fontSize: 13 },
  feasibilityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  feasibleBadge: { backgroundColor: "#052e16" },
  rejectedBadge: { backgroundColor: "#7f1d1d" },
  feasibilityText: { fontSize: 10, fontWeight: "700", color: "#22c55e" },
  actionDesc: { color: "#94a3b8", fontSize: 12, lineHeight: 18, marginBottom: 8 },
  toolCall: {
    color: "#4ade80",
    fontSize: 11,
    fontFamily: "monospace",
    backgroundColor: "#0a1628",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  rejectionBox: {
    backgroundColor: "#1c0a0a",
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    marginBottom: 8,
  },
  rejectionText: { color: "#f87171", fontSize: 11 },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: "700" },
  costText: { color: "#64748b", fontSize: 11 },
  timeText: { color: "#64748b", fontSize: 11 },
  depText: { color: "#475569", fontSize: 10, fontStyle: "italic" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#1e293b" },
  simButton: {
    backgroundColor: "#7c3aed",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  simButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
