"""GET /api/animations — the avatar frontend fetches this once at startup
and caches it locally; the backend never streams pose data per-event, only
animation_id references (see models/motion.py)."""
from __future__ import annotations

from fastapi import APIRouter

from app.services.animation.library import animation_library

router = APIRouter(tags=["animations"])


@router.get("/api/animations")
async def get_animations():
    return animation_library.get_all()
