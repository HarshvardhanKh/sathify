"""
Document models — deliberately mirror new-frontend/src/types/domain.ts
field-for-field (via camelCase aliases) so the existing frontend types need
no changes; the backend adapts to the already-designed frontend contract,
not the other way around.
"""
from __future__ import annotations

import time
from typing import Literal, Union
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

OriginalFormat = Literal["pdf", "pptx", "docx", "mp4", "mp3", "notes"]
DocumentStatus = Literal["raw", "processing", "ready", "error"]
ComplexityLevel = Literal["original", "simplified", "essential"]
FigureType = Literal["graph", "diagram", "chart", "photo", "illustration"]


class _CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class DataSeriesItem(_CamelModel):
    label: str
    value: str | float


class ImageDescription(_CamelModel):
    id: str
    short_alt: str
    long_description: str
    figure_type: FigureType = "photo"
    data_series: list[DataSeriesItem] | None = None
    tactile_friendly_notes: str | None = None
    # Extra honesty flags not in the original TS type but useful for the
    # "clearly distinguish extracted vs AI-corrected" requirement (Phase 15):
    source: Literal["ocr_raw", "ai_generated"] = "ai_generated"


class ParagraphBlock(_CamelModel):
    kind: Literal["paragraph"] = "paragraph"
    id: str
    text: str
    simplified_text: str | None = None
    essential_text: str | None = None


class HeadingBlock(_CamelModel):
    kind: Literal["heading"] = "heading"
    id: str
    level: Literal[1, 2, 3, 4] = 2
    text: str


class ImageBlock(_CamelModel):
    kind: Literal["image"] = "image"
    id: str
    src: str
    description: ImageDescription


class TableBlock(_CamelModel):
    kind: Literal["table"] = "table"
    id: str
    headers: list[str]
    rows: list[list[str]]
    caption: str | None = None


class EquationBlockModel(_CamelModel):
    kind: Literal["equation"] = "equation"
    id: str
    latex: str
    spoken_math_text: str


class ListBlock(_CamelModel):
    kind: Literal["list"] = "list"
    id: str
    ordered: bool = False
    items: list[str]


ContentBlock = Union[ParagraphBlock, HeadingBlock, ImageBlock, TableBlock, EquationBlockModel, ListBlock]


class Document(_CamelModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    original_format: OriginalFormat
    created_at: str = Field(default_factory=lambda: str(int(time.time() * 1000)))
    page_count: int = 0
    status: DocumentStatus = "raw"
    complexity_level: ComplexityLevel = "original"
    subject: str = ""
    summary: str = ""
    blocks: list[ContentBlock] = Field(default_factory=list)
    audio_url: str | None = None


class ConversionJob(_CamelModel):
    job_id: str = Field(default_factory=lambda: str(uuid4()))
    document_id: str
    progress_pct: int = 0
    current_step: str = "queued"
    status: Literal["queued", "converting", "completed", "failed"] = "queued"
    error: str | None = None
    estimated_time_remaining_sec: int = 0
