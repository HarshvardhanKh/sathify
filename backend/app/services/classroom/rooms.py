"""
In-memory classroom room system — no database, no auth, per the explicit
MVP constraint. A room is just an id + a set of connected WebSocket
sessions (one teacher, N students) + the last-known slide state so a
student joining mid-session gets caught up immediately.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

from fastapi import WebSocket

logger = logging.getLogger("isl.classroom.rooms")


@dataclass
class Room:
    room_id: str
    teacher: WebSocket | None = None
    students: set[WebSocket] = field(default_factory=set)
    current_slide: int = 0
    document_id: str | None = None

    @property
    def is_empty(self) -> bool:
        return self.teacher is None and not self.students


class RoomManager:
    def __init__(self) -> None:
        self._rooms: dict[str, Room] = {}

    def get_or_create(self, room_id: str) -> Room:
        if room_id not in self._rooms:
            self._rooms[room_id] = Room(room_id=room_id)
            logger.info("[CLASSROOM] Room %s created", room_id)
        return self._rooms[room_id]

    def get(self, room_id: str) -> Room | None:
        return self._rooms.get(room_id)

    def join_as_teacher(self, room_id: str, ws: WebSocket) -> Room:
        room = self.get_or_create(room_id)
        room.teacher = ws
        return room

    def join_as_student(self, room_id: str, ws: WebSocket) -> Room:
        room = self.get_or_create(room_id)
        room.students.add(ws)
        return room

    async def leave(self, room_id: str, ws: WebSocket) -> None:
        room = self._rooms.get(room_id)
        if room is None:
            return
        if room.teacher is ws:
            room.teacher = None
        room.students.discard(ws)
        if room.is_empty:
            del self._rooms[room_id]
            logger.info("[CLASSROOM] Room %s cleaned up (empty)", room_id)

    async def broadcast_to_students(self, room_id: str, message: dict) -> int:
        room = self._rooms.get(room_id)
        if room is None:
            return 0
        sent = 0
        dead: list[WebSocket] = []
        for student_ws in room.students:
            try:
                await student_ws.send_json(message)
                sent += 1
            except Exception:  # noqa: BLE001
                dead.append(student_ws)
        for ws in dead:
            room.students.discard(ws)
        return sent

    def room_count(self) -> int:
        return len(self._rooms)


room_manager = RoomManager()
