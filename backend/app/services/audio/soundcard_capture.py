"""
SoundcardCapture — BaseSystemAudioCapture implementation using the
`soundcard` library. Selected as primary backend (see Phase 3 comparison in
the research report accompanying this file's introduction) because it was
the one that reliably returned frames in the Step 1 investigation, while
PyAudioWPatch returned zero callbacks under otherwise-identical conditions.

Runs the blocking `soundcard` recorder on a dedicated daemon thread (its
API has no asyncio integration) and hands small chunks to the event loop via
call_soon_threadsafe, matching the "Audio Capture Thread -> Audio Queue"
architecture. Re-checks the default output device on every loop iteration
so a mid-session device change (Bluetooth connect/disconnect, USB headset
unplugged, etc.) is detected and the stream transparently restarts against
the new device (Phase 13) instead of silently capturing from a stale one.
"""
from __future__ import annotations

import asyncio
import logging
import threading
import time
from typing import AsyncIterator

import numpy as np

try:
    import soundcard as sc
except Exception:  # pragma: no cover - platform/driver dependent
    sc = None

from app.services.audio.base import BaseSystemAudioCapture, RawAudioChunk

logger = logging.getLogger("isl.audio.soundcard_capture")

DEFAULT_CHUNK_SECONDS = 0.2


class SoundcardCapture(BaseSystemAudioCapture):
    def __init__(self, chunk_seconds: float = DEFAULT_CHUNK_SECONDS, sample_rate: int = 48000) -> None:
        self._chunk_seconds = chunk_seconds
        self._sample_rate = sample_rate
        self._queue: asyncio.Queue | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._stop_flag = threading.Event()
        self._current_device_name: str | None = None
        self._channels = 2

    @property
    def backend_name(self) -> str:
        return "soundcard"

    @property
    def device_info(self) -> dict:
        if self._current_device_name is None:
            return {}
        return {"name": self._current_device_name, "sample_rate": self._sample_rate, "channels": self._channels}

    def _resolve_loopback_mic(self):
        if sc is None:
            raise RuntimeError("soundcard library not available")
        default_speaker = sc.default_speaker()
        mic = sc.get_microphone(id=str(default_speaker.name), include_loopback=True)
        return mic

    def _capture_thread(self) -> None:
        assert self._queue is not None and self._loop is not None
        frames_per_chunk = int(self._chunk_seconds * self._sample_rate)

        while not self._stop_flag.is_set():
            try:
                mic = self._resolve_loopback_mic()
                self._current_device_name = mic.name
                logger.info("[AUDIO] (soundcard) capturing from %r @ %dHz, chunk=%.2fs",
                            mic.name, self._sample_rate, self._chunk_seconds)

                with mic.recorder(samplerate=self._sample_rate) as rec:
                    while not self._stop_flag.is_set():
                        # Phase 13: detect a default-device change mid-stream
                        # and restart against the new device.
                        current_default = sc.default_speaker().name
                        if current_default not in mic.name and mic.name not in current_default:
                            logger.info("[AUDIO] Default output device changed (%r -> %r); "
                                        "restarting capture", mic.name, current_default)
                            break

                        data = rec.record(numframes=frames_per_chunk)  # (n, channels) float32
                        self._channels = data.shape[1] if data.ndim == 2 else 1
                        chunk = RawAudioChunk(
                            samples=data, sample_rate=self._sample_rate,
                            channels=self._channels, timestamp=time.time(),
                        )
                        self._loop.call_soon_threadsafe(self._safe_put, chunk)
            except Exception as e:  # noqa: BLE001
                logger.error("[AUDIO] (soundcard) capture error: %s; retrying in 1s", e)
                time.sleep(1.0)

        if self._loop is not None and self._queue is not None:
            self._loop.call_soon_threadsafe(self._safe_put, None)

    def _safe_put(self, item) -> None:
        """Drop the oldest queued chunk instead of blocking/crashing if the
        consumer falls behind — live audio must never back up unbounded."""
        assert self._queue is not None
        if self._queue.full():
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            self._queue.put_nowait(item)
        except asyncio.QueueFull:
            pass

    async def start(self) -> None:
        if sc is None:
            raise RuntimeError("soundcard library not available; SoundcardCapture cannot start")
        self._loop = asyncio.get_running_loop()
        self._queue = asyncio.Queue(maxsize=50)
        self._stop_flag.clear()
        self._thread = threading.Thread(target=self._capture_thread, daemon=True)
        self._thread.start()

    async def stop(self) -> None:
        self._stop_flag.set()
        if self._thread is not None:
            self._thread.join(timeout=2.0)
        self._thread = None
        self._current_device_name = None
        if self._queue is not None:
            try:
                self._queue.put_nowait(None)
            except asyncio.QueueFull:
                pass

    async def stream_chunks(self) -> AsyncIterator[RawAudioChunk]:
        if self._queue is None:
            raise RuntimeError("SoundcardCapture.start() must be called before stream_chunks()")
        while True:
            item = await self._queue.get()
            if item is None:
                break
            yield item
