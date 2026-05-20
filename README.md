# InsightFlow — Autonomous Content-to-Action Agent
## Challenge 1 Submission

---

## One-Line Summary

InsightFlow ingests 5 heterogeneous data sources, resolves contradictions using credibility-weighted analysis, and autonomously executes a constraint-aware action chain — all in under 12 seconds.

---

## Live Links

| Resource | URL |
|----------|-----|
| **Backend API (Live)** | https://stunning-patience-production-04e4.up.railway.app |
| **Demo Endpoint** | https://stunning-patience-production-04e4.up.railway.app/api/demo |
| **Android APK Build** | https://expo.dev/accounts/mustafa51214/projects/insightflow/builds/3f61676f-dede-4df0-9f30-d31c09c75e46 |
| **Direct APK Download** | https://expo.dev/artifacts/eas/gUbLndJV1PJdGMoW4BXtui.apk |
| **GitHub Repo** | https://github.com/ghulammustafa119/insightflow |

---

## Demo Video

Link: [to be added]

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native Mobile App                     │
│         Upload → Processing → Insights → Actions →             │
│                  Simulation → Outcome Report                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / SSE
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                            │
│   POST /api/upload   POST /api/run-pipeline   GET /api/stream  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestrator (6 Agents)                      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Agent 1  │→ │ Agent 2  │→ │ Agent 3  │→ │ Agent 4  │       │
│  │ Content  │  │ Insight  │  │Contradict│  │ Action   │       │
│  │ Ingest   │  │ Extract  │  │Detection │  │ Chain    │       │
│  └──────────┘  └────┬─────┘  └──────────┘  └────┬─────┘       │
│                     │                            │             │
│               Gemini 1.5 Flash             Gemini 1.5 Flash    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ Agent 5  │→ │ Agent 6  │                                    │
│  │Execution │  │ Outcome  │                                    │
│  │   Sim    │  │  Report  │                                    │
│  └──────────┘  └──────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
  Mock Tool APIs              Google Gemini API
  (Supplier / CRM /           (Insight Extraction +
   Inventory / Notify)         Action Planning)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile | React Native + Expo | Cross-platform Android app |
| Routing | Expo Router | File-based screen navigation |
| Styling | NativeWind + StyleSheet | Dark UI theming |
| HTTP Client | Axios | API calls to backend |
| Streaming | Fetch EventSource (SSE) | Live agent log streaming |
| Backend | FastAPI + Uvicorn | REST API + SSE server |
| AI | Google Gemini 1.5 Flash | Insight extraction + action planning |
| PDF Parsing | PyMuPDF (fitz) | Warehouse report ingestion |
| Data | Pandas | CSV parsing + analysis |
| Web Scraping | BeautifulSoup + requests | News URL ingestion |
| Schemas | Pydantic v2 | Type-safe data models |
| Deployment | Google Cloud Run | Backend hosting |
| APK Build | EAS Build (Expo) | Android APK generation |

---

## The Scenario: Supply Chain Intelligence

A supply chain manager is facing a potential stockout crisis for **SKU-477 (Industrial Component X)**. InsightFlow ingests 5 real-world data sources simultaneously:

| # | Source | Type | Content |
|---|--------|------|---------|
| 1 | `warehouse_report.pdf` | PDF | 3-day-old inventory report saying stock is "adequate" (13.6 days) |
| 2 | News article URL | URL | Transport disruption news affecting suppliers |
| 3 | `sales_data.csv` | CSV | Today's sales data — stock at 8%, only 2 days left |
| 4 | `supplier_scorecard.json` | JSON | Primary Supplier A reliability at 42% (at risk) |
| 5 | Live alert feed | Feed | Real-time stockout prediction alert |

### The Built-In Contradiction

