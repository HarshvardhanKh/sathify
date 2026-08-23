"""DostService — builds the mode/age/language-adapted prompt and calls
Gemini through the key-manager-backed client. Honest about unavailability:
no fabricated response when no key is configured or all keys are exhausted."""
from __future__ import annotations

import logging

from app.models.dost import DostChatRequest, DostChatResponse
from app.services.ai.gemini_client import GeminiClient, gemini_client
from app.services.dost.prompts import build_system_prompt

logger = logging.getLogger("isl.dost.service")


class DostService:
    def __init__(self, client: GeminiClient | None = None) -> None:
        self._client = client or gemini_client

    async def chat(self, req: DostChatRequest) -> DostChatResponse:
        system_prompt = build_system_prompt(req.mode, req.age, req.language)
        result = await self._client.generate(system_prompt, req.message)

        if not result.ok:
            logger.warning("[DOST] Gemini unavailable (%s): %s", result.error_code, result.error)
            return DostChatResponse(
                response="Dost is temporarily unavailable — no working Gemini API key could "
                         "be reached. Please configure GEMINI_API_KEYS and try again.",
                mode=req.mode, age=req.age, language=req.language,
                available=False, warning=result.error,
            )

        return DostChatResponse(
            response=result.text or "", mode=req.mode, age=req.age, language=req.language, available=True,
        )


dost_service = DostService()
