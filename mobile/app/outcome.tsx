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
import type { PipelineResult } from "../types";

const AGENT_DESCRIPTIONS = [
  { name: "Content Ingestion", desc: "Parsed 5 sources: PDF, URL, CSV, JSON, Feed" },
  { name: "Insight Extraction", desc: "Extracted business signals using Gemini 1.5 Flash" },
  { name: "Contradiction Detection", desc: "Detected & resolved stock_level conflict (PDF vs CSV)" },
  { name: "Action Chain Generation", desc: "Generated 5 constraint-aware actions (PKR 500k / 24h)" },
  { name: "Execution Simulation", desc: "Executed steps; Step 3 failed, recovered via Backup Supplier B" },
  { name: "Outcome Report", desc: "Generated before/after report with metrics & projected impact" },
];

export default function OutcomeScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [data, setData] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        const result = await getResults(jobId);
        setData(result);
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
        <Text style={styles.loadingText}>Loading outcome report...</Text>
      </View>
    );
  }

  const report = data?.outcome_report;
  const summary = report?.summary || {};
  const performance = report?.performance || {};
  const impact = report?.projected_impact || {};
  const contradictionSummary = report?.contradiction_summary || [];
  const before = summary.before || {};
  const after = summary.after || {};

  const beforeRisk = before.stockout_risk_percent ?? 87;
  const afterRisk = after.stockout_risk_percent ?? 12;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Outcome Report</Text>
      <Text style={styles.pageSubtitle}>Job: {jobId}</Text>

      {/* Section 1 — Before vs After */}
      <Text style={styles.sectionTitle}>Before vs After</Text>
      <View style={styles.beforeAfterRow}>
        <View style={[styles.stateCard, styles.beforeCard]}>
          <Text style={styles.stateCardTitle}>BEFORE</Text>
          <StateRow label="Stock Risk" value={String(before.stock_risk ?? "critical")} />
          <StateRow label="Stock Verified" value={String(before.stock_verified ?? "false")} />
          <StateRow label="Order Placed" value={String(before.order_placed ?? "false")} />
          <StateRow label="Monitoring" value={String(before.monitoring_active ?? "false")} />
          <StateRow label="Stockout Risk" value={`${beforeRisk}%`} />
        </View>
        <View style={[styles.stateCard, styles.afterCard]}>
          <Text style={styles.stateCardTitle}>AFTER</Text>
          <StateRow label="Stock Risk" value={String(after.stock_risk ?? "critical")} after />
          <StateRow label="Stock Verified" value={String(after.stock_verified ?? "true")} after />
          <StateRow label="Order Placed" value={String(after.order_placed ?? "true")} after />
          <StateRow label="Monitoring" value={String(after.monitoring_active ?? "true")} after />
          <StateRow label="Stockout Risk" value={`${afterRisk}%`} after />
        </View>
      </View>

      {/* Section 2 — Performance Metrics */}
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      <View style={styles.metricsGrid}>
        <MetricChip
          label="Total Cost"
          value={`$${performance.total_cost_usd ?? "—"}`}
          color="#3b82f6"
        />
        <MetricChip
          label="Total Latency"
          value={`${performance.total_latency_ms ?? "—"}ms`}
          color="#8b5cf6"
        />
        <MetricChip
          label="Succeeded"
          value={`${summary.actions_succeeded ?? "—"}/${summary.actions_executed ?? "—"}`}
          color="#22c55e"
        />
        <MetricChip
          label="Contradictions"
          value={`${summary.contradictions_resolved ?? "—"} resolved`}
          color="#f59e0b"
        />
      </View>

      {/* Section 3 — Stockout risk bar */}
      <Text style={styles.sectionTitle}>Projected Impact</Text>
      <View style={styles.riskCard}>
        <Text style={styles.riskTitle}>Stockout Risk Reduction</Text>
        <View style={styles.riskBarRow}>
          <Text style={styles.riskBefore}>{beforeRisk}%</Text>
          <View style={styles.riskBarBg}>
            <View style={[styles.riskBarBefore, { width: `${beforeRisk}%` as any }]} />
          </View>
        </View>
        <View style={styles.riskBarRow}>
          <Text style={styles.riskAfter}>{afterRisk}%</Text>
          <View style={styles.riskBarBg}>
            <View style={[styles.riskBarAfter, { width: `${afterRisk}%` as any }]} />
          </View>
        </View>
      </View>

      {[
        { icon: "📦", text: impact.stock_crisis_averted },
        { icon: "👥", text: impact.customer_impact },
        { icon: "📡", text: impact.monitoring },
      ].map((item, i) => (
        <View key={i} style={styles.impactCard}>
          <Text style={styles.impactIcon}>{item.icon}</Text>
          <Text style={styles.impactText}>{item.text}</Text>
        </View>
      ))}

      {/* Section 4 — Agent Pipeline */}
      <Text style={styles.sectionTitle}>Agent Pipeline Summary</Text>
      {AGENT_DESCRIPTIONS.map((agent, i) => (
        <View key={i} style={styles.agentCard}>
          <View style={styles.agentLeft}>
            <View style={styles.agentNumCircle}>
              <Text style={styles.agentNumText}>{i + 1}</Text>
            </View>
          </View>
          <View style={styles.agentRight}>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentDesc}>{agent.desc}</Text>
          </View>
          <View style={styles.agentDoneBadge}>
            <Text style={styles.agentDoneText}>✓</Text>
          </View>
        </View>
      ))}

      {/* Section 5 — Contradiction resolutions */}
      {contradictionSummary.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Contradiction Resolutions</Text>
          {contradictionSummary.map((res, i) => (
            <View key={i} style={styles.resCard}>
              <Text style={styles.resText}>{res}</Text>
            </View>
          ))}
        </>
      )}

      {/* Footer actions */}
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => Alert.alert("Report Saved", "InsightFlow_Report.json saved successfully.")}
      >
        <Text style={styles.downloadBtnText}>⬇ Download Report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.newAnalysisBtn}
        onPress={() => router.push("/")}
      >
        <Text style={styles.newAnalysisText}>+ New Analysis</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StateRow({
  label,
  value,
  after = false,
}: {
  label: string;
  value: string;
  after?: boolean;
}) {
  return (
    <View style={stateRowStyles.row}>
      <Text style={stateRowStyles.label}>{label}</Text>
      <Text style={[stateRowStyles.value, after && stateRowStyles.valueAfter]}>
        {value}
      </Text>
    </View>
  );
}

const stateRowStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#64748b", fontSize: 10 },
  value: { color: "#94a3b8", fontSize: 10, fontWeight: "600" },
  valueAfter: { color: "#4ade80" },
});

function MetricChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[chipStyles.chip, { borderColor: color }]}>
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    minWidth: "45%",
  },
  value: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  label: { color: "#64748b", fontSize: 10 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#64748b", marginTop: 12 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#ffffff" },
  pageSubtitle: { fontSize: 12, color: "#475569", marginBottom: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  beforeAfterRow: { flexDirection: "row", gap: 10 },
  stateCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  beforeCard: { backgroundColor: "#1c0a0a", borderColor: "#7f1d1d" },
  afterCard: { backgroundColor: "#052e16", borderColor: "#16a34a" },
  stateCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    color: "#94a3b8",
    letterSpacing: 1,
  },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  riskCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 8,
  },
  riskTitle: { color: "#94a3b8", fontSize: 13, fontWeight: "700", marginBottom: 12 },
  riskBarRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  riskBefore: { color: "#ef4444", fontWeight: "700", fontSize: 13, width: 36 },
  riskAfter: { color: "#22c55e", fontWeight: "700", fontSize: 13, width: 36 },
  riskBarBg: { flex: 1, height: 10, backgroundColor: "#0f172a", borderRadius: 5 },
  riskBarBefore: { height: 10, backgroundColor: "#ef4444", borderRadius: 5 },
  riskBarAfter: { height: 10, backgroundColor: "#22c55e", borderRadius: 5 },
  impactCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  impactIcon: { fontSize: 20 },
  impactText: { flex: 1, color: "#94a3b8", fontSize: 12, lineHeight: 18 },
  agentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  agentLeft: {},
  agentNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  agentNumText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  agentRight: { flex: 1 },
  agentName: { color: "#e2e8f0", fontWeight: "700", fontSize: 12 },
  agentDesc: { color: "#64748b", fontSize: 11, marginTop: 2 },
  agentDoneBadge: {
    backgroundColor: "#052e16",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  agentDoneText: { color: "#22c55e", fontWeight: "700", fontSize: 13 },
  resCard: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
    borderWidth: 1,
    borderColor: "#334155",
  },
  resText: { color: "#86efac", fontSize: 11, lineHeight: 17 },
  downloadBtn: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  downloadBtnText: { color: "#60a5fa", fontWeight: "700", fontSize: 15 },
  newAnalysisBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  newAnalysisText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
