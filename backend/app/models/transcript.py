"""Models shared by the ASR service, TranscriptAggregator, and ContextBuffer."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ASRSegment(BaseModel):
    """A single timestamped segment as reported by faster-whisper."""
    text: str
    start: float
    end: float
    avg_logprob: float | None = None


class ASRResult(BaseModel):
    """Structured output of one ASR inference call (one audio chunk)."""
    text: str
    language: str | None = None
    language_probability: float | None = None
    segments: list[ASRSegment] = Field(default_factory=list)
    processing_time: float = 0.0
    is_partial: bool = False


class TranscriptChunk(BaseModel):
    """One aggregator input event — a raw ASR result plus its arrival time."""
    text: str
    timestamp: float
    is_final: bool = False


class FinalizedSegment(BaseModel):
    """A stable, deduplicated stretch of transcript emitted by the aggregator."""
    text: str
    start_timestamp: float
    end_timestamp: float


class ContextSegment(BaseModel):
    """A block of finalized text the ContextBuffer has decided is ready to translate."""
    text: str
    reason: str  # "punctuation" | "silence" | "max_words" | "max_duration" | "manual" | "flush"
    start_timestamp: float
    end_timestamp: float
    word_count: int
