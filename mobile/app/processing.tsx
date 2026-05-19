import { useEffect, useRef, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { API_BASE_URL, getStatus } from "../services/api";
import type { AgentLog } from "../types";

const AGENT_NAMES = [
  "Content Ingestion",
  "Insight Extraction",
  "Contradiction Detection",
  "Action Chain Generation",
  "Execution Simulation",
  "Outcome Report",
];

export default function ProcessingScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [done, setDone] = useState(false);
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!jobId) return;

    // SSE streaming
    let active = true;
    let buffer = "";
    const url = `${API_BASE_URL}/stream/${jobId}`;

    const fetchStream = async () => {
      try {
        const response = await fetch(url);
        const reader = response.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();

        while (active) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.event === "done") {
                  setDone(true);
                  return;
                }
                setLogs((prev) => [...prev, data as AgentLog]);
                if (data.status === "done") {
                  setCompletedAgents((prev) => {
                    const next = new Set(prev);
                    AGENT_NAMES.forEach((name) => {
                      if (data.agent_name?.includes(name)) next.add(name);
                    });
                    return next;
                  });
                }
              } catch {}
            }
          }
        }
      } catch {}
    };

    fetchStream();

    // Fallback: poll status
    const poll = setInterval(async () => {
      try {
        const status = await getStatus(jobId);
        if (status.status === "done") {
          setDone(true);
          clearInterval(poll);
        }
      } catch {}
    }, 2000);

    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [jobId]);

  useEffect(() => {
    if (logs.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [logs]);

  const statusColor = (status: string) => {
    if (status === "done") return "#22c55e";
    if (status === "error") return "#ef4444";
    return "#f59e0b";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {done ? "Analysis Complete! ✓" : "Processing..."}
        </Text>
        {!done && <ActivityIndicator color="#3b82f6" style={{ marginLeft: 10 }} />}
      </View>

      {/* Agent progress circles */}
      <View style={styles.agentRow}>
        {AGENT_NAMES.map((name, i) => {
          const isDone = completedAgents.has(name);
          return (
            <View key={name} style={styles.agentItem}>
              <View
                style={[
                  styles.agentCircle,
                  isDone && styles.agentCircleDone,
                ]}
              >
                <Text style={styles.agentNum}>{i + 1}</Text>
              </View>
              <Text style={styles.agentLabel} numberOfLines={2}>
                {name}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Log feed */}
      <ScrollView
        ref={scrollRef}
        style={styles.logScroll}
        contentContainerStyle={styles.logContent}
      >
        {logs.map((log, idx) => (
          <View key={idx} style={styles.logCard}>
            <View style={styles.logTop}>
              <Text style={styles.logAgent}>{log.agent_name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(log.status) + "33" },
                ]}
              >
                <Text
                  style={[styles.statusText, { color: statusColor(log.status) }]}
                >
                  {log.status}
                </Text>
              </View>
            </View>
            <Text style={styles.logDesc}>{log.step_description}</Text>
            {log.reasoning ? (
              <Text style={styles.logReason}>{log.reasoning}</Text>
            ) : null}
            {log.tool_call ? (
              <Text style={styles.logTool}>$ {log.tool_call}</Text>
            ) : null}
            <Text style={styles.logTime}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {logs.length === 0 && !done && (
          <Text style={styles.waiting}>Waiting for agent logs...</Text>
        )}
      </ScrollView>

      {done && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() =>
              router.push({ pathname: "/insights", params: { jobId } })
            }
          >
            <Text style={styles.viewButtonText}>View Results →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#ffffff" },
  agentRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  agentItem: { alignItems: "center", width: 52 },
  agentCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  agentCircleDone: { backgroundColor: "#16a34a", borderColor: "#22c55e" },
  agentNum: { color: "#fff", fontWeight: "700", fontSize: 13 },
  agentLabel: {
    color: "#64748b",
    fontSize: 9,
    textAlign: "center",
    marginTop: 4,
  },
  logScroll: { flex: 1 },
  logContent: { padding: 16, gap: 8 },
  logCard: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  logTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  logAgent: { color: "#60a5fa", fontWeight: "700", fontSize: 12, flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: "600" },
  logDesc: { color: "#e2e8f0", fontSize: 13, marginBottom: 4 },
  logReason: { color: "#94a3b8", fontSize: 12, marginBottom: 4 },
  logTool: {
    color: "#4ade80",
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  logTime: { color: "#475569", fontSize: 10 },
  waiting: { color: "#475569", textAlign: "center", marginTop: 40, fontSize: 14 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#1e293b" },
  viewButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  viewButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
