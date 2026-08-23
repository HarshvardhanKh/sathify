"""
SystemAudioInput — live Windows system audio via WASAPI loopback, now fully
wired: capture backend -> preprocessing -> ring buffer -> activity-gated
windowing -> InputEvent, exactly matching Phase 4-9 of the live-audio
integration.

Internally owns:
  - a BaseSystemAudioCapture (soundcard by default, see Phase 3 selection —
    swap via `backend="pyaudiowpatch"` if needed; both are real, tested
    implementations, not stubs)
  - AudioPreprocessor (48kHz stereo -> 16kHz mono, in memory, no temp WAVs)
  - TranscriptionScheduler (ring buffer + activity gating: silent windows
    never reach ASR, and only the freshest window survives if the consumer
    falls behind)

Deliberately still yields InputEvent(audio=window, sample_rate=16000) —
NOT pre-transcribed text — so PipelineManager's existing
`await self._run_asr_chunk(event)` loop (already sequential, so it already
provides the "don't overlap ASR calls" behavior for free) needs zero
changes. This is the seam Phase 10 asks for: SystemAudioInput -> InputEvent
-> [existing] ASR -> [existing] TranscriptAggregator -> ...

Device indices are proven unstable (Bluetooth connect/disconnect reshuffled
16 -> 10 earlier in this investigation) — the capture backend re-resolves
the default output device by name every time, never a cached index, and
transparently restarts if the default device changes mid-session.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import AsyncIterator, Literal

import numpy as np

from app.config import settings
from app.models.input import InputEvent
from app.services.audio.activity import AudioActivityDetector
from app.services.audio.base import BaseSystemAudioCapture
from app.services.audio.preprocessing import AudioPreprocessor
from app.services.audio.pyaudio_capture import PyAudioWASAPICapture
from app.services.audio.ring_buffer import AudioRingBuffer
from app.services.audio.soundcard_capture import SoundcardCapture
from app.services.asr.scheduler import TranscriptionScheduler
from app.services.input.base import InputSource

logger = logging.getLogger("isl.input.system_audio")

BackendName = Literal["soundcard", "pyaudiowpatch"]


def _make_capture(backend: BackendName) -> BaseSystemAudioCapture:
    if backend == "pyaudiowpatch":
        return PyAudioWASAPICapture()
    return SoundcardCapture()


class SystemAudioInput(InputSource):
    def __init__(
        self,
        backend: BackendName = "soundcard",
        window_seconds: float | None = None,
        overlap_seconds: float | None = None,
        target_sample_rate: int | None = None,
    ) -> None:
        self._backend_name = backend
        self._window_seconds = window_seconds or settings.AUDIO_CHUNK_SECONDS
        self._overlap_seconds = overlap_seconds or settings.AUDIO_OVERLAP_SECONDS
        self._target_sample_rate = target_sample_rate or settings.AUDIO_SAMPLE_RATE

        self._capture: BaseSystemAudioCapture = _make_capture(backend)
        self._preprocessor = AudioPreprocessor(self._target_sample_rate)
        self._scheduler = TranscriptionScheduler(
            AudioRingBuffer(self._target_sample_rate, self._window_seconds, self._overlap_seconds),
            AudioActivityDetector(),
        )

        self._pump_task: asyncio.Task | None = None
        self._event_queue: asyncio.Queue[InputEvent | None] | None = None
        self._running = False
        self.last_error: str | None = None

    def get_debug_info(self) -> dict:
        """Phase 12 live-debug data."""
        info = {
            "backend": self._capture.backend_name,
            **self._capture.device_info,
            "target_sample_rate": self._target_sample_rate,
            "window_seconds": self._window_seconds,
            "overlap_seconds": self._overlap_seconds,
            **self._scheduler.stats,
        }
        activity = self._scheduler.last_activity
        if activity is not None:
            info["current_rms"] = round(activity.rms, 5)
            info["current_peak"] = round(activity.peak, 5)
            info["audio_active"] = activity.is_active
        return info

    async def _pump(self) -> None:
        """Consumes raw chunks from the capture backend, preprocesses them,
        feeds the scheduler, and pushes any ready window as an InputEvent
        into a maxsize=1 queue — only the freshest window is ever queued."""
        assert self._event_queue is not None
        try:
            async for raw_chunk in self._capture.stream_chunks():
                if not self._running:
                    break
                mono_16k = self._preprocessor.process(raw_chunk.samples, raw_chunk.sample_rate)
                self._scheduler.push(mono_16k)

                window = self._scheduler.get_ready_window()
                if window is None:
                    continue

                event = InputEvent(
                    source="system_audio",
                    timestamp=time.time(),
                    audio=window,
                    sample_rate=self._target_sample_rate,
                    is_final=False,
                )
                if self._event_queue.full():
                    try:
                        self._event_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                try:
                    self._event_queue.put_nowait(event)
                except asyncio.QueueFull:
                    pass
        except asyncio.CancelledError:
            raise
        except Exception as e:  # noqa: BLE001
            logger.error("[AUDIO] Pump task failed: %s", e)
            self.last_error = str(e)
        finally:
            if self._event_queue is not None:
                try:
                    self._event_queue.put_nowait(None)
                except asyncio.QueueFull:
                    pass

    async def start(self) -> None:
        await self._capture.start()
        self._event_queue = asyncio.Queue(maxsize=1)
        self._running = True
        self._pump_task = asyncio.create_task(self._pump())
        logger.info("[AUDIO] SystemAudioInput started (backend=%s, window=%.1fs, overlap=%.1fs)",
                    self._backend_name, self._window_seconds, self._overlap_seconds)

    async def stop(self) -> None:
        self._running = False
        if self._pump_task is not None:
            self._pump_task.cancel()
            try:
                await self._pump_task
            except (asyncio.CancelledError, Exception):
                pass
            self._pump_task = None
        await self._capture.stop()
        if self._event_queue is not None:
            try:
                self._event_queue.put_nowait(None)
            except asyncio.QueueFull:
                pass

    async def stream(self) -> AsyncIterator[InputEvent]:
        if self._event_queue is None:
            raise RuntimeError("SystemAudioInput.start() must be called before stream()")
        while True:
            event = await self._event_queue.get()
            if event is None:
                break
            yield event
