"""Models for language detection, normalization, and ISL translation."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

SemanticUnitType = Literal[
    "GREETING", "TIME", "SUBJECT", "LOCATION", "NAMED_ENTITY", "NUMBER",
    "OBJECT", "CONCEPT", "ACTION", "NEGATION", "QUESTION", "MODIFIER", "OTHER",
]

ConfidenceType = Literal["heuristic", "model"]


class LanguageDetection(BaseModel):
    language: str  # ISO 639-1: "en", "hi", ...
    confidence: float


class NormalizationResult(BaseModel):
    source_text: str
    normalized_text: str
    changes: list[str] = Field(default_factory=list)


class SemanticUnit(BaseModel):
    type: SemanticUnitType
    value: str
    source_tokens: list[str] = Field(default_factory=list)


class ISLTranslation(BaseModel):
    source_text: str
    normalized_text: str
    source_language: str
    semantic_units: list[SemanticUnit] = Field(default_factory=list)
    gloss_sequence: list[str] = Field(default_factory=list)
    unknown_words: list[str] = Field(default_factory=list)

    # translation_method values in use: "semantic_hybrid" (spaCy-based semantic
    # extraction — the active English strategy), "rule_based_fallback" (Hindi's
    # minimal stopword-removal path), "pretrained_isl_model" (reserved — no such
    # model currently exists locally/usably; see research notes in
    # services/translation/model_adapter.py).
    translation_method: str = "semantic_hybrid"
    model_name: str | None = None       # None whenever no real ML model produced this
    model_available: bool = False       # honest flag: was a pretrained model even usable?
    fallback_used: bool = True          # True whenever the rule/semantic path served the result
    confidence: float = 0.45
    confidence_type: ConfidenceType = "heuristic"  # never claim "model" confidence without a model
    warnings: list[str] = Field(
        default_factory=lambda: ["This is an approximate ISL gloss representation."]
    )
    # Present only when a language bridge was used (e.g. Hindi -> English -> ISL).
    intermediate_language: str | None = None
    translation_path: list[str] = Field(default_factory=list)
