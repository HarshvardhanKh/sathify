"""
GeminiClient — uses the official google-genai SDK (same as user's working code)
with failover across multiple API keys.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from google import genai

from app.config import settings
from app.services.ai.key_manager import FailureType, GeminiKeyManager, gemini_key_manager

logger = logging.getLogger("isl.ai.gemini_client")


@dataclass
class GeminiResult:
    ok: bool
    text: str | None = None
    error: str | None = None
    error_code: str | None = None


class GeminiClient:
    def __init__(self, key_manager: GeminiKeyManager | None = None) -> None:
        self._keys = key_manager or gemini_key_manager

    async def generate(self, system_prompt: str, user_message: str) -> GeminiResult:
        if not self._keys.configured:
            return GeminiResult(ok=False, error="No Gemini API key configured.", error_code="NO_KEYS_CONFIGURED")

        attempts = 0
        last_error: str | None = None

        while attempts < settings.GEMINI_MAX_RETRIES_PER_REQUEST:
            picked = self._keys.get_healthy_key()
            if picked is None:
                return GeminiResult(ok=False, error="All Gemini API keys are currently unavailable.",
                                     error_code="ALL_KEYS_EXHAUSTED")
            index, api_key = picked
            attempts += 1

            try:
                # Use the same pattern as user's working code
                client = genai.Client(api_key=api_key)

                # Combine system prompt and user message
                full_prompt = f"{system_prompt}\n\nUser: {user_message}"

                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=full_prompt
                )

                text = response.text
                self._keys.report_success(index)
                logger.info("[GEMINI] Request succeeded with key index %d", index)
                return GeminiResult(ok=True, text=text)

            except Exception as e:
                error_str = str(e).lower()
                logger.warning("[GEMINI] Request failed with key index %d: %s", index, e)

                # Classify the error
                if "rate" in error_str or "429" in error_str:
                    self._keys.report_failure(index, FailureType.RATE_LIMIT)
                elif "quota" in error_str or "402" in error_str or "403" in error_str:
                    self._keys.report_failure(index, FailureType.QUOTA)
                elif "auth" in error_str or "401" in error_str or "invalid" in error_str:
                    self._keys.report_failure(index, FailureType.AUTH)
                elif "timeout" in error_str:
                    self._keys.report_failure(index, FailureType.TIMEOUT)
                elif "network" in error_str or "connect" in error_str:
                    self._keys.report_failure(index, FailureType.NETWORK)
                else:
                    self._keys.report_failure(index, FailureType.UNKNOWN)

                last_error = str(e)

        return GeminiResult(ok=False, error=last_error or "Gemini request failed after retries",
                             error_code="ALL_KEYS_EXHAUSTED")


gemini_client = GeminiClient()
