"""
AudioActivityDetector — lightweight RMS-based voice/audio activity
detection on the captured (already 16kHz mono) samples themselves. This is
distinct from AudioDeviceMonitor (device_monitor.py), which checks whether
Windows has an active render *session* — this checks the actual sample
content of what was captured, and is what gates whether a ring-buffer
window is worth sending to faster-whisper at all.

Do NOT conflate "silence right now" with "no audio session" (Phase 7's
explicit warning) — a session can be active with genuine silence in it
(a pause between sentences), which is normal and expected.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import numpy as np

DEFAULT_RMS_THRESHOLD = 0.01
DEFAULT_SILENCE_HOLD_SECONDS = 0.8


@dataclass
class AudioActivity:
    is_active: bool
    rms: float
    peak: float
    timestamp: float


class AudioActivityDetector:
    def __init__(
        self,
        rms_threshold: float = DEFAULT_RMS_THRESHOLD,
        silence_hold_seconds: float = DEFAULT_SILENCE_HOLD_SECONDS,
    ) -> None:
        self.rms_threshold = rms_threshold
        self.silence_hold_seconds = silence_hold_seconds
        self._last_active_ts: float | None = None

    @staticmethod
    def measure(samples: np.ndarray) -> tuple[float, float]:
        if samples.size == 0:
            return 0.0, 0.0
        rms = float(np.sqrt(np.mean(np.square(samples, dtype=np.float64))))
        peak = float(np.max(np.abs(samples)))
        return rms, peak

    def analyze(self, samples: np.ndarray, timestamp: float | None = None) -> AudioActivity:
        timestamp = timestamp if timestamp is not None else time.time()
        rms, peak = self.measure(samples)
        chunk_active = rms >= self.rms_threshold

        if chunk_active:
            self._last_active_ts = timestamp

        # "Active" stays true briefly after the last loud chunk (hold time)
        # so a single quiet frame mid-sentence doesn't flap the status.
        is_active = chunk_active or (
            self._last_active_ts is not None
            and (timestamp - self._last_active_ts) < self.silence_hold_seconds
        )
        return AudioActivity(is_active=is_active, rms=rms, peak=peak, timestamp=timestamp)

    def seconds_since_active(self, now: float | None = None) -> float | None:
        if self._last_active_ts is None:
            return None
        now = now if now is not None else time.time()
        return now - self._last_active_ts
