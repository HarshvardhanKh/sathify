"""
ContextBuffer — decides WHEN enough linguistic context has accumulated to
be worth sending to the ISL translator, instead of translating every
individual word as it arrives.

Emits a ContextSegment when any of these trigger (checked in this order):
  1. Sentence-ending punctuation in the newly added text (. ? !  or , as a
     softer clause boundary)
  2. A pause longer than `silence_threshold_seconds` since the previous add
  3. `max_words` reached
  4. `max_duration_seconds` reached

All thresholds are configurable (see app.config.Settings) so latency vs.
context can be tuned without code changes.
"""
from __future__ import annotations

import logging
import time

from app.config import settings
from app.models.transcript import ContextSegment

logger = logging.getLogger("isl.transcript.context_buffer")

_SENTENCE_ENDERS = (".", "?", "!")
_CLAUSE_ENDERS = (",",)


class ContextBuffer:
    def __init__(
        self,
        max_words: int | None = None,
        max_duration_seconds: float | None = None,
        silence_threshold_seconds: float | None = None,
    ) -> None:
        self.max_words = max_words or settings.CONTEXT_MAX_WORDS
        self.max_duration_seconds = max_duration_seconds or settings.CONTEXT_MAX_SECONDS
        self.silence_threshold_seconds = silence_threshold_seconds or settings.CONTEXT_SILENCE_THRESHOLD

        self._words: list[str] = []
        self._buffer_start_ts: float | None = None
        self._last_add_ts: float | None = None

    def _current_text(self) -> str:
        return " ".join(self._words)

    def add_text(self, text: str, timestamp: float) -> ContextSegment | None:
        """Add newly finalized text to the buffer. Returns a ContextSegment
        if this addition should trigger translation, else None."""
        text = text.strip()
        if not text:
            return None

        pause_triggered = False
        if self._last_add_ts is not None and (timestamp - self._last_add_ts) >= self.silence_threshold_seconds:
            pause_triggered = True

        if self._buffer_start_ts is None:
            self._buffer_start_ts = timestamp

        self._words.extend(text.split())
        self._last_add_ts = timestamp

        reason = None
        if any(text.rstrip().endswith(p) for p in _SENTENCE_ENDERS):
            reason = "punctuation"
        elif pause_triggered:
            reason = "silence"
        elif len(self._words) >= self.max_words:
            reason = "max_words"
        elif (timestamp - self._buffer_start_ts) >= self.max_duration_seconds:
            reason = "max_duration"

        if reason:
            return self._finalize(reason, timestamp)
        return None

    def check_timeout(self, now: float | None = None) -> ContextSegment | None:
        """Call periodically (e.g. once per second in a streaming loop) to
        catch max_duration / silence triggers even when no new text has
        arrived yet."""
        if not self._words or self._buffer_start_ts is None:
            return None
        now = now if now is not None else time.time()

        if self._last_add_ts is not None and (now - self._last_add_ts) >= self.silence_threshold_seconds:
            return self._finalize("silence", now)
        if (now - self._buffer_start_ts) >= self.max_duration_seconds:
            return self._finalize("max_duration", now)
        return None

    def flush(self) -> ContextSegment | None:
        """Manually force out whatever is buffered (e.g. on pipeline stop)."""
        if not self._words:
            return None
        return self._finalize("flush", self._last_add_ts or time.time())

    def _finalize(self, reason: str, end_ts: float) -> ContextSegment:
        text = self._current_text().strip()
        start_ts = self._buffer_start_ts if self._buffer_start_ts is not None else end_ts
        segment = ContextSegment(
            text=text, reason=reason, start_timestamp=start_ts, end_timestamp=end_ts,
            word_count=len(self._words),
        )
        logger.info("[CONTEXT] Finalized segment (%s, %d words): %r", reason, segment.word_count, text)
        self._words = []
        self._buffer_start_ts = None
        return segment
