import axios from "axios";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000/api";

export async function uploadSources(formData: FormData) {
  console.log("[API] POST /upload");
  const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function runPipeline(jobId: string) {
  console.log(`[API] POST /run-pipeline/${jobId}`);
  const res = await axios.post(`${API_BASE_URL}/run-pipeline/${jobId}`);
  return res.data;
}

export async function runDemo() {
  console.log("[API] POST /demo");
  const res = await axios.post(`${API_BASE_URL}/demo`);
  return res.data;
}

export async function getResults(jobId: string) {
  console.log(`[API] GET /results/${jobId}`);
  const res = await axios.get(`${API_BASE_URL}/results/${jobId}`);
  return res.data;
}

export async function getStatus(jobId: string) {
  console.log(`[API] GET /results/${jobId}/status`);
  const res = await axios.get(`${API_BASE_URL}/results/${jobId}/status`);
  return res.data;
}
