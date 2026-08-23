"""
Generic input source interface. Every concrete source (live system audio,
an audio file, typed text, a scripted mock stream) implements this and
yields InputEvent — the one shape the rest of the pipeline understands.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import AsyncIterator

from app.models.input import InputEvent


class InputSource(ABC):
    @abstractmethod
    async def start(self) -> None:
        """Acquire resources (open device/file, prep state). Idempotent-safe to call once per run."""

    @abstractmethod
    async def stop(self) -> None:
        """Release resources. Must be safe to call even if start() failed partway."""

    @abstractmethod
    def stream(self) -> AsyncIterator[InputEvent]:
        """Async-iterate InputEvents until the source is stopped/exhausted."""
