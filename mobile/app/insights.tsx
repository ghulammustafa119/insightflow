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
import type { PipelineResult, Insight, Contradiction, Source } from "../types";

type Tab = "insights" | "contradictions" | "sources";

const CATEGORY_COLORS: Record<string, string> = {
  risk: "#ef4444",
  trend: "#f59e0b",
  opportunity: "#22c55e",
  anomaly: "#a855f7",
};

const SOURCE_COLORS: Record<string, string> = {
  pdf: "#f59e0b",
  csv: "#22c55e",
  json: "#3b82f6",
  url: "#ec4899",
  feed: "#8b5cf6",
};

export default function InsightsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("insights");
  const [data, setData] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        const result = await getResults(jobId);
        if (result.status === "processing") {
          setTimeout(load, 2000);
        } else {
          setData(result);
          setLoading(false);
        }
      } catch (e: any) {
        Alert.alert("Error", e.message);
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  const insights: Insight[] = data?.insights || [];
  const contradictions: Contradiction[] = data?.contradictions?.contradictions || [];
  const sources: Source[] = data?.sources || [];

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["insights", "contradictions", "sources"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "insights"
                ? `Insights (${insights.length})`
                : tab === "contradictions"
                ? `Contradictions (${contradictions.length})`
                : `Sources (${sources.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === "insights" && (
          <>
            {insights.map((insight) => (
              <View
                key={insight.insight_id}
                style={[
                  styles.insightCard,
                  { borderLeftColor: CATEGORY_COLORS[insight.category] || "#64748b" },
                ]}
              >
                <View style={styles.insightTop}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: CATEGORY_COLORS[insight.category] + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: CATEGORY_COLORS[insight.category] },
                      ]}
                    >
                      {insight.category.toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.sourceBadge,
                      { backgroundColor: SOURCE_COLORS[insight.source_type] + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sourceText,
                        { color: SOURCE_COLORS[insight.source_type] },
                      ]}
                    >
                      {insight.source_type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.signalText}>{insight.signal}</Text>

                {insight.metric && (
                  <Text style={styles.metricText}>
                    {insight.metric}: {insight.value}
                  </Text>
                )}

                <View style={styles.confidenceRow}>
                  <Text style={styles.confLabel}>
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </Text>
                  <View style={styles.confBarBg}>
                    <View
                      style={[
                        styles.confBarFill,
                        {
                          width: `${insight.confidence * 100}%` as any,
                          backgroundColor: CATEGORY_COLORS[insight.category],
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text style={styles.dateText}>{insight.temporal_marker}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === "contradictions" && (
          <>
            {contradictions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No contradictions detected</Text>
              </View>
            ) : (
              contradictions.map((c, i) => (
                <View key={i} style={styles.contradictionCard}>
                  <View style={styles.contradictionHeader}>
                    <Text style={styles.contradictionTitle}>⚠ Contradiction Detected</Text>
                    <Text style={styles.metricBadge}>{c.metric}</Text>
                  </View>

                  <View style={styles.conflictRow}>
                    {c.conflict.map((cf, j) => {
                      const isTrusted = cf.source === c.trusted_source;
                      return (
                        <View
                          key={j}
                          style={[
                            styles.conflictItem,
                            isTrusted ? styles.conflictTrusted : styles.conflictStale,
                          ]}
                        >
                          <Text style={styles.conflictSource}>{cf.source}</Text>
                          <Text
                            style={[
                              styles.conflictValue,
                              !isTrusted && styles.conflictValueStale,
                            ]}
                          >
                            {cf.value}
                          </Text>
                          {isTrusted && (
                            <Text style={styles.trustedBadge}>✓ Trusted</Text>
                          )}
                          {!isTrusted && (
                            <Text style={styles.staleBadge}>✗ Stale</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.resolutionBox}>
                    <Text style={styles.resolutionLabel}>Resolution</Text>
                    <Text style={styles.resolutionText}>{c.resolution}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "sources" && (
          <>
            {sources.map((src) => (
              <View key={src.source_id} style={styles.sourceCard}>
                <View style={styles.sourceTop}>
                  <View
                    style={[
                      styles.sourceTypeBadge,
                      { backgroundColor: SOURCE_COLORS[src.source_type] + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sourceTypeText,
                        { color: SOURCE_COLORS[src.source_type] },
                      ]}
                    >
                      {src.source_type.toUpperCase()}
                    </Text>
                  </View>
                  {src.staleness_flag && (
                    <View style={styles.staleFlagBadge}>
                      <Text style={styles.staleFlagText}>STALE</Text>
                    </View>
                  )}
                  <Text style={styles.sourceId}>{src.source_id}</Text>
                </View>

                {src.file_name && (
                  <Text style={styles.fileName}>{src.file_name}</Text>
                )}
                <Text style={styles.sourceDate}>{src.timestamp}</Text>

                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>
                    Credibility: {Math.round(src.credibility_score * 100)}%
                  </Text>
                  <View style={styles.credBarBg}>
                    <View
                      style={[
                        styles.credBarFill,
                        {
                          width: `${src.credibility_score * 100}%` as any,
                          backgroundColor: SOURCE_COLORS[src.source_type],
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push({ pathname: "/actions", params: { jobId } })}
        >
          <Text style={styles.nextButtonText}>View Action Chain →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#64748b", marginTop: 12 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    backgroundColor: "#0f172a",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#3b82f6" },
  tabText: { color: "#64748b", fontSize: 11, fontWeight: "600" },
  tabTextActive: { color: "#3b82f6" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Insight card
  insightCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  insightTop: { flexDirection: "row", gap: 8, marginBottom: 8 },
  categoryBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 10, fontWeight: "700" },
  sourceBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sourceText: { fontSize: 10, fontWeight: "700" },
  signalText: { color: "#e2e8f0", fontSize: 13, lineHeight: 20, marginBottom: 6 },
  metricText: { color: "#94a3b8", fontSize: 12, marginBottom: 8 },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  confLabel: { color: "#64748b", fontSize: 11, width: 110 },
  confBarBg: { flex: 1, height: 4, backgroundColor: "#0f172a", borderRadius: 2 },
  confBarFill: { height: 4, borderRadius: 2 },
  dateText: { color: "#475569", fontSize: 10, marginTop: 4 },

  // Contradiction card
  contradictionCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  contradictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  contradictionTitle: { color: "#f87171", fontWeight: "700", fontSize: 13 },
  metricBadge: {
    backgroundColor: "#7f1d1d",
    color: "#fca5a5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
  },
  conflictRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  conflictItem: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  conflictTrusted: { backgroundColor: "#052e16", borderColor: "#16a34a" },
  conflictStale: { backgroundColor: "#1c0a0a", borderColor: "#7f1d1d" },
  conflictSource: { color: "#94a3b8", fontSize: 10, marginBottom: 4 },
  conflictValue: { color: "#e2e8f0", fontSize: 13, fontWeight: "700" },
  conflictValueStale: { textDecorationLine: "line-through", color: "#64748b" },
  trustedBadge: { color: "#22c55e", fontSize: 10, fontWeight: "700", marginTop: 4 },
  staleBadge: { color: "#ef4444", fontSize: 10, fontWeight: "700", marginTop: 4 },
  resolutionBox: {
    backgroundColor: "#052e16",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#16a34a",
  },
  resolutionLabel: { color: "#22c55e", fontSize: 11, fontWeight: "700", marginBottom: 4 },
  resolutionText: { color: "#86efac", fontSize: 12, lineHeight: 18 },

  // Source card
  sourceCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  sourceTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sourceTypeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sourceTypeText: { fontSize: 10, fontWeight: "700" },
  staleFlagBadge: { backgroundColor: "#7f1d1d", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  staleFlagText: { color: "#f87171", fontSize: 10, fontWeight: "700" },
  sourceId: { color: "#475569", fontSize: 11, marginLeft: "auto" },
  fileName: { color: "#94a3b8", fontSize: 12, marginBottom: 2 },
  sourceDate: { color: "#475569", fontSize: 11, marginBottom: 8 },
  credRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  credLabel: { color: "#64748b", fontSize: 11, width: 110 },
  credBarBg: { flex: 1, height: 4, backgroundColor: "#0f172a", borderRadius: 2 },
  credBarFill: { height: 4, borderRadius: 2 },

  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: "#22c55e", fontSize: 16, fontWeight: "600" },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#1e293b" },
  nextButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
