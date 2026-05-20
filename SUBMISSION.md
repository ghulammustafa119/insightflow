# InsightFlow — Submission Package

## Submission Checklist

- [x] Backend pipeline (6 agents) — `backend/`
- [x] React Native mobile app (6 screens) — `mobile/`
- [x] Mock data files — `backend/mock_data/`
- [x] Antigravity agent trace — `antigravity_logs/SUBMISSION_TRACE.md`
- [x] Test run output — `antigravity_logs/test_run_output.json`
- [x] README with all required sections — `README.md`
- [ ] Demo video — [to be recorded]
- [x] APK build — https://expo.dev/accounts/mustafa51214/projects/insightflow/builds/fabb37c9-138c-4109-bf5e-56e0d80adba5
- [x] Live backend URL — https://stunning-patience-production-04e4.up.railway.app

---

## File Locations

| Artifact | Path |
|----------|------|
| Backend source | `backend/` |
| Mobile app source | `mobile/` |
| Mock data (5 files) | `backend/mock_data/` |
| Agent trace log | `antigravity_logs/SUBMISSION_TRACE.md` |
| Test run output | `antigravity_logs/test_run_output.json` |
| README | `README.md` |
| APK | `InsightFlow-v1.0.apk` *(after build)* |

---

## Key Files

```
insightflow/
├── README.md                          ← Full project documentation
├── SUBMISSION.md                      ← This file
├── backend/
│   ├── main.py                        ← FastAPI app entry point
│   ├── requirements.txt               ← Python dependencies
│   ├── Dockerfile                     ← For Cloud Run deployment
│   ├── .env.example                   ← Environment variables template
│   ├── test_pipeline.py               ← Backend integration test
│   ├── agents/
│   │   └── orchestrator.py            ← 6-agent pipeline orchestrator
│   ├── tools/
│   │   ├── ingest_tools.py            ← Agent 1: PDF/URL/CSV/JSON/Feed parsers
│   │   ├── insight_tools.py           ← Agent 2: Gemini insight extraction
│   │   ├── contradiction_tools.py     ← Agent 3: Conflict detection + resolution
│   │   ├── action_tools.py            ← Agent 4: Constraint-aware action planner
│   │   ├── simulation_tools.py        ← Agent 5: Execution + failure recovery
│   │   └── report_tools.py            ← Agent 6: Outcome report generator
│   ├── models/
│   │   └── schemas.py                 ← All Pydantic data models
│   ├── routes/
│   │   ├── upload.py                  ← POST /api/upload
│   │   ├── pipeline.py                ← POST /api/run-pipeline + POST /api/demo
│   │   ├── results.py                 ← GET /api/results/{job_id}
│   │   └── stream.py                  ← GET /api/stream/{job_id} (SSE)
│   └── mock_data/
│       ├── warehouse_report.pdf       ← Source 1: Stale warehouse inventory PDF
│       ├── sales_data.csv             ← Source 2: Today's sales (critical stock)
│       ├── supplier_scorecard.json    ← Source 3: Supplier reliability data
│       └── complaint_feed.json        ← Source 4: Customer complaint feed
├── mobile/
│   ├── app/
│   │   ├── index.tsx                  ← Home screen
│   │   ├── upload.tsx                 ← Upload sources screen
│   │   ├── processing.tsx             ← Live agent trace screen (SSE)
│   │   ├── insights.tsx               ← Insights + contradictions screen
│   │   ├── actions.tsx                ← Action chain screen
│   │   ├── simulation.tsx             ← Step-by-step execution screen
│   │   └── outcome.tsx                ← Final outcome report screen
│   ├── services/api.ts                ← All API calls
│   └── types/index.ts                 ← TypeScript interfaces
└── antigravity_logs/
    ├── SUBMISSION_TRACE.md            ← Full agent reasoning trace
    └── test_run_output.json           ← Complete pipeline output JSON
```
