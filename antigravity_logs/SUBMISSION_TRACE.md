# InsightFlow — Orchestrator Pipeline Agent Trace Log

This artifact documents the live execution trace of the 6-agent sequential pipeline for **InsightFlow** — an Autonomous Content-to-Action Agent system. 

* **Job ID:** `demo_job_001`
* **Execution Date:** 2026-05-20
* **API Base URL:** `https://stunning-patience-production-04e4.up.railway.app`
* **Target System:** InsightFlow Orchestration Pipeline

---

## ─── PIPELINE WORKFLOW OVERVIEW ───

InsightFlow's multi-agent architecture is designed to ingest raw, multi-source unstructured data, resolve real-time contradictions, plan optimized action sequences under firm constraints, safely execute actions with self-healing recovery, and report the business outcome.

```
+-----------------------------------------------------------------------------------------------------------------+
|                                           INSIGHTFLOW 6-AGENT PIPELINE                                          |
+-----------------------------------------------------------------------------------------------------------------+
|                                                                                                                 |
|  [Agent 1: Ingestion]  ==> Ingests 5 diverse data sources (PDF, CSV, JSON, URL, Live Feed)                      |
|          ||                                                                                                     |
|  [Agent 2: Extraction] ==> Triggers Gemini 1.5 Flash to extract critical business signals                       |
|          ||                                                                                                     |
|  [Agent 3: Conflict]   ==> Resolves contradictions using dynamic (Credibility x Recency) scoring matrix          |
|          ||                                                                                                     |
|  [Agent 4: Planner]    ==> Generates constraint-aware 5-step action plan (Budget < 500k PKR, Time < 24h)           |
|          ||                                                                                                     |
|  [Agent 5: Executor]   ==> Executes plan. Automatically detects API timeout and recovers using Backup Supplier  |
|          ||                                                                                                     |
|  [Agent 6: Reporter]   ==> Compiles outcome report (Stockout Risk: 87% -> 12% | Latency: 1.96s)                 |
|                                                                                                                 |
+-----------------------------------------------------------------------------------------------------------------+
```

---

## ─── DETAILED STEP-BY-STEP AGENT TRACE ───

### STEP 1 - AGENT 1 (Content Ingestion)
* **API Endpoint Called:** `POST /api/demo`
* **Status:** `processing_started`
* **Job ID Returned:** `demo_job_001`

#### Source Normalization Analysis
Agent 1 ingested and parsed **5 heterogeneous, real-world data sources** into a normalized schema (`SourceObject`), assigning each a baseline credibility score:

1. **Warehouse Inventory PDF (`warehouse_report.pdf` | `src_001`)**
   * *Timestamp:* `2026-05-17` (3 days old relative to the present day `2026-05-20`)
   * *Credibility Score:* `0.85` (Medium-High: official physical count record, but prone to human/entry delay)
   * *Content Summary:* States SKU-477 (Industrial Component X) has current stock of `2,450 units` with average daily consumption of `180 units/day` (~13.6 days of remaining supply). Stock status marked as `ADEQUATE`.
   * *Staleness Flag:* `True` (marked stale due to aging).

2. **Supply Chain Disruption News URL (`https://example.com/supply-chain-disruption` | `src_002`)**
   * *Timestamp:* `2026-05-17` (3 days old)
   * *Credibility Score:* `0.60` (Medium: public news source, unstructured and needs verification)
   * *Content Summary:* General reports of transport disruptions on main commercial routes.

3. **Real-time Sales CSV (`sales_data.csv` | `src_003`)**
   * *Timestamp:* `2026-05-20` (Today)
   * *Credibility Score:* `0.95` (Highest: live database transactional records)
   * *Content Summary:* Records the last 6 days of sales for SKU-477, showing a massive, unexpected surge in demand. Burn rate spiked to `280 units/day`, units remaining dropped to `198 units`, and days until stockout is flagged as only `2 days`!
   * *Staleness Flag:* `False`.

4. **Supplier Scorecard JSON (`supplier_scorecard.json` | `src_004`)**
   * *Timestamp:* `2026-05-19` (1 day old)
   * *Credibility Score:* `0.90` (Very High: audited internal procurement system data)
   * *Content Summary:* Performance rating of critical suppliers. **Primary Supplier A (SUP-001)** has a reliability rating of only `0.42` ("at_risk" status due to main route transport issues). **Backup Supplier B (SUP-002)** remains highly reliable with `0.81` reliability score, shorter average lead time (3.1 days), and is marked as `available` for emergency orders.
   * *Staleness Flag:* `False`.

5. **Live Alert & Complaint Feed (`src_005`)**
   * *Timestamp:* `2026-05-20` (Today)
   * *Credibility Score:* `0.75` (Medium-High: aggregated automated monitoring signal)
   * *Content Summary:* Aggregated feed indicating an escalating customer complaint trend regarding delayed delivery of SKU-477. Predicts imminent stockout within 48 hours based on burn rates and points out Supplier A's at-risk status.
   * *Staleness Flag:* `False`.

