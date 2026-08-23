"""
TranslationValidator — a quality gate applied to every ISLTranslation before
it leaves the translation stage, regardless of which strategy produced it.

Today this mainly cleans up the semantic_hybrid/rule-based output (dedupes,
strips invalid tokens). Its real purpose is as the gate HybridISLTranslator
uses to decide whether a future real model's output is trustworthy enough
to use, or whether to fall back — see the checks called out in the research
task: empty output, corrupted tokens, and a suspicious model that just
echoes the input back instead of producing gloss.
"""
from __future__ import annotations

import logging
import re

from pydantic import BaseModel

from app.models.translation import ISLTranslation

logger = logging.getLogger("isl.translation.validator")

# Unicode-aware (matches any letter/digit in any script, e.g. Devanagari for
# the Hindi fallback) but excludes bare underscore, which is a \w character
# yet not real content — "___" alone should still count as invalid.
_HAS_ALNUM_RE = re.compile(r"[^\W_]", re.UNICODE)


class ValidationResult(BaseModel):
    is_valid: bool
    reasons: list[str] = []


class TranslationValidator:
    def __init__(self, min_useful_tokens: int = 1) -> None:
        self.min_useful_tokens = min_useful_tokens

    def validate(self, translation: ISLTranslation) -> tuple[ISLTranslation, ValidationResult]:
        reasons: list[str] = []
        gloss = list(translation.gloss_sequence)

        # 1. Invalid tokens: empty, or no alphanumeric content at all.
        cleaned = [g for g in gloss if g and _HAS_ALNUM_RE.search(g)]
        if len(cleaned) != len(gloss):
            reasons.append(f"removed {len(gloss) - len(cleaned)} invalid/empty token(s)")
        gloss = cleaned

        # 2. Duplicate collapse: consecutive repeats (e.g. a stuttering model).
        collapsed: list[str] = []
        for g in gloss:
            if collapsed and collapsed[-1] == g:
                continue
            collapsed.append(g)
        if len(collapsed) != len(gloss):
            reasons.append(f"collapsed {len(gloss) - len(collapsed)} consecutive duplicate token(s)")
        gloss = collapsed

        is_valid = len(gloss) >= self.min_useful_tokens

        # 3. Suspicious passthrough: gloss is just the raw sentence echoed back
        # (a broken/uninstructed model doing this would look "successful" by
        # every other metric while being useless).
        joined = " ".join(gloss)
        source_stripped = re.sub(r"[^\w\s]", "", translation.normalized_text).strip().upper()
        if len(gloss) > 3 and joined == source_stripped:
            reasons.append("gloss sequence is identical to the raw input text; likely an "
                            "un-processed passthrough rather than a real translation")
            is_valid = False

        if not gloss:
            is_valid = False
            reasons.append("empty gloss sequence")

        translation.gloss_sequence = gloss
        if reasons:
            translation.warnings = list(translation.warnings) + [f"[validator] {r}" for r in reasons]
            logger.info("[TRANSLATION] Validator: %s", "; ".join(reasons))

        return translation, ValidationResult(is_valid=is_valid, reasons=reasons)
