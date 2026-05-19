from fastapi import APIRouter
from fastapi.responses import JSONResponse

from agents.orchestrator import PIPELINE_RESULTS
from routes.pipeline import PIPELINE_LOGS, PIPELINE_STATUS

router = APIRouter()


@router.get("/results/{job_id}")
async def get_results(job_id: str):
    if job_id not in PIPELINE_RESULTS:
        return JSONResponse(status_code=202, content={"status": "processing"})
    return JSONResponse(status_code=200, content=PIPELINE_RESULTS[job_id])


@router.get("/results/{job_id}/status")
async def get_status(job_id: str):
    status = PIPELINE_STATUS.get(job_id, "queued")
    logs = PIPELINE_LOGS.get(job_id, [])
    done_agents = sum(1 for log in logs if log.get("status") == "done")
    return {
        "job_id": job_id,
        "status": status,
        "agents_completed": min(done_agents, 6),
    }
