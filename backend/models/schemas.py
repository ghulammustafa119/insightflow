from typing import List, Literal, Optional
from pydantic import BaseModel, Field

CREDIBILITY_WEIGHTS = {
    "pdf": 0.85,
    "csv": 0.95,
    "json": 0.90,
    "url": 0.60,
    "feed": 0.75,
}


class SourceObject(BaseModel):
    source_id: str
    source_type: Literal["pdf", "url", "csv", "json", "feed"]
    timestamp: str
    content_raw: str
    content_parsed: dict
    credibility_score: float = Field(ge=0.0, le=1.0)
    staleness_flag: bool = False
    file_name: Optional[str] = None


class InsightObject(BaseModel):
    insight_id: str
    source_id: str
    source_type: str
    signal: str
    category: Literal["risk", "trend", "opportunity", "anomaly"]
    confidence: float
    temporal_marker: str
    metric: Optional[str] = None
    value: Optional[str] = None


class ContradictionObject(BaseModel):
    metric: str
    conflict: List[dict]
    explanation: str
    resolution: str
    trusted_source: str
    stale_sources: List[str]


class ActionObject(BaseModel):
    action_id: str
    step: int
    title: str
    type: Literal["query", "notify", "update", "order", "monitor"]
    description: str
    tool_call: str
    estimated_cost_pkr: float
    estimated_time_hours: float
    feasible: bool
    rejection_reason: Optional[str] = None
    depends_on_step: Optional[int] = None
    status: Literal["pending", "running", "success", "failed", "recovered", "skipped"] = "pending"


class ExecutionStep(BaseModel):
    step: int
    title: str
    status: Literal["success", "failed", "recovered", "skipped"]
    state_before: dict
    state_after: dict
    result: Optional[dict] = None
    error: Optional[str] = None
    recovery: Optional[str] = None
    latency_ms: int
    cost_usd: float
    start_time: str
    end_time: str


class OutcomeReport(BaseModel):
    job_id: str
    summary: dict
    performance: dict
    projected_impact: dict
    execution_log: List[ExecutionStep]


class AgentLog(BaseModel):
    job_id: str
    agent_name: str
    step_description: str
    reasoning: str
    tool_call: Optional[str] = None
    tool_result: Optional[str] = None
    timestamp: str
    status: Literal["running", "done", "error"]


class PipelineJob(BaseModel):
    job_id: str
    status: Literal["queued", "processing", "done", "failed"]
    created_at: str
    completed_at: Optional[str] = None
    sources: List[SourceObject]
    insights: Optional[List[InsightObject]] = None
    contradictions: Optional[List[ContradictionObject]] = None
    action_chain: Optional[List[ActionObject]] = None
    execution_log: Optional[List[ExecutionStep]] = None
    outcome_report: Optional[OutcomeReport] = None
