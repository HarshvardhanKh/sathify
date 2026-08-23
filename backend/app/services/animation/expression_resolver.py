"""
ExpressionResolver — maps translation metadata (semantic unit types already
extracted by the semantic_hybrid translator) to a coarse avatar facial
expression. Deliberately simple per the master prompt's explicit scope:
"Do not attempt a full facial linguistics system."
"""
from __future__ import annotations

from typing import Literal

AvatarExpression = Literal["NEUTRAL", "HAPPY", "QUESTION", "NEGATION"]

_PRIORITY: list[tuple[str, AvatarExpression]] = [
    # Checked in order; first match wins (a greeting question is rare, but
    # question/negation are more informative to show than a smile).
    ("QUESTION", "QUESTION"),
    ("NEGATION", "NEGATION"),
    ("GREETING", "HAPPY"),
]


class ExpressionResolver:
    def resolve(self, semantic_unit_types: list[str]) -> AvatarExpression:
        types = set(semantic_unit_types)
        for unit_type, expression in _PRIORITY:
            if unit_type in types:
                return expression
        return "NEUTRAL"
