"""
MockInput — replays a scripted list of strings as if they were successive
ASR finals, with a configurable delay between them. Useful for exercising
the streaming aggregation/context-buffer/websocket path end-to-end without
real audio or a GPU.
"""
from __future__ import annotations

import asyncio
import time
from typing import AsyncIterator

from app.models.input import InputEvent
from app.services.input.base import InputSource


class MockInput(InputSource):
    def __init__(self, script: list[str], delay_seconds: float = 0.8) -> None:
        self._script = script
        self._delay = delay_seconds
        self._started = False

    async def start(self) -> None:
        self._started = True

    async def stop(self) -> None:
        self._started = False

    async def stream(self) -> AsyncIterator[InputEvent]:
        if not self._started:
            raise RuntimeError("MockInput.start() must be called before stream()")
        for i, chunk in enumerate(self._script):
            if not self._started:
                break
            yield InputEvent(
                source="mock",
                timestamp=time.time(),
                text=chunk,
                is_final=(i == len(self._script) - 1),
            )
            await asyncio.sleep(self._delay)
