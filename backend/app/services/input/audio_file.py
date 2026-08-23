"""
AudioFileInput — reads a WAV file from disk and yields it as chunked
InputEvents, mirroring how live system audio would arrive (fixed chunk size
with overlap), so the exact same downstream ASR/aggregation/context code
path validated here also works for live audio later (Step 8/9 of the
implementation order).
"""
from __future__ import annotations

import logging
import time
import wave
from pathlib import Path
from typing import AsyncIterator

import numpy as np

from app.config import settings
from app.models.input import InputEvent
from app.services.input.base import InputSource

logger = logging.getLogger("isl.input.audio_file")


def _resample_linear(audio: np.ndarray, src_rate: int, dst_rate: int) -> np.ndarray:
    if src_rate == dst_rate:
        return audio
    duration = len(audio) / src_rate
    n_dst = int(round(duration * dst_rate))
    src_x = np.linspace(0, duration, num=len(audio), endpoint=False)
    dst_x = np.linspace(0, duration, num=n_dst, endpoint=False)
    return np.interp(dst_x, src_x, audio).astype(np.float32)


def load_wav_as_float32_mono(path: str | Path, target_rate: int) -> np.ndarray:
    with wave.open(str(path), "rb") as wf:
        channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        rate = wf.getframerate()
        raw = wf.readframes(wf.getnframes())

    if sample_width == 2:
        samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    elif sample_width == 4:
        samples = np.frombuffer(raw, dtype=np.int32).astype(np.float32) / 2147483648.0
    elif sample_width == 1:
        samples = (np.frombuffer(raw, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
    else:
        raise ValueError(f"Unsupported WAV sample width: {sample_width}")

    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)

    return _resample_linear(samples, rate, target_rate)


class AudioFileInput(InputSource):
    def __init__(
        self,
        path: str | Path,
        chunk_seconds: float | None = None,
        overlap_seconds: float | None = None,
        sample_rate: int | None = None,
    ) -> None:
        self._path = Path(path)
        self._chunk_seconds = chunk_seconds or settings.AUDIO_CHUNK_SECONDS
        self._overlap_seconds = overlap_seconds or settings.AUDIO_OVERLAP_SECONDS
        self._sample_rate = sample_rate or settings.AUDIO_SAMPLE_RATE
        self._started = False

    async def start(self) -> None:
        if not self._path.exists():
            raise FileNotFoundError(f"Audio file not found: {self._path}")
        self._started = True

    async def stop(self) -> None:
        self._started = False

    async def stream(self) -> AsyncIterator[InputEvent]:
        if not self._started:
            raise RuntimeError("AudioFileInput.start() must be called before stream()")

        audio = load_wav_as_float32_mono(self._path, self._sample_rate)
        chunk_len = int(self._chunk_seconds * self._sample_rate)
        step = max(1, int((self._chunk_seconds - self._overlap_seconds) * self._sample_rate))

        logger.info(
            "[AUDIO_FILE] %s: %.2fs total, chunk=%.1fs overlap=%.1fs",
            self._path.name, len(audio) / self._sample_rate,
            self._chunk_seconds, self._overlap_seconds,
        )

        pos = 0
        n = len(audio)
        while pos < n and self._started:
            end = min(pos + chunk_len, n)
            chunk = audio[pos:end]
            is_final = end >= n
            yield InputEvent(
                source="audio_file",
                timestamp=time.time(),
                audio=chunk,
                sample_rate=self._sample_rate,
                is_final=is_final,
                metadata={"file": str(self._path), "chunk_start_sec": pos / self._sample_rate},
            )
            if is_final:
                break
            pos += step
