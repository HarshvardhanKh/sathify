"""POST /api/pipeline/start, POST /api/pipeline/stop"""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.pipeline.manager import pipeline_manager

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


class StartRequest(BaseModel):
    mode: str = "system_audio"  # "system_audio" | "mock"
    # new-frontend's api.ts posts {sessionId} rather than {mode} — accepted
    # and logged for correlation, but this backend has one pipeline instance
    # (no multi-session isolation in this MVP), so it doesn't change behavior.
    sessionId: str | None = None


@router.post("/start")
async def start_pipeline(req: StartRequest):
    await pipeline_manager.start(mode=req.mode)  # type: ignore[arg-type]
    return {
        "status": "ok",
        "sessionId": req.sessionId or "default",
        "pipeline": pipeline_manager.get_status(),
    }


class StopRequest(BaseModel):
    sessionId: str | None = None


@router.post("/stop")
async def stop_pipeline(req: StopRequest | None = None):
    await pipeline_manager.stop()
    return {"status": "ok", "pipeline": pipeline_manager.get_status()}
