# Antigravity Agent Trace Log
## Job: demo_job_001
## Date: 2026-05-20

---

### Workplan

InsightFlow uses a 6-agent sequential pipeline orchestrated via `run_full_pipeline()` in `agents/orchestrator.py`.
Each agent is a dedicated Python module under `backend/tools/`. The orchestrator calls them in order,
passing outputs downstream and streaming live `AgentLog` events via SSE to the mobile frontend.

```
Mobile App → POST /api/demo → Orchestrator
  → Agent 1: Content Ingestion   (ingest_tools.py)
  → Agent 2: Insight Extraction  (insight_tools.py + Gemini 1.5 Flash)
  → Agent 3: Contradiction Det.  (contradiction_tools.py)
  → Agent 4: Action Generation   (action_tools.py + Gemini 1.5 Flash)
  → Agent 5: Execution Sim.      (simulation_tools.py)
  → Agent 6: Outcome Report      (report_tools.py)
  → GET /api/results/demo_job_001 → Mobile App displays results
```

---

### Agent 1: Content Ingestion

- **Task:** Parse 5 heterogeneous source files and normalize into SourceObject format
- **Tool calls:** `parse_pdf()`, `scrape_url()`, `parse_csv()`, `parse_json()`, `create_mock_feed()`
- **Reasoning:** Each source type has a different parser. PDFs use PyMuPDF; CSVs use pandas;
  JSONs are parsed directly; URLs use requests + BeautifulSoup with a fallback to mock content;
  Feeds are generated in-memory with a live timestamp.
- **Output:** 5 normalized source dicts with `source_id`, `credibility_score`, `timestamp`, `staleness_flag`

**Key decision:** PDF timestamp extracted as `2026-05-16` (3 days old) → `staleness_flag = True`

---

### Agent 2: Insight Extraction

- **Task:** Extract 3–5 business signals per source using Gemini 1.5 Flash
- **Tool calls:** `extract_insights_from_source()` × 5
- **Reasoning:** Each source's `content_raw` (truncated to 2000 chars) is sent to Gemini with a
  structured prompt asking for JSON array of signals with category, confidence, metric, and value.
- **Output:** 15–25 `InsightObject` dicts with confidence scores, temporal markers, and metric values

---

### Agent 3: Contradiction Detection

- **Task:** Find conflicting data across sources for the same metric
- **Tool calls:** `group_insights_by_metric()`, `detect_contradictions()`, `filter_noise()`
- **Decision:** PDF timestamp is 3 days old. CSV is from today. Applying credibility × recency weighting.

**Contradiction found — metric: `stock_level`**

| Source | Type | Value      | Weight (credibility × recency) |
|--------|------|------------|-------------------------------|
| src_003 | CSV  | 2 days     | 0.95 × 1.0 = **0.95** ✓ Trusted |
| src_001 | PDF  | 13.6 days  | 0.85 × 0.4 = **0.34** ✗ Stale |

**Resolution:** Trusting CSV (weight 0.95 vs 0.34). PDF marked stale. Ground truth: `stock_level = "2 days"`

---

### Agent 4: Action Chain Generation

- **Task:** Generate a constraint-aware 5-step action plan using Gemini
- **Constraints applied:** Budget PKR 500,000 | Deadline 24 hours | Max lead time 3 days
- **Tool calls:** `generate_action_chain()`, `validate_against_constraints()` × 5
- **Output:** 5 validated ActionObjects — all within budget and deadline constraints

| Step | Action | Type | Cost (PKR) | Feasible |
|------|--------|------|-----------|---------|
| 1 | Validate Current Stock | query | 0 | ✓ |
| 2 | Notify Procurement Team | notify | 500 | ✓ |
| 3 | Emergency Order — Primary Supplier A | order | 250,000 | ✓ (will fail at runtime) |
| 4 | Update Customer Delivery Estimates | update | 1,000 | ✓ |
| 5 | Schedule 24-Hour Monitoring | monitor | 2,000 | ✓ |

---

### Agent 5: Execution Simulation

- **Task:** Execute all 5 actions using mock tool functions with deliberate failure injection
- **Step 1:** ✓ SUCCESS — `validate_stock()` → stock 8%, 198 units, 2 days remaining
- **Step 2:** ✓ SUCCESS — `notify_procurement()` → 2 recipients notified (MSG-4421)
- **Step 3:** ✗ FAILED → `emergency_order_primary()` raised `TimeoutError("Primary Supplier A API timeout after 30s")`
  - **Recovery triggered:** Switched to `emergency_order_fallback()`
  - ⚡ RECOVERED → Order ORD-ALT-9921 confirmed via Backup Supplier B (2000 units, ETA 3 days, PKR 180,000)
- **Step 4:** ✓ SUCCESS — `update_delivery_estimates()` → 142 customers notified
- **Step 5:** ✓ SUCCESS — `schedule_monitoring()` → MON-001 active, 24h interval

**Error recovery demonstrated:** `TimeoutError` → fallback supplier → order confirmed

---

### Agent 6: Outcome Report

- **Task:** Aggregate all outputs into a structured before/after outcome report
- **Result:**
  - Stockout risk reduced: **87% → 12%**
  - Emergency order placed: 2000 units via Backup Supplier B
  - Customers notified: 142
  - Total pipeline cost: ~$0.015–0.020
  - Total latency: ~1.5–2.5 seconds (mock tools) / ~8–12 seconds (with real Gemini calls)
  - Contradictions detected & resolved: 1
  - Stale sources identified: 1 (PDF warehouse report)

---

### Files in this submission

```
insightflow/
├── backend/              # FastAPI Python backend (6-agent pipeline)
├── mobile/               # React Native / Expo mobile app (6 screens)
├── antigravity_logs/
│   ├── SUBMISSION_TRACE.md   ← this file
│   └── test_run_output.json  ← generated by test_pipeline.py
└── README.md
```
