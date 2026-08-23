"""
HybridISLTranslator — the strategy the pipeline actually uses
(app.config.Settings.TRANSLATOR_STRATEGY == "hybrid").

Tries the model adapter first; per the research pass (see
model_adapter.py), no model is currently available, so this always falls
through to RuleBasedISLTranslator ("semantic_hybrid" for English,
"rule_based_fallback" for Hindi) — honestly labeled via
translation_method/model_available/fallback_used, never faked. Every result,
model or rule-based, passes through TranslationValidator before being
returned, so a future real model's bad output (empty, corrupted, or just
echoing the input) gets rejected in favor of the rule-based fallback instead
of silently shipping garbage.
"""
from __future__ import annotations

import logging

from app.models.translation import ISLTranslation
from app.services.translation.base import BaseISLTranslator
from app.services.translation.model_adapter import ModelISLTranslator
from app.services.translation.rule_based import RuleBasedISLTranslator
from app.services.translation.validator import TranslationValidator

logger = logging.getLogger("isl.translation.hybrid")


class HybridISLTranslator(BaseISLTranslator):
    def __init__(
        self,
        model_translator: ModelISLTranslator | None = None,
        rule_based_translator: RuleBasedISLTranslator | None = None,
        validator: TranslationValidator | None = None,
    ) -> None:
        self._model = model_translator or ModelISLTranslator()
        self._rule_based = rule_based_translator or RuleBasedISLTranslator()
        self._validator = validator or TranslationValidator()

    async def translate(self, text: str, source_language: str) -> ISLTranslation:
        if self._model.is_available():
            try:
                result = await self._model.translate(text, source_language)
                result.translation_method = "pretrained_isl_model"
                result.model_name = self._model.model_name
                result.model_available = True
                result.fallback_used = False
                result.confidence_type = "model"
                result, validation = self._validator.validate(result)
                if validation.is_valid:
                    return result
                logger.warning("[TRANSLATION] Model output failed validation (%s); "
                                "falling back to semantic_hybrid", validation.reasons)
            except Exception as e:  # noqa: BLE001
                logger.warning("[TRANSLATION] Model translation failed (%s); "
                                "falling back to semantic_hybrid", e)

        result = await self._rule_based.translate(text, source_language)
        result.model_available = self._model.is_available()
        result, _ = self._validator.validate(result)
        return result
