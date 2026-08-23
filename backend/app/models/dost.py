from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

DostMode = Literal["teacher", "friend"]
DostLanguage = Literal["english", "hindi", "hinglish"]


class DostChatRequest(BaseModel):
    message: str
    mode: DostMode = "teacher"
    age: int = Field(default=18, ge=10, le=60)
    language: DostLanguage = "english"
    context: dict = Field(default_factory=dict)


class DostChatResponse(BaseModel):
    response: str
    mode: DostMode
    age: int
    language: DostLanguage
    available: bool = True
    warning: str | None = None
