"""
TextInput — feeds a single piece of typed text straight into the pipeline,
bypassing ASR entirely. This is what powers POST /api/text/process and lets
the entire downstream pipeline (language detection -> ... -> motion) be
tested without any audio path working.
"""
from __future__ import annotations

import time
from typing import AsyncIterator

from app.models.input import InputEvent
from app.services.input.base import InputSource


class TextInput(InputSource):
    def __init__(self, text: str) -> None:
        self._text = text
        self._started = False

    async def start(self) -> None:
        self._started = True

    async def stop(self) -> None:
        self._started = False

    async def stream(self) -> AsyncIterator[InputEvent]:
        if not self._started:
            raise RuntimeError("TextInput.start() must be called before stream()")
        yield InputEvent(
            source="text",
            timestamp=time.time(),
            text=self._text,
            is_final=True,
        )
