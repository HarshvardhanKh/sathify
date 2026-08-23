"""POST /api/text/process, POST /api/audio/process — the primary way to
exercise the full downstream pipeline without live audio (Step 2+ of the
implementation order)."""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.pipeline.manager import pipeline_manager

logger = logging.getLogger("isl.api.text")

router = APIRouter(tags=["text"])


class TextProcessRequest(BaseModel):
    text: str
    language: str = "auto"  # currently informational; detection is automatic regardless


@router.post("/api/text/process")
async def process_text(req: TextProcessRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty")
    result = await pipeline_manager.process_text(text)
    return result


@router.post("/api/audio/process")
async def process_audio(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".wav"):
        raise HTTPException(status_code=400, detail="Only .wav files are supported currently")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = Path(tmp.name)

    try:
        result = await pipeline_manager.process_audio_file(str(tmp_path))
        return result
    finally:
        tmp_path.unlink(missing_ok=True)
