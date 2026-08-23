"""
Motion sequence format — the contract between the translation/sign-resolution
pipeline and the avatar renderer. `animation_id` is what the frontend looks
up in its locally-cached GET /api/animations library (see
services/animation/library.py) to find an actual pose to play; `sign_id`
is kept for debugging/display. `expression` carries the coarse facial cue
from ExpressionResolver for the whole segment.
"""
from __future__ import annotations

from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

DEFAULT_SIGN_DURATION_MS = 800
DEFAULT_LETTER_DURATION_MS = 350
WORD_PAUSE_MS = 400  # extra pause between fingerspelled words (Phase 9: don't flatten multi-word names)


class MotionItem(BaseModel):
    type: Literal["sign", "fingerspell"]
    sign_id: str | None = None       # for type == "sign"
    animation_id: str | None = None  # frontend animation-library lookup key
    characters: list[str] = Field(default_factory=list)  # for type == "fingerspell" (one word's letters)
    duration_ms: int = DEFAULT_SIGN_DURATION_MS


class MotionSequence(BaseModel):
    sequence_id: str = Field(default_factory=lambda: str(uuid4()))
    source_text: str
    translation: list[str] = Field(default_factory=list)
    items: list[MotionItem] = Field(default_factory=list)
    expression: str = "NEUTRAL"

    @property
    def total_duration_ms(self) -> int:
        return sum(item.duration_ms for item in self.items)
