"""
LanguageDetector — detects English vs Hindi (the two languages this MVP
supports), designed so a real statistical/model-based detector can replace
this later without changing the interface.

Current implementation is a deliberately simple, dependency-free heuristic:
Unicode-script based (Devanagari block => Hindi, otherwise Latin => English)
with a confidence derived from the proportion of script-bearing characters.
This is honest about being a heuristic, not a trained classifier — good
enough to route text to the right normalization/translation path, not
claimed to be linguistically robust.
"""
from __future__ import annotations

import re

from app.models.translation import LanguageDetection

_DEVANAGARI_RE = re.compile(r"[ऀ-ॿ]")
_LATIN_LETTER_RE = re.compile(r"[A-Za-z]")


class LanguageDetector:
    def detect(self, text: str) -> LanguageDetection:
        text = text.strip()
        if not text:
            return LanguageDetection(language="en", confidence=0.0)

        devanagari_chars = len(_DEVANAGARI_RE.findall(text))
        latin_chars = len(_LATIN_LETTER_RE.findall(text))
        total_letters = devanagari_chars + latin_chars

        if total_letters == 0:
            # No alphabetic signal (numbers/punctuation only) — default to English.
            return LanguageDetection(language="en", confidence=0.3)

        if devanagari_chars > latin_chars:
            confidence = devanagari_chars / total_letters
            return LanguageDetection(language="hi", confidence=round(confidence, 3))

        confidence = latin_chars / total_letters
        return LanguageDetection(language="en", confidence=round(confidence, 3))
