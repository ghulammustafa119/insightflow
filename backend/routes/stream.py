import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from routes.pipeline import PIPELINE_LOGS, PIPELINE_STATUS

router = APIRouter()


@router.get("/stream/{job_id}")
async def stream_logs(job_id: str):
    async def event_generator():
        sent_index = 0
        while True:
            logs = PIPELINE_LOGS.get(job_id, [])
            while sent_index < len(logs):
                entry = logs[sent_index]
                yield f"data: {json.dumps(entry)}\n\n"
                sent_index += 1

            status = PIPELINE_STATUS.get(job_id, "queued")
            if status in ("done", "failed"):
                yield f"data: {json.dumps({'event': 'done', 'status': status})}\n\n"
                break

            await asyncio.sleep(0.3)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