---

### STEP 2 - AGENT 2 (Insight Extraction)
* **API Endpoint Called:** `GET /api/results/demo_job_001/status`
* **Poll Status:** `done` (completed 6/6 agents in 1.96s)

#### Extraction Reasoning
Agent 2 processed each normalized raw source text by calling the **Gemini 1.5 Flash** model. 
* *Prompt Strategy:* A specialized, few-shot prompt directed Gemini to analyze the `content_raw` of each source, isolate business-critical signals, filter out fluff, and map them to structured objects featuring:
  * **Metric name & values** (e.g., `days_of_stock_remaining`, `burn_rate`, `reliability_rating`)
  * **Category tag** (e.g., `risk`, `anomaly`, `performance`)
  * **Confidence scores** (evaluating how explicitly the source states the metric)
  * **Temporal markers** (pinpointing exactly which date the data represents)

---

### STEP 3 - AGENT 3 (Contradiction Detection)
Agent 3 executed conflict detection across all extracted insights. It mapped insights targeting the same metric (in this case, `stockout_risk` and `days_of_stock_remaining` for `SKU-477`) and evaluated them using a **weighted credibility x recency matrix**:

$$\text{Weight} = \text{Credibility Score} \times \text{Recency Factor}$$

#### Contradiction Matrix Analysis
* **Conflict:**
  * **Warehouse PDF (src_001):** Claims stock duration is **13.6 days** ("ADEQUATE").
  * **Sales CSV (src_003):** Claims stock duration is only **2 days** ("CRITICAL STOCKOUT RISK").

* **Weighting Resolution:**
  * **PDF (src_001):** $0.85 \text{ (Credibility)} \times 0.40 \text{ (Recency factor for 3-day old data)} = \mathbf{0.34}$
  * **Sales CSV (src_003):** $0.95 \text{ (Credibility)} \times 1.00 \text{ (Recency factor for live data)} = \mathbf{0.95}$

#### Agent Decision
Agent 3 automatically resolved the conflict by **trusting the Sales CSV over the Warehouse PDF** (Score: `0.95` vs `0.34`). 
* *Rationale:* The PDF reflects a stagnant snapshot from 3 days ago. The CSV contains today's hot-off-the-press sales data, capturing a sudden demand surge (burn rate spiked to 280 units/day).
* *Outcome:* PDF marked as **stale**. The pipeline adopted the **Sales CSV metrics** as the sole Ground Truth:
  * `stockout_prediction`: "within 48 hours"
  * `current_stock_level`: "198 units" (8% capacity)
  * `days_of_stock_remaining`: "2 days"
  * `supplier_reliability`: "42%"

---

### STEP 4 - AGENT 4 (Action Chain Generation)
Agent 4 received the verified Ground Truth and invoked Gemini 1.5 Flash to plan a targeted, 5-step emergency mitigation chain. 

#### Hard Business Constraints
* **Budget Limit:** PKR 500,000
* **Deadline:** 24 hours
* **Reorder Quantity:** 2,000 units of SKU-477

#### Constraint Feasibility Grid

| Step | Action Title | Type | Tool Call | Est. Cost (PKR) | Est. Time (Hours) | Feasible? | Rationale |
|---|---|---|---|---|---|---|---|
| **1** | Validate Current Stock Level | `query` | `validate_stock(sku='SKU-477')` | 0 | 0.5 | **Yes** ✓ | Zero cost, instant query. Pre-requisite for action. |
| **2** | Notify Procurement Team | `notify` | `notify_procurement(sku='SKU-477')` | 500 | 0.25 | **Yes** ✓ | Minimal communication cost, immediate. |
| **3** | Emergency Order - Primary Supplier A | `order` | `emergency_order_primary(...)` | 250,000 | 2.0 | **Yes** ✓ | Fits budget (PKR 250k < 500k) and within time windows. |
| **4** | Update Customer Delivery Estimates | `update` | `update_delivery_estimates(...)` | 1,000 | 1.0 | **Yes** ✓ | Essential for CRM update, negligible time/cost. |
| **5** | Schedule 24-Hour Monitoring | `monitor` | `schedule_monitoring(...)` | 2,000 | 0.1 | **Yes** ✓ | Negligible cost, runs as recurring background daemon. |

*Total Estimated Cost:* **PKR 253,500** (Well below the PKR 500,000 threshold)  
*Total Estimated Execution Time:* **3.85 Hours** (Well below the 24-hour deadline)  
*Feasibility Status:* **100% Feasible** - The plan has been approved for execution simulation.

---

### STEP 5 - AGENT 5 (Execution Simulation & Self-Healing)
Agent 5 simulates the execution of the generated action plan using simulated API call tools. During execution, it encountered a critical server failure and successfully triggered a **self-healing recovery procedure**:

