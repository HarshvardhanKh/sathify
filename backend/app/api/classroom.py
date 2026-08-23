"""
POST /api/classroom/rooms — create/get a room id.
WS /ws/classroom/{room_id}?role=teacher|student — join a room.

Teacher sends: {"type": "SLIDE_CHANGE", "slide": 7}
Students receive the same message broadcast, plus an initial SLIDE_CHANGE
on join reflecting the room's current state (so joining mid-session works).
"""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.services.classroom.rooms import room_manager

logger = logging.getLogger("isl.api.classroom")

router = APIRouter(tags=["classroom"])


class CreateRoomResponse(BaseModel):
    roomId: str


@router.post("/api/classroom/rooms", response_model=CreateRoomResponse)
async def create_room():
    return CreateRoomResponse(roomId=str(uuid.uuid4())[:8])


@router.websocket("/ws/classroom/{room_id}")
async def classroom_ws(websocket: WebSocket, room_id: str, role: str = "student"):
    await websocket.accept()
    is_teacher = role == "teacher"

    if is_teacher:
        room = room_manager.join_as_teacher(room_id, websocket)
    else:
        room = room_manager.join_as_student(room_id, websocket)
        # Catch the joining student up on current state immediately.
        await websocket.send_json({"type": "SLIDE_CHANGE", "slide": room.current_slide})

    logger.info("[CLASSROOM] %s joined room %s", role, room_id)

    try:
        while True:
            data = await websocket.receive_json()
            if not is_teacher:
                continue  # students cannot drive room state in this MVP
            if data.get("type") == "SLIDE_CHANGE":
                room.current_slide = int(data.get("slide", room.current_slide))
                await room_manager.broadcast_to_students(room_id, {
                    "type": "SLIDE_CHANGE", "slide": room.current_slide,
                })
    except WebSocketDisconnect:
        pass
    except Exception as e:  # noqa: BLE001
        logger.warning("[CLASSROOM] Connection error in room %s: %s", room_id, e)
    finally:
        await room_manager.leave(room_id, websocket)
        logger.info("[CLASSROOM] %s left room %s", role, room_id)
