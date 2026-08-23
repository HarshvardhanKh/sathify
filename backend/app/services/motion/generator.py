"""
MotionSequenceGenerator — turns the resolved signs for one translated
segment into a MotionSequence: an ordered list of MotionItems (sign or
fingerspell) with estimated durations and, now, an `animation_id` each item
resolves to in the avatar's animation library (services/animation/library.py)
so the frontend can actually play something, plus an `expression` for the
whole segment from ExpressionResolver.
"""
from __future__ import annotations

import logging

from app.models.motion import (
    DEFAULT_LETTER_DURATION_MS,
    DEFAULT_SIGN_DURATION_MS,
    WORD_PAUSE_MS,
    MotionItem,
    MotionSequence,
)
from app.models.sign import ResolvedSign
from app.services.animation.expression_resolver import ExpressionResolver
from app.services.animation.library import AnimationLibrary, animation_library

logger = logging.getLogger("isl.motion.generator")


class MotionSequenceGenerator:
    def __init__(self, library: AnimationLibrary | None = None) -> None:
        self._library = library or animation_library
        self._expression_resolver = ExpressionResolver()

    def _sign_duration(self, sign_id: str) -> int:
        # vocabulary.json's own duration_ms if the library kept it; the
        # procedural pose library doesn't carry per-sign duration, so this
        # stays a fixed default — real per-sign timing is a placeholder.
        return DEFAULT_SIGN_DURATION_MS

    def generate(
        self,
        source_text: str,
        gloss_sequence: list[str],
        resolved_signs: list[ResolvedSign],
        semantic_unit_types: list[str] | None = None,
    ) -> MotionSequence:
        items: list[MotionItem] = []
        for resolved in resolved_signs:
            if resolved.resolution_type in ("exact", "compound", "decomposed"):
                for gloss in resolved.signs:
                    animation_id = self._library.resolve(gloss)
                    items.append(MotionItem(
                        type="sign", sign_id=gloss, animation_id=animation_id,
                        duration_ms=self._sign_duration(gloss),
                    ))
            elif resolved.resolution_type == "fingerspell":
                # Split on the source's original word boundaries (e.g.
                # "STEVE_JOBS") rather than flattening into one run — each
                # word gets its own paced letter run plus a trailing pause.
                words = resolved.source.split("_") if "_" in resolved.source else [resolved.source]
                for word in words:
                    chars = [c for c in word if c.isalnum()]
                    if not chars:
                        continue
                    animation_ids = [self._library.letter_animation_id(c) for c in chars]
                    items.append(MotionItem(
                        type="fingerspell", characters=chars,
                        animation_id=",".join(animation_ids),
                        duration_ms=len(chars) * DEFAULT_LETTER_DURATION_MS + WORD_PAUSE_MS,
                    ))
            # "unknown" resolution type contributes no motion item.

        expression = self._expression_resolver.resolve(semantic_unit_types or [])
        sequence = MotionSequence(
            source_text=source_text, translation=gloss_sequence, items=items, expression=expression,
        )
        logger.info("[MOTION] Generated %d item(s), total %d ms, expression=%s",
                    len(items), sequence.total_duration_ms, expression)
        return sequence
