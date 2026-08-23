"""
TextNormalizer — cleans up spoken/ASR text before it goes into semantic
extraction: strips filler words and stutter-repeats, expands contractions
and a small set of common spoken abbreviations, normalizes punctuation and
casing. Deliberately conservative — it does NOT try to rewrite grammar or
drop words it doesn't recognize, since the semantic extractor needs the
real sentence structure intact.
"""
from __future__ import annotations

import re

from app.models.translation import NormalizationResult

_FILLER_WORDS = {
    "umm", "um", "uh", "uhh", "ah", "er", "erm", "hmm",
}
_FILLER_PHRASES = ["you know", "i mean", "sort of", "kind of"]

_CONTRACTIONS = {
    "i'm": "i am", "we're": "we are", "you're": "you are", "they're": "they are",
    "he's": "he is", "she's": "she is", "it's": "it is", "that's": "that is",
    "what's": "what is", "who's": "who is", "there's": "there is",
    "don't": "do not", "doesn't": "does not", "didn't": "did not",
    "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not",
    "can't": "cannot", "couldn't": "could not", "won't": "will not", "wouldn't": "would not",
    "shouldn't": "should not", "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
    "i've": "i have", "we've": "we have", "you've": "you have", "they've": "they have",
    "i'll": "i will", "we'll": "we will", "you'll": "you will", "they'll": "they will",
    "i'd": "i would", "we'd": "we would", "you'd": "you would", "they'd": "they would",
    "let's": "let us",
}

# Common spoken abbreviations worth expanding for a clearer semantic parse.
# Deliberately small/curated for the MVP; a general abbreviation-expansion
# model can replace this later without changing the interface.
_ABBREVIATIONS = {
    r"\ba\.?i\.?\b": "artificial intelligence",
    r"\bml\b": "machine learning",
}


class TextNormalizer:
    def normalize(self, text: str) -> NormalizationResult:
        source = text
        changes: list[str] = []
        working = text.strip()

        working, n = self._remove_stutter_repeats(working)
        if n:
            changes.append(f"removed {n} repeated word(s)")

        working, n = self._remove_fillers(working)
        if n:
            changes.append(f"removed {n} filler word/phrase(s)")

        working, n = self._expand_contractions(working)
        if n:
            changes.append(f"expanded {n} contraction(s)")

        working, n = self._expand_abbreviations(working)
        if n:
            changes.append(f"expanded {n} abbreviation(s)")

        working = self._normalize_punctuation_and_whitespace(working)
        working = self._normalize_casing(working)

        return NormalizationResult(source_text=source, normalized_text=working, changes=changes)

    @staticmethod
    def _remove_stutter_repeats(text: str) -> tuple[str, int]:
        tokens = text.split()
        out: list[str] = []
        removed = 0
        for tok in tokens:
            norm = tok.lower().strip(",.")
            if out and out[-1].lower().strip(",.") == norm and norm:
                removed += 1
                continue
            out.append(tok)
        return " ".join(out), removed

    @staticmethod
    def _remove_fillers(text: str) -> tuple[str, int]:
        removed = 0
        working = text
        for phrase in _FILLER_PHRASES:
            pattern = re.compile(re.escape(phrase), re.IGNORECASE)
            working, n = pattern.subn("", working)
            removed += n

        tokens = working.split()
        out = []
        for tok in tokens:
            bare = tok.lower().strip(",.")
            if bare in _FILLER_WORDS:
                removed += 1
                continue
            out.append(tok)
        return " ".join(out), removed

    @staticmethod
    def _expand_contractions(text: str) -> tuple[str, int]:
        count = 0

        def repl(match: re.Match) -> str:
            nonlocal count
            count += 1
            return _CONTRACTIONS[match.group(0).lower()]

        pattern = re.compile(
            r"\b(" + "|".join(re.escape(k) for k in _CONTRACTIONS) + r")\b",
            re.IGNORECASE,
        )
        return pattern.sub(repl, text), count

    @staticmethod
    def _expand_abbreviations(text: str) -> tuple[str, int]:
        count = 0
        working = text
        for pattern, expansion in _ABBREVIATIONS.items():
            working, n = re.subn(pattern, expansion, working, flags=re.IGNORECASE)
            count += n
        return working, count

    @staticmethod
    def _normalize_punctuation_and_whitespace(text: str) -> str:
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"\s+([,.?!])", r"\1", text)
        text = re.sub(r",\s*,+", ",", text)
        text = re.sub(r"^[,\s]+", "", text)
        return text.strip()

    @staticmethod
    def _normalize_casing(text: str) -> str:
        if not text:
            return text
        # Capitalize the start of each sentence; leave the rest as-is
        # (avoids mangling proper nouns/acronyms the ASR already cased).
        sentences = re.split(r"(?<=[.?!])\s+", text)
        fixed = []
        for s in sentences:
            if s and s[0].isalpha():
                s = s[0].upper() + s[1:]
            fixed.append(s)
        return " ".join(fixed)
