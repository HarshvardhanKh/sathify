"""Abstract ISL translator interface. All strategies (rule-based, retrieval,
model, hybrid) implement this so the pipeline never depends on which one is
active."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.models.translation import ISLTranslation


class BaseISLTranslator(ABC):
    @abstractmethod
    async def translate(self, text: str, source_language: str) -> ISLTranslation:
        """Translate normalized spoken-language text into an ISL gloss
        sequence + structured semantic representation."""
