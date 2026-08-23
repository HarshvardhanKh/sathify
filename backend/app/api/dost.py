"""POST /api/dost/chat, GET /api/debug/gemini"""
from __future__ import annotations

from fastapi import APIRouter

from app.models.dost import DostChatRequest, DostChatResponse
from app.services.ai.key_manager import gemini_key_manager
from app.services.dost.service import dost_service

router = APIRouter(tags=["dost"])


@router.post("/api/dost/chat", response_model=DostChatResponse)
async def dost_chat(req: DostChatRequest):
    return await dost_service.chat(req)


@router.get("/api/debug/gemini")
async def debug_gemini():
    """Key index/health/cooldown/last-failure-type only — NEVER the actual keys."""
    return {"configured": gemini_key_manager.configured, "keys": gemini_key_manager.status()}
