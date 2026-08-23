"""Tests the retry/failover LOOP logic with the actual network call mocked
out (no real Gemini API key exists in this environment) — verifies the
control flow the master prompt asks for, not live API connectivity."""
import asyncio

import pytest

from app.services.ai.gemini_client import GeminiClient, _GeminiHttpError
from app.services.ai.key_manager import GeminiKeyManager


def run(coro):
    return asyncio.run(coro)


def test_no_keys_configured_returns_clear_error():
    client = GeminiClient(key_manager=GeminiKeyManager(keys=[]))
    result = run(client.generate("system", "hello"))
    assert result.ok is False
    assert result.error_code == "NO_KEYS_CONFIGURED"


def test_first_key_fails_second_key_succeeds(monkeypatch):
    client = GeminiClient(key_manager=GeminiKeyManager(keys=["key1", "key2"]))
    calls = []

    async def fake_call_once(self, api_key, system_prompt, user_message):
        calls.append(api_key)
        if api_key == "key1":
            raise _GeminiHttpError(429, "rate limited")
        return "a real response"

    monkeypatch.setattr(GeminiClient, "_call_once", fake_call_once)
    result = run(client.generate("system", "hello"))

    assert result.ok is True
    assert result.text == "a real response"
    assert calls == ["key1", "key2"]


def test_all_keys_exhausted_after_retry_limit(monkeypatch):
    client = GeminiClient(key_manager=GeminiKeyManager(keys=["key1", "key2", "key3"]))

    async def always_fails(self, api_key, system_prompt, user_message):
        raise _GeminiHttpError(500, "server error")

    monkeypatch.setattr(GeminiClient, "_call_once", always_fails)
    result = run(client.generate("system", "hello"))

    assert result.ok is False
    assert result.error_code in ("ALL_KEYS_EXHAUSTED",)


def test_timeout_is_classified_and_retried(monkeypatch):
    import httpx

    client = GeminiClient(key_manager=GeminiKeyManager(keys=["key1", "key2"]))
    calls = []

    async def fake_call_once(self, api_key, system_prompt, user_message):
        calls.append(api_key)
        if api_key == "key1":
            raise httpx.TimeoutException("timed out")
        return "ok"

    monkeypatch.setattr(GeminiClient, "_call_once", fake_call_once)
    result = run(client.generate("system", "hello"))
    assert result.ok is True
    assert calls == ["key1", "key2"]


def test_malformed_response_is_classified(monkeypatch):
    client = GeminiClient(key_manager=GeminiKeyManager(keys=["key1"]))

    async def bad_shape(self, api_key, system_prompt, user_message):
        raise KeyError("candidates")

    monkeypatch.setattr(GeminiClient, "_call_once", bad_shape)
    result = run(client.generate("system", "hello"))
    assert result.ok is False
