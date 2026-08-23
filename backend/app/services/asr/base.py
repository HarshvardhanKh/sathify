"""Abstract ASR interface so faster-whisper can be swapped later without
touching the pipeline manager."""
from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from app.models.transcript import ASRResult


class ASRService(ABC):
    @abstractmethod
    async def transcribe(self, audio: np.ndarray, sample_rate: int) -> ASRResult:
        """Transcribe one chunk of mono float32 audio at `sample_rate`."""

    @abstractmethod
    def is_ready(self) -> bool:
        """Whether the model has finished loading and is safe to call."""