```
[START] --> [Step 1: Stock Validated] --> [Step 2: Procurement Alerted]
                                                  ||
                                                  \/
[Step 3: ORDER TO SUPPLIER A] =====(TIMEOUT!)====> [TRIGGER RECOVERY]
                                                          || (Switch to Supplier B)
                                                          \/
[Step 5: Monitoring Active] <-- [Step 4: Customers Notified] <-- [Order Placed B]
```

* **Step 1: Validate Current Stock Level**
  * *Status:* **SUCCESS** ✓
  * *Result:* Confirmed current stock is `198 units` (8% capacity) with only `2 days` remaining. Stockout risk: High.
* **Step 2: Notify Procurement Team**
  * *Status:* **SUCCESS** ✓
  * *Result:* Alert sent to `procurement@company.com` and `manager@company.com`. Message ID `MSG-4421` registered.
* **Step 3: Place Emergency Order — Primary Supplier A**
  * *Status:* **FAILED (API TIMEOUT)** ✗
  * *Error:* `Primary Supplier A API timeout after 30s. Connection refused.` (Reflecting the transport route disruptions).
  * *Self-Healing Recovery:* Agent 5 detected the failure, checked the Supplier Scorecard JSON, and identified **Backup Supplier B (SUP-002)** as the best alternative. It successfully switched execution to `emergency_order_fallback()`:
  * *Recovery Status:* **RECOVERED (SUCCESS)** ⚡
  * *Result:* Order placed successfully via Backup Supplier B (**Order ID: ORD-ALT-9921**). Ordered `2,000 units` of SKU-477 for **PKR 180,000** with an ETA of **3 days** (confirmed).
* **Step 4: Update Customer Delivery Estimates**
  * *Status:* **SUCCESS** ✓
  * *Result:* Delivery estimates pushed to **142 affected customers** (Updated delivery ETA moved from May 19 to May 22 based on Supplier B's 3-day lead time).
* **Step 5: Schedule 24-Hour Monitoring**
  * *Status:* **SUCCESS** ✓
  * *Result:* Automated background monitoring scheduled (Job ID: `MON-001`) with configurable telemetry alarms (`stock_below_500`, `supplier_delay`).

---

### STEP 6 - AGENT 6 (Outcome Report)
* **API Endpoint Called:** `GET /api/results/demo_job_001`
* **Performance & Business Metrics Compiled:**

#### Key Metrics
* **Total Pipeline Cost:** `$0.0160` USD (extremely low overhead using Gemini 1.5 Flash token usage)
* **Total Execution Latency:** `1,963 milliseconds`
* **Stockout Risk:** Reduced from **87% down to 12%** (Averted imminent factory shutdown)
* **Actions Executed:** 5 (Succeeded: 5, Failed: 0, Recovered: 1)
* **Contradictions Resolved:** 1

#### Before vs After State Comparison

| Parameter | State BEFORE Pipeline | State AFTER Pipeline |
|---|---|---|
| **Stock Verification** | `false` (Stale report of 2450 units) | `true` (Confirmed 198 units remaining) |
| **Procurement Status** | `false` (No alerts raised) | `true` (Procurement alerted & actively managing) |
| **Order Status** | `false` (No order placed) | `true` (**ORD-ALT-9921** confirmed via Backup Supplier B) |
| **Emergency Units Ordered**| `0` | `2,000 units` (SKU-477) |
| **Emergency Cost** | `0` | **PKR 180,000** (Well within PKR 500,000 budget) |
| **Customers Notified** | `0` | **142 Customers** updated with ETA May 22 |
| **Automated Monitoring** | `false` (Inactive) | `true` (Active - Job `MON-001`, 24h checks) |
| **Stockout Risk** | **87% (Critical)** | **12% (Controlled & Safe)** |

---

## ─── ORCHESTRATION REASONING TRACE SUMMARY ───

InsightFlow's run demonstrates the immense capability of **autonomous agentic orchestration**:
1. **Adaptive Ingestion:** Agent 1 gathered diverse logs and scored their baseline credibility.
2. **Context-Aware Signals:** Agent 2 successfully extracted core metrics, removing fluff using Gemini.
3. **Temporal Alignment:** Agent 3 detected that static inventory reports (PDF) did not match transaction logs (CSV). By applying dynamic recency weights ($0.95$ vs $0.34$), the system accurately recognized the live supply crisis and bypassed stale files.
4. **Constraint-Aware Planning:** Agent 4 designed a sequence satisfying firm financial (PKR 500,000) and temporal (24h) constraints.
5. **Self-Healing Execution:** When the Primary Supplier A failed to respond, the Agentic Orchestrator did not crash. Instead, Agent 5 inspected the supplier reliability scoreboard, made an autonomous decision to place the order with Backup Supplier B, and updated downstream customer notifications accordingly.
6. **Insightful Reporting:** Agent 6 consolidated a beautiful audit trail and before/after comparisons, demonstrating a **75% reduction in total stockout risk** with negligible API cost.

**Trace Log Saved and Verified.** Ready for submission.
