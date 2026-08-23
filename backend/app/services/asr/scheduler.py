"""
TranscriptionScheduler — the Phase 9 "Audio Ring Buffer -> Transcription
Scheduler -> faster-whisper" gate. Owns the AudioRingBuffer + an
AudioActivityDetector and decides WHICH window (if any) is worth sending
for transcription — it does not call faster-whisper itself (that stays in
PipelineManager exactly where it already was, so the existing pipeline
doesn't need touching).

Two responsibilities that directly implement the "don't allow an unlimited
backlog" / "prioritize LIVE over perfect historical transcription" rules:
  1. Silent windows are dropped before ever reaching ASR (measured via
     AudioActivityDetector, not just "was there a render session").
  2. If multiple windows became ready while the consumer wasn't looking
     (busy awaiting a previous ASR call), only the MOST RECENT is kept —
     older ones are discarded rather than queued, so the system catches up
     to live audio instead of falling further behind.
"""
from __future__ import annotations

import logging

import numpy as np

from app.services.audio.activity import AudioActivity, AudioActivityDetector
from app.services.audio.ring_buffer import AudioRingBuffer

logger = logging.getLogger("isl.asr.scheduler")


class TranscriptionScheduler:
    def __init__(self, ring_buffer: AudioRingBuffer, activity_detector: AudioActivityDetector | None = None) -> None:
        self.ring_buffer = ring_buffer
        self.activity_detector = activity_detector or AudioActivityDetector()
        self._last_activity: AudioActivity | None = None
        self._dropped_stale_windows = 0
        self._dropped_silent_windows = 0

    def push(self, mono_chunk: np.ndarray) -> None:
        self.ring_buffer.push(mono_chunk)

    @property
    def last_activity(self) -> AudioActivity | None:
        return self._last_activity

    def get_ready_window(self) -> np.ndarray | None:
        """Non-blocking: returns the latest ready+active window, or None."""
        latest = None
        while True:
            window = self.ring_buffer.pop_window()
            if window is None:
                break
            if latest is not None:
                self._dropped_stale_windows += 1
            latest = window

        if latest is None:
            return None

        activity = self.activity_detector.analyze(latest)
        self._last_activity = activity
        if not activity.is_active:
            self._dropped_silent_windows += 1
            logger.debug("[ASR_SCHEDULER] Dropping silent window (rms=%.4f)", activity.rms)
            return None

        return latest

    @property
    def stats(self) -> dict:
        return {
            "dropped_stale_windows": self._dropped_stale_windows,
            "dropped_silent_windows": self._dropped_silent_windows,
            "buffered_seconds": self.ring_buffer.buffered_seconds,
            "pending_seconds": self.ring_buffer.pending_seconds,
        }
