"""
PyAudioWASAPICapture — BaseSystemAudioCapture implementation using
PyAudioWPatch's WASAPI loopback support. Kept as a real, working alternative
backend (not a stub) per Phase 3's "keep capture backends interchangeable"
requirement, even though soundcard was selected as primary — see the
Phase 3 comparison in the research report for why, and re-verify with
`scripts/step2_test_backends_with_verified_audio.py` before trusting this
path, since earlier (unverified-audio) testing showed it producing zero
callbacks.

Uses callback mode (matches PyAudioWPatch's own documented recording
pattern) and, like SoundcardCapture, re-resolves the default loopback device
by name on every start()/restart — never a cached index.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import AsyncIterator

import numpy as np

try:
    import pyaudiowpatch as pyaudio
except Exception:  # pragma: no cover - platform/driver dependent
    pyaudio = None

from app.services.audio.base import BaseSystemAudioCapture, RawAudioChunk

logger = logging.getLogger("isl.audio.pyaudio_capture")

DEFAULT_CHUNK_SECONDS = 0.2


class PyAudioWASAPICapture(BaseSystemAudioCapture):
    def __init__(self, chunk_seconds: float = DEFAULT_CHUNK_SECONDS) -> None:
        self._chunk_seconds = chunk_seconds
        self._p: "pyaudio.PyAudio | None" = None
        self._stream = None
        self._queue: asyncio.Queue | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._device: dict | None = None
        self._callback_count = 0

    @property
    def backend_name(self) -> str:
        return "pyaudiowpatch"

    @property
    def device_info(self) -> dict:
        if self._device is None:
            return {}
        return {
            "name": self._device["name"],
            "sample_rate": int(self._device["defaultSampleRate"]),
            "channels": int(self._device["maxInputChannels"]),
        }

    def _resolve_loopback_device(self, p) -> dict:
        wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
        default_speakers = p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
        if not default_speakers.get("isLoopbackDevice", False):
            for loopback in p.get_loopback_device_info_generator():
                if default_speakers["name"] in loopback["name"]:
                    return loopback
            raise RuntimeError("No loopback device found matching the default output device")
        return default_speakers

    def _callback(self, in_data, frame_count, time_info, status):
        self._callback_count += 1
        if self._device is not None and self._loop is not None and self._queue is not None:
            channels = int(self._device["maxInputChannels"])
            samples = np.frombuffer(in_data, dtype=np.int16).astype(np.float32) / 32768.0
            if channels > 1:
                samples = samples.reshape(-1, channels)
            chunk = RawAudioChunk(
                samples=samples, sample_rate=int(self._device["defaultSampleRate"]),
                channels=channels, timestamp=time.time(),
            )
            self._loop.call_soon_threadsafe(self._safe_put, chunk)
        return (in_data, pyaudio.paContinue)

    def _safe_put(self, item) -> None:
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
        if pyaudio is None:
            raise RuntimeError("PyAudioWPatch not available; PyAudioWASAPICapture cannot start")
        self._loop = asyncio.get_running_loop()
        self._queue = asyncio.Queue(maxsize=50)
        self._callback_count = 0

        self._p = pyaudio.PyAudio()
        self._device = self._resolve_loopback_device(self._p)
        channels = int(self._device["maxInputChannels"])
        rate = int(self._device["defaultSampleRate"])
        frames_per_buffer = int(self._chunk_seconds * rate)

        logger.info("[AUDIO] (pyaudiowpatch) capturing from %r @ %dHz", self._device["name"], rate)
        self._stream = self._p.open(
            format=pyaudio.paInt16,
            channels=channels,
            rate=rate,
            input=True,
            frames_per_buffer=frames_per_buffer,
            input_device_index=self._device["index"],
            stream_callback=self._callback,
        )
        self._stream.start_stream()

    async def stop(self) -> None:
        if self._stream is not None:
            try:
                self._stream.stop_stream()
                self._stream.close()
            except Exception as e:  # noqa: BLE001
                logger.warning("[AUDIO] (pyaudiowpatch) error closing stream: %s", e)
            self._stream = None
        if self._p is not None:
            self._p.terminate()
            self._p = None
        self._device = None
        if self._queue is not None:
            try:
                self._queue.put_nowait(None)
            except asyncio.QueueFull:
                pass

    async def stream_chunks(self) -> AsyncIterator[RawAudioChunk]:
        if self._queue is None:
            raise RuntimeError("PyAudioWASAPICapture.start() must be called before stream_chunks()")
        while True:
            item = await self._queue.get()
            if item is None:
                break
            yield item
