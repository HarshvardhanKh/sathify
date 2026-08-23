"""
PipelineMetrics — tracks per-stage timing so we can see where latency goes
and, later, optimize toward the 1-3s end-to-end target. Exposed via
GET /api/status.
"""
from __future__ import annotations

import logging
import threading
import time
from collections import deque
from contextlib import contextmanager

logger = logging.getLogger("isl.metrics")

STAGES = (
    "input",
    "asr",
    "transcript_aggregation",
    "context_buffer",
    "language_detection",
    "normalization",
    "translation",
    "sign_resolution",
    "motion_generation",
    "total",
)


class PipelineMetrics:
    """Thread-safe rolling metrics recorder (audio capture may run off-loop)."""

    def __init__(self, history_size: int = 50) -> None:
        self._lock = threading.Lock()
        self._history_size = history_size
        self._durations_ms: dict[str, deque[float]] = {s: deque(maxlen=history_size) for s in STAGES}
        self._last_run_ms: dict[str, float] = {}
        self._counters: dict[str, int] = {}

    def record(self, stage: str, duration_ms: float) -> None:
        with self._lock:
            self._durations_ms.setdefault(stage, deque(maxlen=self._history_size)).append(duration_ms)
            self._last_run_ms[stage] = duration_ms
        logger.info("[METRICS] %s: %.2f ms", stage, duration_ms)

    def increment(self, counter: str, by: int = 1) -> None:
        with self._lock:
            self._counters[counter] = self._counters.get(counter, 0) + by

    @contextmanager
    def timer(self, stage: str):
        start = time.perf_counter()
        try:
            yield
        finally:
            self.record(stage, (time.perf_counter() - start) * 1000.0)

    def snapshot(self) -> dict:
        with self._lock:
            out: dict = {"last_run_ms": dict(self._last_run_ms), "counters": dict(self._counters), "averages_ms": {}}
            for stage, values in self._durations_ms.items():
                if values:
                    out["averages_ms"][stage] = round(sum(values) / len(values), 2)
            return out


metrics = PipelineMetrics()
