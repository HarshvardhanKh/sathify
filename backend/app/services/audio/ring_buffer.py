"""
AudioRingBuffer — accumulates small preprocessed audio chunks (16kHz mono
float32) and hands out fixed-size, overlapping transcription windows.

Example (window=3.0s, overlap=0.75s, step=2.25s):
  push 0.0-0.2, 0.2-0.4, ... until 3.0s accumulated -> pop_window() returns
  [0.0, 3.0). Next call only returns a window once another `step` seconds
  (2.25s) have accumulated -> [2.25, 5.25). The overlap is what lets
  TranscriptAggregator's dedup logic downstream stitch words back together
  instead of clipping them at a hard boundary — this class does NOT do any
  dedup/transcript logic itself (that stays in TranscriptAggregator, per the
  "don't duplicate transcript logic in the audio module" rule).

Bounded: old audio beyond `max_seconds` is discarded so this can run
indefinitely without unbounded memory growth.
"""
from __future__ import annotations

import numpy as np


class AudioRingBuffer:
    def __init__(
        self,
        sample_rate: int,
        window_seconds: float,
        overlap_seconds: float,
        max_seconds: float = 30.0,
    ) -> None:
        if overlap_seconds >= window_seconds:
            raise ValueError("overlap_seconds must be less than window_seconds")
        self.sample_rate = sample_rate
        self.window_seconds = window_seconds
        self.overlap_seconds = overlap_seconds
        self.step_seconds = window_seconds - overlap_seconds

        self._buffer = np.zeros(0, dtype=np.float32)
        self._next_window_start = 0  # sample index into _buffer
        self._max_samples = int(max_seconds * sample_rate)

    def push(self, chunk: np.ndarray) -> None:
        if chunk.size == 0:
            return
        self._buffer = np.concatenate([self._buffer, chunk.astype(np.float32)])
        if len(self._buffer) > self._max_samples:
            trim = len(self._buffer) - self._max_samples
            self._buffer = self._buffer[trim:]
            self._next_window_start = max(0, self._next_window_start - trim)

    def pop_window(self) -> np.ndarray | None:
        """Return the next window if enough audio has accumulated, advancing
        the internal cursor by `step_seconds`. Returns None if not ready yet."""
        window_samples = int(self.window_seconds * self.sample_rate)
        step_samples = int(self.step_seconds * self.sample_rate)
        end = self._next_window_start + window_samples
        if end > len(self._buffer):
            return None
        window = self._buffer[self._next_window_start:end].copy()
        self._next_window_start += step_samples
        return window

    @property
    def buffered_seconds(self) -> float:
        return len(self._buffer) / self.sample_rate

    @property
    def pending_seconds(self) -> float:
        """How much unconsumed audio is waiting past the last popped window."""
        return max(0.0, len(self._buffer) - self._next_window_start) / self.sample_rate

    def reset(self) -> None:
        self._buffer = np.zeros(0, dtype=np.float32)
        self._next_window_start = 0
