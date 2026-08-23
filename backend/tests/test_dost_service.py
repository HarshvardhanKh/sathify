import asyncio

from app.models.dost import DostChatRequest
from app.services.ai.gemini_client import GeminiClient, GeminiResult
from app.services.dost.prompts import build_system_prompt
from app.services.dost.service import DostService


def run(coro):
    return asyncio.run(coro)


class _FakeClient:
    def __init__(self, result: GeminiResult):
        self._result = result

    async def generate(self, system_prompt, user_message):
        self._last_system_prompt = system_prompt
        return self._result


def test_unavailable_when_no_gemini_result():
    fake = _FakeClient(GeminiResult(ok=False, error="no keys", error_code="NO_KEYS_CONFIGURED"))
    service = DostService(client=fake)  # type: ignore[arg-type]
    resp = run(service.chat(DostChatRequest(message="hi", mode="teacher", age=15, language="english")))
    assert resp.available is False
    assert "unavailable" in resp.response.lower()


def test_available_response_passthrough():
    fake = _FakeClient(GeminiResult(ok=True, text="Newton's first law states..."))
    service = DostService(client=fake)  # type: ignore[arg-type]
    resp = run(service.chat(DostChatRequest(message="Explain Newton's first law", mode="teacher", age=16, language="english")))
    assert resp.available is True
    assert resp.response == "Newton's first law states..."
    assert resp.mode == "teacher"
    assert resp.age == 16


def test_teacher_vs_friend_prompts_differ():
    teacher = build_system_prompt("teacher", 18, "english")
    friend = build_system_prompt("friend", 18, "english")
    assert teacher != friend
    assert "TEACHER MODE" in teacher
    assert "FRIEND MODE" in friend


def test_age_bands_produce_different_instructions():
    young = build_system_prompt("teacher", 11, "english")
    teen = build_system_prompt("teacher", 16, "english")
    adult = build_system_prompt("teacher", 25, "english")
    mature = build_system_prompt("teacher", 45, "english")

    prompts = {young, teen, adult, mature}
    assert len(prompts) == 4  # all four age bands genuinely produce distinct text
    assert "10-13" in young
    assert "14-18" in teen
    assert "19-30" in adult
    assert "31-60" in mature


def test_language_instructions_differ():
    en = build_system_prompt("teacher", 18, "english")
    hi = build_system_prompt("teacher", 18, "hindi")
    hinglish = build_system_prompt("teacher", 18, "hinglish")
    assert en != hi != hinglish
    assert "Hindi" in hi
    assert "Hinglish" in hinglish
