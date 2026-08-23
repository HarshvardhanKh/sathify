"""Models for sign vocabulary resolution and fingerspelling."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ResolutionType = Literal["exact", "compound", "decomposed", "fingerspell", "unknown"]


class ResolvedSign(BaseModel):
    source: str
    resolution_type: ResolutionType
    signs: list[str] = Field(default_factory=list)
    characters: list[str] = Field(default_factory=list)  # populated for fingerspell
    sign_id: str | None = None
    tags: list[str] = Field(default_factory=list)
