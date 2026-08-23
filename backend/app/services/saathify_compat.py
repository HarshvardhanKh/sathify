"""
SaathiFy compatibility layer — new-frontend/src/types/events.ts hard-codes
a specific field vocabulary (camelCase, slightly different field names)
for the same event types the existing ISL pipeline already emits. Rather
than rewriting the working pipeline's event shapes (which frontend-avatar
already depends on) or duplicating events under new names, these helpers
build a SUPERSET payload: the original fields plus the additional
camelCase fields new-frontend's type guards read, merged into the same
dict passed to event_bus.publish(). Both frontends read the same event
stream; each just uses the subset of keys it knows about.
"""
from __future__ import annotations

import time
import uuid

from app.models.translation import ISLTranslation


def transcript_partial_fields(text: str) -> dict:
    return {"speakerId": "user", "partialText": text, "confidence": 0.9}


def transcript_final_fields(text: str, start_time: float, end_time: float) -> dict:
    return {
        "segmentId": str(uuid.uuid4()),
        "speakerId": "user",
        "finalText": text,
        "startTime": start_time,
        "endTime": end_time,
        "confidence": 0.9,
    }


def isl_translation_fields(translation: ISLTranslation) -> dict:
    return {
        "segmentId": str(uuid.uuid4()),
        "originalText": translation.source_text,
        "glossTokens": translation.gloss_sequence,
        "grammarNotes": None,
        "unknownWords": translation.unknown_words,
        "translationMethod": translation.translation_method,
    }


def avatar_motion_events(motion_items: list[dict]) -> list[dict]:
    """One AVATAR_MOTION-shaped dict per sign, from a MotionSequence's items
    — new-frontend expects per-sign events, not a batch. boneTransformUrl
    is honestly null: no real bone/animation asset exists in this MVP pass
    (see frontend-avatar's procedural pose system for what a REAL animation
    source looks like; this field is a placeholder for a future asset)."""
    return [
        {
            "glossToken": item.get("sign_id") or "".join(item.get("characters", [])),
            "boneTransformUrl": None,
            "durationMs": item.get("duration_ms", 800),
        }
        for item in motion_items
    ]


def system_status_fields(audio_active: bool, asr_latency_ms: float, translator_lag_ms: float, cpu_pct: float) -> dict:
    return {
        "audioActive": audio_active,
        "asrLatencyMs": round(asr_latency_ms, 1),
        "translatorLagMs": round(translator_lag_ms, 1),
        # No real frame-rate signal exists on the backend (rendering is
        # entirely client-side) — honestly reported as a fixed placeholder,
        # not measured.
        "avatarFps": 60,
        "cpuUsagePct": round(cpu_pct, 1),
    }


def pipeline_error_fields(recoverable: bool) -> dict:
    return {"code": "PIPELINE_ERROR", "retryable": recoverable}
