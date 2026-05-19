import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="InsightFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "InsightFlow API"}


# Routes will be included here after Prompt 10 implementation
# from routes import upload, pipeline, results, stream
# app.include_router(upload.router, prefix="/api")
# app.include_router(pipeline.router, prefix="/api")
# app.include_router(results.router, prefix="/api")
# app.include_router(stream.router, prefix="/api")
