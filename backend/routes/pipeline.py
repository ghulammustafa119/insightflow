import os
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from agents.orchestrator import run_full_pipeline, PIPELINE_RESULTS

router = APIRouter()

PIPELINE_LOGS: dict = {}
PIPELINE_STATUS: dict = {}

MOCK_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "mock_data")


class PipelineRequest(BaseModel):
    news_url: Optional[str] = "https://example.com/supply-chain-news"


def _make_log_callback(job_id: str):
    def callback(log_entry: dict):
        PIPELINE_LOGS.setdefault(job_id, []).append(log_entry)
    return callback


async def _run_pipeline_async(job_id: str, pdf_path: str, url: str, csv_path: str, json_path: str):
    PIPELINE_STATUS[job_id] = "processing"
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: run_full_pipeline(job_id, pdf_path, url, csv_path, json_path, _make_log_callback(job_id))
        )
        PIPELINE_STATUS[job_id] = "done"
    except Exception as e:
        PIPELINE_STATUS[job_id] = "failed"
        PIPELINE_LOGS.setdefault(job_id, []).append({
            "job_id": job_id,
            "agent_name": "Orchestrator",
            "step_description": "Pipeline failed",
            "reasoning": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "error",
        })


@router.post("/run-pipeline/{job_id}")
async def run_pipeline(job_id: str, body: PipelineRequest = None):
    job_dir = f"/tmp/insightflow/{job_id}"

    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Job directory not found. Upload files first.")

    files = os.listdir(job_dir)
    pdf_path = next((os.path.join(job_dir, f) for f in files if f.endswith(".pdf")), None)
    csv_path = next((os.path.join(job_dir, f) for f in files if f.endswith(".csv")), None)
    json_files = [f for f in files if f.endswith(".json")]
    json_path = os.path.join(job_dir, json_files[0]) if json_files else None

    url_file = os.path.join(job_dir, "news_url.txt")
    if os.path.exists(url_file):
        with open(url_file) as f:
            news_url = f.read().strip()
    else:
        news_url = (body.news_url if body else None) or "https://example.com/supply-chain-news"

    if not pdf_path or not csv_path or not json_path:
        raise HTTPException(status_code=400, detail="Required files missing.")

    PIPELINE_LOGS[job_id] = []
    PIPELINE_STATUS[job_id] = "queued"

    asyncio.create_task(_run_pipeline_async(job_id, pdf_path, news_url, csv_path, json_path))

    return {"job_id": job_id, "status": "processing_started"}


@router.post("/demo")
async def run_demo():
    job_id = "demo_job_001"
    pdf_path = os.path.join(MOCK_DATA_DIR, "warehouse_report.pdf")
    csv_path = os.path.join(MOCK_DATA_DIR, "sales_data.csv")
    json_path = os.path.join(MOCK_DATA_DIR, "supplier_scorecard.json")
    news_url = "https://example.com/supply-chain-disruption"

    PIPELINE_LOGS[job_id] = []
    PIPELINE_STATUS[job_id] = "queued"
    PIPELINE_RESULTS.pop(job_id, None)

    asyncio.create_task(_run_pipeline_async(job_id, pdf_path, news_url, csv_path, json_path))

    return {"job_id": job_id, "status": "processing_started"}
