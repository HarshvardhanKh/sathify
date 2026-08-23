"""
WebSocketManager — bridges the EventBus to connected /ws/live clients.

Each connection gets its own EventBus subscription (bounded queue) so one
slow client can't back up another. On disconnect, cleans up its
subscription. Publishing to a dead/erroring socket never crashes the
pipeline — the send loop just ends for that connection.

Runs two concurrent tasks per connection: outbound (EventBus -> client) and
inbound (client -> PING/PONG heartbeat reply). new-frontend's
ReconnectingSocket sends {"type":"PING"} every 20s and force-closes/reconnects
if no {"type":"PONG"} arrives within 5s — without an inbound reader that
heartbeat always times out and the client reconnects needlessly every 20s.
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.core.event_bus import event_bus

logger = logging.getLogger("isl.websocket.manager")


class WebSocketManager:
    def __init__(self) -> None:
        self._active: set[WebSocket] = set()

    async def _send_loop(self, websocket: WebSocket, sub_id: int, queue) -> None:
        async for event in event_bus.stream(sub_id, queue):
            await websocket.send_json(event.model_dump())

    async def _receive_loop(self, websocket: WebSocket) -> None:
        while True:
            data = await websocket.receive_json()
            if isinstance(data, dict) and data.get("type") == "PING":
                await websocket.send_json({"type": "PONG", "timestamp": data.get("timestamp")})

    async def handle_connection(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active.add(websocket)
        sub_id, queue = await event_bus.subscribe()
        logger.info("[WEBSOCKET] Client connected (sub_id=%s), total=%d", sub_id, len(self._active))
        send_task = asyncio.create_task(self._send_loop(websocket, sub_id, queue))
        receive_task = asyncio.create_task(self._receive_loop(websocket))
        try:
            done, pending = await asyncio.wait(
                {send_task, receive_task}, return_when=asyncio.FIRST_COMPLETED
            )
            for task in pending:
                task.cancel()
            for task in done:
                exc = task.exception()
                if exc and not isinstance(exc, WebSocketDisconnect):
                    raise exc
        except WebSocketDisconnect:
            logger.info("[WEBSOCKET] Client disconnected (sub_id=%s)", sub_id)
        except Exception as e:  # noqa: BLE001
            logger.warning("[WEBSOCKET] Connection error (sub_id=%s): %s", sub_id, e)
        finally:
            send_task.cancel()
            receive_task.cancel()
            await event_bus.unsubscribe(sub_id)
            self._active.discard(websocket)

    @property
    def active_count(self) -> int:
        return len(self._active)


websocket_manager = WebSocketManager()