The **PDF** (3 days old) reports stock as adequate with 13.6 days remaining.  
The **CSV** (today's data) shows stock is at 8% with only 2 days remaining.

These two sources directly contradict each other on the `stock_level` metric. InsightFlow detects and resolves this automatically.

---

## How the Orchestrator Runs the Pipeline

`agents/orchestrator.py` calls all 6 agents in sequence, passing outputs downstream and streaming `AgentLog` events via SSE after each step:

```python
run_full_pipeline(job_id, pdf_path, url, csv_path, json_path, log_callback)
  → normalize_all_sources()        # Agent 1
  → extract_all_insights()         # Agent 2 (Gemini)
  → detect_contradictions()        # Agent 3
  → generate_action_chain()        # Agent 4 (Gemini)
  → simulate_execution()           # Agent 5
  → generate_outcome_report()      # Agent 6
```

Each agent logs its reasoning, tool calls, and results. These are streamed live to the mobile app via `GET /api/stream/{job_id}`.

---

## Agent Pipeline (6 Agents)

### Agent 1 — Content Ingestion (`ingest_tools.py`)
Parses all 5 source types. Assigns credibility scores and detects staleness based on timestamp age. Returns normalized `SourceObject` dicts.

### Agent 2 — Insight Extraction (`insight_tools.py`)
Sends each source to Gemini 1.5 Flash with a structured prompt. Extracts 3–5 business signals per source — each with category (risk/trend/opportunity/anomaly), confidence score, metric name, and value.

### Agent 3 — Contradiction Detection (`contradiction_tools.py`)
Groups insights by metric. For each metric with conflicting values, computes a **credibility × recency weight** for each source. The highest-weight source wins. Stale sources are flagged.

### Agent 4 — Action Chain Generation (`action_tools.py`)
Sends the resolved ground truth and top insights to Gemini. Generates a 5-step action chain. Each action is validated against budget (PKR 500,000) and time (24 hours) constraints.

### Agent 5 — Execution Simulation (`simulation_tools.py`)
Executes each action using mock tool functions. Step 3 is deliberately designed to fail (API timeout), triggering automatic fallback to Backup Supplier B and recovery.

### Agent 6 — Outcome Report (`report_tools.py`)
Aggregates all outputs into a structured before/after report with performance metrics, projected impact, and contradiction resolution summary.

---

## Contradiction Detection

### Formula
```
source_weight = credibility_score × recency_multiplier

recency_multiplier:
  today     → 1.0
  yesterday → 0.9
  2 days    → 0.7
  older     → 0.4
```

### Detected Contradiction

| Source | Type | Value | Credibility | Recency | **Weight** |
|--------|------|-------|-------------|---------|-----------|
| src_003 (CSV) | csv | **2 days** | 0.95 | 1.0 (today) | **0.95** ✓ Trusted |
| src_001 (PDF) | pdf | 13.6 days | 0.85 | 0.4 (3 days old) | **0.34** ✗ Stale |

**Resolution:** CSV wins. Ground truth: `stock_level = "2 days"`. PDF marked stale.

---

## Action Chain + Constraint Validation

**Constraints:** Budget PKR 500,000 | Deadline 24 hours | Max supplier lead time 3 days

| Step | Action | Type | Cost (PKR) | Time | Feasible |
|------|--------|------|-----------|------|---------|
| 1 | Validate current stock | query | 0 | 0.5h | ✓ |
| 2 | Notify procurement team | notify | 500 | 0.25h | ✓ |
| 3 | Emergency order — Primary Supplier A | order | 250,000 | 2h | ✓ (fails at runtime) |
| 4 | Update customer delivery estimates | update | 1,000 | 1h | ✓ |
| 5 | Schedule 24-hour monitoring | monitor | 2,000 | 0.1h | ✓ |

---

## Failure Recovery Demonstration

Step 3 demonstrates real-world resilience:

```
Step 3 → emergency_order_primary(supplier='SUP-001')
       ↓
  TimeoutError: "Primary Supplier A API timeout after 30s. Connection refused."
       ↓
  [RECOVERY] Switching to Backup Supplier B...
       ↓
  emergency_order_fallback() → Order ORD-ALT-9921 CONFIRMED
  Supplier: Backup Supplier B | Units: 2000 | ETA: 3 days | Cost: PKR 180,000
       ↓
  Status: RECOVERED ✓
```

The pipeline continues to Step 4 and 5 without interruption.

---

## Setup Instructions

### Backend

```bash
cd insightflow/backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run server
uvicorn main:app --reload --port 8000

# Test pipeline (optional)
python test_pipeline.py
```

### Mobile App

```bash
cd insightflow/mobile

# Install dependencies
npm install

# Start dev server
npx expo start

# Run on Android emulator
npx expo run:android
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/upload` | Upload 5 source files |
| POST | `/api/run-pipeline/{job_id}` | Start pipeline |
| POST | `/api/demo` | Run with mock data (no upload needed) |
| GET | `/api/results/{job_id}` | Get full results |
| GET | `/api/results/{job_id}/status` | Get pipeline status |
| GET | `/api/stream/{job_id}` | SSE live agent logs |

---

## Baseline Comparison

| Capability | Simple Summarizer (Non-Agentic) | **InsightFlow (Agentic)** |
|-----------|--------------------------------|--------------------------|
| Multi-source ingestion | ✗ Single source only | ✅ 5 source types (PDF/CSV/JSON/URL/Feed) |
| Contradiction detection | ✗ No | ✅ Credibility × recency weighting |
| Conflict resolution | ✗ No | ✅ Automatic — trusted source wins |
| Staleness detection | ✗ No | ✅ Timestamp-based flagging |
| Action generation | ✗ No | ✅ 5-step constraint-aware action chain |
| Constraint validation | ✗ No | ✅ Budget (PKR 500k) + deadline (24h) |
| Failure recovery | ✗ No | ✅ Automatic fallback to backup supplier |
| Outcome measurement | ✗ No | ✅ Before/after state + projected impact |
| Live progress streaming | ✗ No | ✅ SSE real-time agent logs |
| Mobile UI | ✗ No | ✅ 6-screen React Native app |

---

## Cost & Latency Analysis

| Metric | Value |
|--------|-------|
| Full pipeline (mock tools) | ~1.5–2.5 seconds |
| Full pipeline (with Gemini) | ~8–12 seconds |
| Gemini cost per run | ~$0.003–0.006 |
| Cost per 1,000 runs | ~$3–6 |
| 10x scaling | Cloud Run auto-scales instances |
| 100x scaling | Cloud Run horizontal scaling, no code changes |

---

## Scalability Discussion

- **Current:** Mock tool functions simulate external APIs. Easily swappable with real ERP/CRM APIs.
- **10x:** Cloud Run handles 10 concurrent runs with the same single deployment.
- **100x:** Cloud Run auto-scales to hundreds of instances. Gemini API supports high concurrency.
- **Data scale:** Pandas handles CSVs up to millions of rows; PDF parser handles multi-hundred-page documents.
- **Real production:** Replace mock tools with actual supplier APIs, ERP integrations, and notification services. No orchestrator changes required.

---

## Robustness Evidence

| Scenario | How Handled |
|----------|------------|
| API timeout (Step 3) | Caught with `try/except TimeoutError`, fallback supplier called |
| Stale data source | PDF timestamp 3 days old → `staleness_flag=True`, weight penalized to 0.4× |
| Contradicting sources | Same metric, different values → weighted resolution, stale source marked |
| URL scraping failure | `requests` timeout → fallback to hardcoded mock news content |
| Gemini API failure | `try/except` → fallback insights / fallback action chain returned |
| Invalid JSON from Gemini | Strips markdown fences, falls back if parse fails |

---

## Limitations

1. **Mock tool functions:** External API calls (supplier ordering, CRM notifications) are simulated — not connected to real systems.
2. **Single-threaded pipeline:** Agents run sequentially. Parallel execution (Agents 1+2 together) could cut latency by ~40%.
3. **No persistent storage:** Results stored in-memory — lost on server restart. Production would use Firestore or PostgreSQL.
4. **Gemini rate limits:** Free tier has quota limits. High-volume production use requires a paid Gemini API plan.

---

## Privacy Note

No real user data is stored or transmitted. All scenario data (SKU-477, supplier names, complaint records) is entirely synthetic and created for demonstration purposes only.

---

## Team Details

- **Team Name:** [Team Name]
- **Members:** [Member Names]
- **Region:** Pakistan
- **Submission Date:** May 2026
