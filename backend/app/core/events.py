"""
The full event vocabulary broadcast over /ws/live, plus the envelope shape.

Every event on the bus is a PipelineEvent; `type` is one of EventType and
`data` is the type-specific payload (a plain dict, already JSON-safe).
"""
from __future__ import annotations

import time
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field

EventType = Literal[
    "PIPELINE_STATUS",
    "INPUT_RECEIVED",
    "ASR_PARTIAL",
    "ASR_FINAL",
    "TRANSCRIPT_UPDATED",
    "CONTEXT_READY",
    "LANGUAGE_DETECTED",
    "TEXT_NORMALIZED",
    "ISL_TRANSLATION",
    "SIGN_RESOLVED",
    "MOTION_SEQUENCE",
    "AVATAR_SEQUENCE_READY",
    "AVATAR_MOTION",
    "PIPELINE_ERROR",
    "PIPELINE_METRICS",
    # Legacy/simple aliases kept for the minimal-frontend spec compatibility:
    "TRANSCRIPT_PARTIAL",
    "TRANSCRIPT_FINAL",
    "SYSTEM_STATUS",
    "ERROR",
]


class PipelineEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    type: EventType
    timestamp: float = Field(default_factory=time.time)
    data: dict[str, Any] = Field(default_factory=dict)
