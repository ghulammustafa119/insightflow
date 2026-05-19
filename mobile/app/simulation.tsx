import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { getResults } from "../services/api";
import type { ExecutionStep, PipelineResult } from "../types";

const STATUS_COLORS: Record<string, string> = {
  success: "#22c55e",
  failed: "#ef4444",
  recovered: "#f59e0b",
  skipped: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  success: "✓ Success",
  failed: "✗ Failed",
  recovered: "⚡ Recovered via Fallback",
  skipped: "— Skipped",
};

export default function SimulationScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const recoveryAnim = useRef(new Animated.Value(0)).current;
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      try {
        const result: PipelineResult = await getResults(jobId);
        setSteps(result.execution_log || []);
      } catch (e: any) {
        Alert.alert("Error", e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  const currentStep = steps[currentIdx];
  const isLast = currentIdx === steps.length - 1;

  const advanceStep = () => {
    if (currentIdx < steps.length - 1) {
      setShowRecovery(false);
      setCurrentIdx((i) => i + 1);
    }
  };

  useEffect(() => {
    if (currentStep?.status === "recovered") {
      setShowRecovery(false);
      setTimeout(() => {
        setShowRecovery(true);
        Animated.timing(recoveryAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 800);
    } else {
      recoveryAnim.setValue(0);
      setShowRecovery(false);
    }
  }, [currentIdx]);

  const handlePlayAll = () => {
    if (autoPlaying) {
      clearInterval(autoPlayRef.current!);
      setAutoPlaying(false);
      return;
    }
    setAutoPlaying(true);
    autoPlayRef.current = setInterval(() => {
      setCurrentIdx((i) => {
        if (i >= steps.length - 1) {
          clearInterval(autoPlayRef.current!);
          setAutoPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1800);
  };

  useEffect(() => () => clearInterval(autoPlayRef.current!), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
        <Text style={styles.loadingText}>Loading simulation...</Text>
      </View>
    );
  }

  if (!currentStep) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No execution data found.</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[currentStep.status] || "#64748b";

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIdx + 1) / steps.length) * 100}%` as any },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>
        Step {currentIdx + 1} of {steps.length}
      </Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Main step card */}
        <View style={[styles.stepCard, { borderColor: statusColor }]}>
          <View style={styles.stepCardTop}>
            <View style={[styles.stepCircle, { backgroundColor: statusColor }]}>
              <Text style={styles.stepCircleNum}>{currentStep.step}</Text>
            </View>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
          </View>

          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "22", borderColor: statusColor },
            ]}
          >
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {STATUS_LABELS[currentStep.status]}
            </Text>
          </View>

          {/* Step 3 special failure animation */}
          {currentStep.status === "recovered" && (
            <View style={styles.failureBox}>
              <Text style={styles.failureTitle}>⚠ Error Occurred</Text>
              <Text style={styles.failureText}>{currentStep.error}</Text>
            </View>
          )}

          {currentStep.status === "recovered" && showRecovery && (
            <Animated.View style={[styles.recoveryBox, { opacity: recoveryAnim }]}>
              <Text style={styles.recoveryTitle}>
                ⚡ Recovery: Switching to Backup Supplier B...
              </Text>
              <Text style={styles.recoveryText}>{currentStep.recovery}</Text>
            </Animated.View>
          )}

          {currentStep.status === "failed" && (
            <View style={styles.failureBox}>
              <Text style={styles.failureTitle}>✗ Failed</Text>
              <Text style={styles.failureText}>{currentStep.error}</Text>
            </View>
          )}

          {/* State before / after */}
          <View style={styles.stateRow}>
            <View style={styles.stateCol}>
              <Text style={styles.stateLabel}>Before</Text>
              {Object.entries(currentStep.state_before).slice(0, 4).map(([k, v]) => (
                <View key={k} style={styles.stateItem}>
                  <Text style={styles.stateKey}>{k}</Text>
                  <Text style={styles.stateVal}>{String(v)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.stateDivider} />
            <View style={styles.stateCol}>
              <Text style={styles.stateLabel}>After</Text>
              {Object.entries(currentStep.state_after).slice(0, 4).map(([k, v]) => (
                <View key={k} style={styles.stateItem}>
                  <Text style={styles.stateKey}>{k}</Text>
                  <Text style={[styles.stateVal, styles.stateValAfter]}>
                    {String(v)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Result */}
          {currentStep.result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Result</Text>
              {Object.entries(currentStep.result)
                .slice(0, 5)
                .map(([k, v]) => (
                  <Text key={k} style={styles.resultItem}>
                    <Text style={styles.resultKey}>{k}: </Text>
                    {String(v)}
                  </Text>
                ))}
            </View>
          )}

          {/* Metrics chips */}
          <View style={styles.metricsRow}>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>⏱ {currentStep.latency_ms}ms</Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricChipText}>${currentStep.cost_usd}</Text>
            </View>
          </View>
        </View>

        {/* Step summary log */}
        <Text style={styles.logTitle}>All Steps</Text>
        {steps.map((s, i) => (
          <TouchableOpacity
            key={s.step}
            style={[
              styles.logRow,
              i === currentIdx && styles.logRowActive,
            ]}
            onPress={() => { setCurrentIdx(i); setShowRecovery(false); }}
          >
            <View
              style={[
                styles.logDot,
                { backgroundColor: i <= currentIdx ? STATUS_COLORS[s.status] : "#334155" },
              ]}
            />
            <Text style={styles.logStepText}>
              {s.step}. {s.title}
            </Text>
            <Text style={[styles.logStatus, { color: STATUS_COLORS[s.status] }]}>
              {s.status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={styles.footer}>
        {!isLast ? (
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.nextStepBtn}
              onPress={advanceStep}
              disabled={autoPlaying}
            >
              <Text style={styles.nextStepText}>Next Step →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playAllBtn, autoPlaying && styles.playAllBtnStop]}
              onPress={handlePlayAll}
            >
              <Text style={styles.playAllText}>
                {autoPlaying ? "⏹ Stop" : "▶ Play All"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.outcomeBtn}
            onPress={() =>
              router.push({ pathname: "/outcome", params: { jobId } })
            }
          >
            <Text style={styles.outcomeBtnText}>View Outcome Report →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#64748b", marginTop: 12 },
  progressBar: { height: 3, backgroundColor: "#1e293b" },
  progressFill: { height: 3, backgroundColor: "#3b82f6" },
  progressLabel: { color: "#64748b", fontSize: 12, textAlign: "center", paddingVertical: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 20 },
  stepCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
  },
  stepCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleNum: { color: "#fff", fontWeight: "700", fontSize: 16 },
  stepTitle: { flex: 1, color: "#e2e8f0", fontWeight: "700", fontSize: 15 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statusLabel: { fontWeight: "700", fontSize: 13 },
  failureBox: {
    backgroundColor: "#1c0a0a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7f1d1d",
    marginBottom: 10,
  },
  failureTitle: { color: "#f87171", fontWeight: "700", fontSize: 12, marginBottom: 4 },
  failureText: { color: "#fca5a5", fontSize: 12 },
  recoveryBox: {
    backgroundColor: "#1c1500",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d97706",
    marginBottom: 10,
  },
  recoveryTitle: { color: "#fbbf24", fontWeight: "700", fontSize: 12, marginBottom: 4 },
  recoveryText: { color: "#fde68a", fontSize: 12 },
  stateRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stateCol: { flex: 1 },
  stateDivider: { width: 1, backgroundColor: "#334155" },
  stateLabel: { color: "#64748b", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  stateItem: { marginBottom: 4 },
  stateKey: { color: "#475569", fontSize: 10 },
  stateVal: { color: "#94a3b8", fontSize: 11 },
  stateValAfter: { color: "#60a5fa" },
  resultBox: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  resultLabel: { color: "#64748b", fontSize: 11, fontWeight: "700", marginBottom: 6 },
  resultItem: { color: "#94a3b8", fontSize: 11, marginBottom: 2 },
  resultKey: { color: "#60a5fa" },
  metricsRow: { flexDirection: "row", gap: 8 },
  metricChip: {
    backgroundColor: "#0f172a",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  metricChipText: { color: "#64748b", fontSize: 11 },
  logTitle: { color: "#475569", fontSize: 12, fontWeight: "700", marginTop: 4 },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
  },
  logRowActive: { backgroundColor: "#1e293b" },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logStepText: { flex: 1, color: "#94a3b8", fontSize: 12 },
  logStatus: { fontSize: 11, fontWeight: "600" },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#1e293b" },
  footerRow: { flexDirection: "row", gap: 10 },
  nextStepBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#3b82f6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  nextStepText: { color: "#60a5fa", fontWeight: "700" },
  playAllBtn: {
    flex: 1,
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  playAllBtnStop: { backgroundColor: "#64748b" },
  playAllText: { color: "#fff", fontWeight: "700" },
  outcomeBtn: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  outcomeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
