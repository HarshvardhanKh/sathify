"""GET /api/status"""
from __future__ import annotations

from fastapi import APIRouter

from app.pipeline.manager import pipeline_manager

router = APIRouter(tags=["status"])


@router.get("/api/status")
async def get_status():
    return pipeline_manager.get_status()


@router.get("/api/debug/audio")
async def get_audio_debug():
    """Phase 12 live-debug panel: capture backend/device, RMS/peak, ring
    buffer fill, ASR status, last transcript, and measured per-stage
    latency. `capture` is null unless a system_audio stream is running."""
    return pipeline_manager.get_debug_info()
