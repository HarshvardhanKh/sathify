import asyncio

from app.services.classroom.rooms import RoomManager


class _FakeWebSocket:
    def __init__(self, fail_send: bool = False):
        self.sent: list[dict] = []
        self._fail_send = fail_send

    async def send_json(self, data: dict) -> None:
        if self._fail_send:
            raise ConnectionError("simulated disconnect")
        self.sent.append(data)


def run(coro):
    return asyncio.run(coro)


def test_teacher_and_student_join():
    mgr = RoomManager()
    teacher_ws = _FakeWebSocket()
    student_ws = _FakeWebSocket()

    room = mgr.join_as_teacher("room1", teacher_ws)
    assert room.teacher is teacher_ws

    room = mgr.join_as_student("room1", student_ws)
    assert student_ws in room.students


def test_slide_change_broadcasts_to_students():
    mgr = RoomManager()
    s1, s2 = _FakeWebSocket(), _FakeWebSocket()
    mgr.join_as_student("room1", s1)
    mgr.join_as_student("room1", s2)

    sent_count = run(mgr.broadcast_to_students("room1", {"type": "SLIDE_CHANGE", "slide": 7}))
    assert sent_count == 2
    assert s1.sent == [{"type": "SLIDE_CHANGE", "slide": 7}]
    assert s2.sent == [{"type": "SLIDE_CHANGE", "slide": 7}]


def test_dead_student_connection_is_pruned_on_broadcast():
    mgr = RoomManager()
    alive = _FakeWebSocket()
    dead = _FakeWebSocket(fail_send=True)
    mgr.join_as_student("room1", alive)
    mgr.join_as_student("room1", dead)

    sent_count = run(mgr.broadcast_to_students("room1", {"type": "SLIDE_CHANGE", "slide": 1}))
    assert sent_count == 1
    room = mgr.get("room1")
    assert dead not in room.students
    assert alive in room.students


def test_room_cleaned_up_when_empty():
    mgr = RoomManager()
    ws = _FakeWebSocket()
    mgr.join_as_teacher("room1", ws)
    assert mgr.get("room1") is not None

    run(mgr.leave("room1", ws))
    assert mgr.get("room1") is None


def test_room_not_removed_while_students_remain():
    mgr = RoomManager()
    teacher_ws = _FakeWebSocket()
    student_ws = _FakeWebSocket()
    mgr.join_as_teacher("room1", teacher_ws)
    mgr.join_as_student("room1", student_ws)

    run(mgr.leave("room1", teacher_ws))
    assert mgr.get("room1") is not None  # student still connected
    run(mgr.leave("room1", student_ws))
    assert mgr.get("room1") is None
