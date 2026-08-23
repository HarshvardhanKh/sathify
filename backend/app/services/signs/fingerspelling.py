"""
FingerspellingResolver — last-resort fallback for words with no known sign
(proper nouns, out-of-vocabulary technical terms, etc.). Splits a word into
its individual letters/digits so a downstream avatar can spell it out
letter-by-letter, kept structurally separate from ordinary sign resolution.
"""
from __future__ import annotations

import re

from app.models.sign import ResolvedSign

_ALNUM_RE = re.compile(r"[A-Za-z0-9]")


class FingerspellingResolver:
    def resolve(self, word: str) -> ResolvedSign:
        characters = [c.upper() for c in word if _ALNUM_RE.match(c)]
        return ResolvedSign(
            source=word,
            resolution_type="fingerspell",
            characters=characters,
        )
