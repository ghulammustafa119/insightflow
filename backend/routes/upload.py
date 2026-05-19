import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

router = APIRouter()


@router.post("/upload")
async def upload_sources(
    pdf_file: UploadFile = File(...),
    csv_file: UploadFile = File(...),
    json_file: UploadFile = File(...),
    feed_file: UploadFile = File(...),
    news_url: Optional[str] = Form(default=""),
):
    job_id = "job_" + str(uuid.uuid4())[:8]
    job_dir = f"/tmp/insightflow/{job_id}"
    os.makedirs(job_dir, exist_ok=True)

    saved_files = []
    for upload in [pdf_file, csv_file, json_file, feed_file]:
        dest = os.path.join(job_dir, upload.filename)
        async with aiofiles.open(dest, "wb") as f:
            content = await upload.read()
            await f.write(content)
        saved_files.append(upload.filename)

    if news_url:
        url_file = os.path.join(job_dir, "news_url.txt")
        async with aiofiles.open(url_file, "w") as f:
            await f.write(news_url)

    return {"job_id": job_id, "status": "files_received", "files": saved_files}
