"""
A tiny async pub/sub event bus decoupling pipeline stages from whoever is
listening (currently the WebSocketManager, but tests can subscribe too).

Bounded per-subscriber queues so a slow consumer can't grow memory
unbounded; publish drops the oldest event for that subscriber rather than
blocking the publisher (the pipeline must never stall on a stuck websocket).
"""
from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator

from app.core.events import EventType, PipelineEvent

logger = logging.getLogger("isl.event_bus")


class EventBus:
    def __init__(self, subscriber_queue_maxsize: int = 200) -> None:
        self._subscribers: dict[int, asyncio.Queue[PipelineEvent]] = {}
        self._next_id = 0
        self._maxsize = subscriber_queue_maxsize
        self._lock = asyncio.Lock()

    async def subscribe(self) -> tuple[int, "asyncio.Queue[PipelineEvent]"]:
        async with self._lock:
            sub_id = self._next_id
            self._next_id += 1
            q: asyncio.Queue[PipelineEvent] = asyncio.Queue(maxsize=self._maxsize)
            self._subscribers[sub_id] = q
            return sub_id, q

    async def unsubscribe(self, sub_id: int) -> None:
        async with self._lock:
            self._subscribers.pop(sub_id, None)

    async def publish(self, event_type: EventType, data: dict | None = None) -> PipelineEvent:
        event = PipelineEvent(type=event_type, data=data or {})
        logger.debug("[EVENT] %s %s", event.type, event.data)
        async with self._lock:
            subscribers = list(self._subscribers.items())
        for sub_id, q in subscribers:
            if q.full():
                # Drop oldest to make room rather than blocking the pipeline.
                try:
                    q.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning("Subscriber %s queue still full after eviction; dropping event", sub_id)
        return event

    async def stream(self, sub_id: int, q: "asyncio.Queue[PipelineEvent]") -> AsyncIterator[PipelineEvent]:
        try:
            while True:
                yield await q.get()
        finally:
            await self.unsubscribe(sub_id)


# Process-wide singleton — simplest correct choice for a single-pipeline app.
event_bus = EventBus()
