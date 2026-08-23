"""
BaseSystemAudioCapture — the interchangeable-backend interface Phase 3 asks
for. Two implementations: SoundcardCapture and PyAudioWASAPICapture. Neither
the ring buffer, preprocessor, activity detector, nor SystemAudioInput cares
which one is active — this is exactly the "capture backend can be replaced"
seam from the very first version of this project.

Both implementations must:
  - Never hardcode a device index (device indices are proven unstable —
    Bluetooth connect/disconnect reshuffled 16 -> 10 earlier in this
    investigation) — always resolve the CURRENT default output device by
    name/id at start() time.
  - Detect a default-device change while running and transparently
    restart the stream against the new device (Phase 13).
  - Yield small raw chunks (~100-250ms, native sample rate/channels) via
    stream_chunks(), not pre-windowed audio — windowing is AudioRingBuffer's
    job, kept out of the capture backend on purpose.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator

import numpy as np


@dataclass
class RawAudioChunk:
    samples: np.ndarray  # (n, channels) or (n,) float32, native sample rate
    sample_rate: int
    channels: int
    timestamp: float


class BaseSystemAudioCapture(ABC):
    @abstractmethod
    async def start(self) -> None:
        """Resolve the current default output device's loopback and begin capturing."""

    @abstractmethod
    async def stop(self) -> None:
        """Stop capture and release the stream. Safe to call even if start() failed."""

    @abstractmethod
    def stream_chunks(self) -> AsyncIterator[RawAudioChunk]:
        """Async-iterate small raw audio chunks until stopped."""

    @property
    @abstractmethod
    def backend_name(self) -> str:
        ...

    @property
    @abstractmethod
    def device_info(self) -> dict:
        """{'name': ..., 'sample_rate': ..., 'channels': ...} of the device
        currently being captured, or {} if not started."""
