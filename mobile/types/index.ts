export interface Source {
  source_id: string;
  source_type: "pdf" | "url" | "csv" | "json" | "feed";
  timestamp: string;
  content_raw: string;
  content_parsed: Record<string, any>;
  credibility_score: number;
  staleness_flag: boolean;
  file_name?: string;
}

export interface Insight {
  insight_id: string;
  source_id: string;
  source_type: string;
  signal: string;
  category: "risk" | "trend" | "opportunity" | "anomaly";
  confidence: number;
  temporal_marker: string;
  metric?: string;
  value?: string;
}

export interface Contradiction {
  metric: string;
  conflict: { source: string; value: string }[];
  explanation: string;
  resolution: string;
  trusted_source: string;
  stale_sources: string[];
}

export interface Action {
  action_id: string;
  step: number;
  title: string;
  type: "query" | "notify" | "update" | "order" | "monitor";
  description: string;
  tool_call: string;
  estimated_cost_pkr: number;
  estimated_time_hours: number;
  feasible: boolean;
  rejection_reason?: string;
  depends_on_step?: number;
  status: "pending" | "running" | "success" | "failed" | "recovered" | "skipped";
}

export interface ExecutionStep {
  step: number;
  title: string;
  status: "success" | "failed" | "recovered" | "skipped";
  state_before: Record<string, any>;
  state_after: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  recovery?: string;
  latency_ms: number;
  cost_usd: number;
  start_time: string;
  end_time: string;
}

export interface OutcomeReport {
  job_id: string;
  generated_at: string;
  summary: Record<string, any>;
  performance: Record<string, any>;
  projected_impact: Record<string, any>;
  contradiction_summary: string[];
  execution_log: ExecutionStep[];
}

export interface AgentLog {
  job_id: string;
  agent_name: string;
  step_description: string;
  reasoning: string;
  tool_call?: string;
  tool_result?: string;
  timestamp: string;
  status: "running" | "done" | "error";
}

export interface PipelineResult {
  job_id: string;
  sources: Source[];
  insights: Insight[];
  contradictions: {
    contradictions: Contradiction[];
    resolutions: string[];
    ground_truth: Record<string, string>;
    stale_source_ids: string[];
  };
  action_chain: Action[];
  execution_log: ExecutionStep[];
  outcome_report: OutcomeReport;
}
