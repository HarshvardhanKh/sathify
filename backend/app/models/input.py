"""
Common internal event format produced by every InputSource implementation
(live system audio, audio file, manual text, mock stream). Everything
downstream of input normalization consumes InputEvent, not the raw source.
"""
from __future__ import annotations

from typing import Literal

import numpy as np
from pydantic import BaseModel, ConfigDict, Field

InputSourceKind = Literal["system_audio", "audio_file", "text", "mock"]


class InputEvent(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    source: InputSourceKind
    timestamp: float
    # For text input:
    text: str | None = None
    # For audio input (raw PCM float32 mono, or bytes if not yet decoded):
    audio: np.ndarray | None = None
    sample_rate: int | None = None
    # True for the final chunk/segment of a bounded source (file, mock, single text)
    is_final: bool = True
    metadata: dict = Field(default_factory=dict)
