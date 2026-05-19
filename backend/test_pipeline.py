import os
import sys
import json

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

MOCK_DIR = os.path.join(os.path.dirname(__file__), "mock_data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "antigravity_logs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

PDF_PATH  = os.path.join(MOCK_DIR, "warehouse_report.pdf")
CSV_PATH  = os.path.join(MOCK_DIR, "sales_data.csv")
JSON_PATH = os.path.join(MOCK_DIR, "supplier_scorecard.json")
NEWS_URL  = "https://example.com/supply-chain-disruption"
JOB_ID    = "test_job_001"


def run():
    print("=" * 60)
    print("InsightFlow — Backend Pipeline Test")
    print("=" * 60)

    # Agent 1
    print("\n[AGENT 1] Content Ingestion")
    from tools.ingest_tools import normalize_all_sources
    sources = normalize_all_sources(PDF_PATH, NEWS_URL, CSV_PATH, JSON_PATH)
    print(f"  ✓ {len(sources)} sources normalized")

    # Agent 2
    print("\n[AGENT 2] Insight Extraction")
    from tools.insight_tools import extract_all_insights
    insights = extract_all_insights(sources)
    print(f"  ✓ {len(insights)} insights extracted")

    # Agent 3
    print("\n[AGENT 3] Contradiction Detection")
    from tools.contradiction_tools import detect_contradictions, filter_noise
    contradiction_result = detect_contradictions(insights, sources)
    insights = filter_noise(insights)
    print(f"  ✓ {len(contradiction_result['contradictions'])} contradictions detected")
    print(f"  ✓ {len(contradiction_result['resolutions'])} resolved")
    print(f"  ✓ Stale sources: {contradiction_result['stale_source_ids']}")

    # Agent 4
    print("\n[AGENT 4] Action Chain Generation")
    from tools.action_tools import generate_action_chain, get_action_summary
    action_chain = generate_action_chain(contradiction_result["ground_truth"], insights)
    print(f"  ✓ {get_action_summary(action_chain)}")

    # Agent 5
    print("\n[AGENT 5] Execution Simulation")
    from tools.simulation_tools import simulate_execution
    execution_log = simulate_execution(action_chain)
    for step in execution_log:
        status_icon = {"success": "✓", "failed": "✗", "recovered": "⚡", "skipped": "—"}.get(step["status"], "?")
        print(f"  {status_icon} Step {step['step']}: {step['title']} [{step['status'].upper()}]")

    # Agent 6
    print("\n[AGENT 6] Outcome Report")
    from tools.report_tools import generate_outcome_report
    report = generate_outcome_report(JOB_ID, execution_log, contradiction_result, action_chain)
    perf = report["performance"]
    summ = report["summary"]
    print(f"  ✓ Actions succeeded: {summ['actions_succeeded']}/{summ['actions_executed']}")
    print(f"  ✓ Total cost: ${perf['total_cost_usd']}")
    print(f"  ✓ Total latency: {perf['total_latency_ms']}ms")
    print(f"  ✓ Stockout risk: {report['projected_impact']['stockout_risk_reduction']}")

    # Save output
    full_result = {
        "job_id": JOB_ID,
        "sources": sources,
        "insights": insights,
        "contradictions": contradiction_result,
        "action_chain": action_chain,
        "execution_log": execution_log,
        "outcome_report": report,
    }
    output_path = os.path.join(OUTPUT_DIR, "test_run_output.json")
    with open(output_path, "w") as f:
        json.dump(full_result, f, indent=2, default=str)

    print("\n" + "=" * 60)
    print(f"✅ Pipeline test complete. Output saved to: {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    run()
