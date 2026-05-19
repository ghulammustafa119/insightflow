import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { uploadSources, runPipeline, runDemo } from "../services/api";

interface PickedFile {
  name: string;
  uri: string;
  mimeType?: string;
}

export default function UploadScreen() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<PickedFile | null>(null);
  const [csvFile, setCsvFile] = useState<PickedFile | null>(null);
  const [jsonFile, setJsonFile] = useState<PickedFile | null>(null);
  const [feedFile, setFeedFile] = useState<PickedFile | null>(null);
  const [newsUrl, setNewsUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const pickFile = async (
    type: string,
    setter: (f: PickedFile) => void
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: type === "pdf" ? "application/pdf" : "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setter({ name: asset.name, uri: asset.uri, mimeType: asset.mimeType });
      }
    } catch {
      Alert.alert("Error", "Could not pick file.");
    }
  };

  const allProvided =
    pdfFile && csvFile && jsonFile && feedFile && newsUrl.trim();

  const handleRunAnalysis = async () => {
    if (!allProvided) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("pdf_file", {
        uri: pdfFile!.uri,
        name: pdfFile!.name,
        type: "application/pdf",
      } as any);
      formData.append("csv_file", {
        uri: csvFile!.uri,
        name: csvFile!.name,
        type: "text/csv",
      } as any);
      formData.append("json_file", {
        uri: jsonFile!.uri,
        name: jsonFile!.name,
        type: "application/json",
      } as any);
      formData.append("feed_file", {
        uri: feedFile!.uri,
        name: feedFile!.name,
        type: "application/json",
      } as any);
      formData.append("news_url", newsUrl.trim());

      const { job_id } = await uploadSources(formData);
      await runPipeline(job_id);
      router.push({ pathname: "/processing", params: { jobId: job_id } });
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      const { job_id } = await runDemo();
      router.push({ pathname: "/processing", params: { jobId: job_id } });
    } catch (e: any) {
      Alert.alert("Demo Failed", e.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sources = [
    {
      label: "PDF Report",
      description: "Warehouse inventory report (PDF)",
      accept: "pdf",
      file: pdfFile,
      setter: setPdfFile,
      icon: "📄",
    },
    {
      label: "Sales CSV",
      description: "Sales data with stock levels",
      accept: "csv",
      file: csvFile,
      setter: setCsvFile,
      icon: "📊",
    },
    {
      label: "Supplier JSON",
      description: "Supplier scorecard data",
      accept: "json",
      file: jsonFile,
      setter: setJsonFile,
      icon: "🏭",
    },
    {
      label: "Complaint Feed",
      description: "Customer complaint feed (JSON)",
      accept: "json",
      file: feedFile,
      setter: setFeedFile,
      icon: "📢",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Upload Sources</Text>
      <Text style={styles.subtitle}>Provide 5 data sources for analysis</Text>

      {sources.map((src) => (
        <View key={src.label} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{src.icon}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{src.label}</Text>
              <Text style={styles.cardDesc}>{src.description}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.pickButton, src.file && styles.pickButtonDone]}
            onPress={() => pickFile(src.accept, src.setter)}
          >
            <Text style={styles.pickButtonText}>
              {src.file ? `✓ ${src.file.name}` : "Choose File"}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🌐</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>News URL</Text>
            <Text style={styles.cardDesc}>Supply chain news article</Text>
          </View>
        </View>
        <TextInput
          style={styles.input}
          placeholder="https://news-article-url.com"
          placeholderTextColor="#475569"
          value={newsUrl}
          onChangeText={setNewsUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !allProvided && styles.disabledButton]}
        onPress={handleRunAnalysis}
        disabled={!allProvided || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Run Analysis</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.demoButton}
        onPress={handleDemo}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.demoButtonText}>⚡ Use Demo Data</Text>
        <Text style={styles.demoButtonSub}>
          Runs pipeline with built-in mock data
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800", color: "#ffffff", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: "700", color: "#e2e8f0" },
  cardDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  pickButton: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  pickButtonDone: { borderColor: "#22c55e" },
  pickButtonText: { color: "#94a3b8", fontSize: 13 },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    padding: 10,
    color: "#e2e8f0",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { backgroundColor: "#1e3a5f", opacity: 0.5 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1e293b" },
  dividerText: { color: "#475569", fontSize: 13 },
  demoButton: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  demoButtonText: { color: "#60a5fa", fontWeight: "700", fontSize: 15 },
  demoButtonSub: { color: "#475569", fontSize: 12, marginTop: 4 },
});
