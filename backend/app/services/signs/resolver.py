"""
SignResolver — turns each gloss token from the ISL translator into a
ResolvedSign, in this priority order:

  1. exact       — direct hit in vocabulary.json
  2. (synonym)    — gloss maps to a canonical gloss via synonyms.json, then
                    resolved as exact/compound/decomposed against that
  3. compound     — direct hit in compounds.json (explicit fallback sign list)
  4. decomposed   — gloss is an underscore-joined multi-word concept whose
                    parts are ALL individually known signs
  5. fingerspell  — nothing above matched; spell the word out letter by letter

The vocabulary/compounds/synonyms are data-driven JSON (see data/signs/),
never hardcoded in Python, so vocabulary can grow without code changes.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path

from app.config import settings
from app.models.sign import ResolvedSign
from app.services.signs.fingerspelling import FingerspellingResolver

logger = logging.getLogger("isl.signs.resolver")


def _load_json(path: Path) -> dict:
    if not path.exists():
        logger.warning("[SIGNS] Missing data file: %s (treating as empty)", path)
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class SignResolver:
    def __init__(
        self,
        vocabulary_path: Path | None = None,
        compounds_path: Path | None = None,
        synonyms_path: Path | None = None,
    ) -> None:
        self._vocabulary: dict = _load_json(vocabulary_path or settings.SIGN_VOCABULARY_PATH)
        self._compounds: dict = _load_json(compounds_path or settings.SIGN_COMPOUNDS_PATH)
        self._synonyms: dict = _load_json(synonyms_path or settings.SIGN_SYNONYMS_PATH)
        self._fingerspeller = FingerspellingResolver()
        logger.info(
            "[SIGNS] Loaded %d vocabulary entries, %d compounds, %d synonyms",
            len(self._vocabulary), len(self._compounds), len(self._synonyms),
        )

    def resolve(self, gloss: str) -> ResolvedSign:
        gloss = gloss.strip().upper()
        if not gloss:
            return ResolvedSign(source=gloss, resolution_type="unknown")

        resolved = self._resolve_exact_or_synonym(gloss)
        if resolved:
            return resolved

        if gloss in self._compounds:
            entry = self._compounds[gloss]
            return ResolvedSign(
                source=gloss, resolution_type="compound",
                signs=list(entry.get("fallback", [])),
                sign_id=entry.get("sign_id"),
            )

        if "_" in gloss:
            decomposed = self._try_decompose(gloss)
            if decomposed:
                return decomposed

        logger.info("[SIGNS] %r not found; falling back to fingerspelling", gloss)
        # Keep underscores in `source` (FingerspellingResolver already filters
        # non-alnum chars out of `characters`, so this doesn't add stray
        # letters) — MotionSequenceGenerator needs the word boundaries intact
        # to split multi-word names into separate paced fingerspelling runs
        # instead of flattening them into one run.
        return self._fingerspeller.resolve(gloss)

    def _resolve_exact_or_synonym(self, gloss: str) -> ResolvedSign | None:
        if gloss in self._vocabulary:
            entry = self._vocabulary[gloss]
            return ResolvedSign(
                source=gloss, resolution_type="exact",
                signs=[gloss], sign_id=entry.get("sign_id"),
                tags=list(entry.get("tags", [])),
            )
        canonical = self._synonyms.get(gloss)
        if canonical and canonical in self._vocabulary:
            entry = self._vocabulary[canonical]
            return ResolvedSign(
                source=gloss, resolution_type="exact",
                signs=[canonical], sign_id=entry.get("sign_id"),
                tags=list(entry.get("tags", [])),
            )
        return None

    def _try_decompose(self, gloss: str) -> ResolvedSign | None:
        parts = [p for p in gloss.split("_") if p]
        if len(parts) < 2:
            return None
        resolved_parts = []
        for part in parts:
            hit = self._resolve_exact_or_synonym(part)
            if not hit:
                return None
            resolved_parts.append(hit.signs[0])
        return ResolvedSign(source=gloss, resolution_type="decomposed", signs=resolved_parts)
