"""
semantic_converter — turns raw extracted text (from PDF/PPTX/OCR) into
structured ContentBlocks via Gemini, using the exact JSON schema the master
prompt specifies (title/sections/equations/images) rather than letting the
model produce arbitrary HTML that gets rendered directly.

Honest fallback: if Gemini is unavailable or returns unparseable JSON, this
falls back to naive paragraph splitting and says so explicitly in the
document summary — it never silently fabricates structure.

Known limitation (documented, not hidden): multi-column PDF layouts,
running headers/footers, and page numbers are NOT specially detected —
pypdf's raw extraction order is used as-is. Real image extraction (Phase 15
handwritten notes / actual embedded PDF images) is out of scope for this
pass; ImageBlocks are produced only from Gemini-described figures with a
placeholder src, clearly flagged via ImageDescription.source.
"""
from __future__ import annotations

import json
import logging
import re
from uuid import uuid4

from app.models.document import (
    ContentBlock,
    EquationBlockModel,
    HeadingBlock,
    ImageBlock,
    ImageDescription,
    ParagraphBlock,
)
from app.services.ai.gemini_client import GeminiClient, gemini_client

logger = logging.getLogger("isl.documents.semantic_converter")

_SYSTEM_PROMPT = """You restructure raw, messily-extracted document text into clean, \
accessible structured JSON for a screen-reader-friendly reader. You MUST respond with \
ONLY a single JSON object, no markdown fences, no commentary, matching exactly this shape:

{
  "title": "string",
  "summary": "one or two sentence summary",
  "sections": [ { "heading": "string", "content": "string (plain prose, no markdown)" } ],
  "equations": [ { "latex": "string", "spoken": "string, how this equation reads aloud" } ],
  "images": [ { "description": "string description of what a figure/image likely shows, if the raw text references one" } ]
}

Reconstruct logical reading order (ignore headers/footers/page numbers if you can identify \
them as such). Use clear semantic section headings. Do not invent facts not present in the \
source text — only reorganize and clarify what is actually there."""

_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def _strip_fences(text: str) -> str:
    match = _JSON_FENCE_RE.search(text)
    return match.group(1) if match else text


def _naive_paragraph_blocks(raw_text: str) -> list[ContentBlock]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", raw_text) if p.strip()]
    return [ParagraphBlock(id=str(uuid4()), text=p) for p in paragraphs[:200]]


def _json_to_blocks(parsed: dict) -> list[ContentBlock]:
    blocks: list[ContentBlock] = []
    for section in parsed.get("sections", []):
        heading = section.get("heading", "").strip()
        content = section.get("content", "").strip()
        if heading:
            blocks.append(HeadingBlock(id=str(uuid4()), level=2, text=heading))
        if content:
            blocks.append(ParagraphBlock(id=str(uuid4()), text=content))
    for eq in parsed.get("equations", []):
        latex = eq.get("latex", "").strip()
        spoken = eq.get("spoken", "").strip()
        if latex:
            blocks.append(EquationBlockModel(id=str(uuid4()), latex=latex, spoken_math_text=spoken or latex))
    for img in parsed.get("images", []):
        desc = img.get("description", "").strip()
        if desc:
            blocks.append(ImageBlock(
                id=str(uuid4()), src="",  # no real image extraction in this pass — see module docstring
                description=ImageDescription(
                    id=str(uuid4()), short_alt=desc[:80], long_description=desc,
                    figure_type="illustration", source="ai_generated",
                ),
            ))
    return blocks


async def convert_raw_text(raw_text: str, client: GeminiClient | None = None) -> tuple[list[ContentBlock], str, str, bool]:
    """Returns (blocks, title, summary, ai_used)."""
    client = client or gemini_client
    truncated = raw_text[:15000]  # keep prompt bounded

    result = await client.generate(_SYSTEM_PROMPT, truncated)
    if result.ok and result.text:
        try:
            parsed = json.loads(_strip_fences(result.text))
            blocks = _json_to_blocks(parsed)
            if blocks:
                return blocks, parsed.get("title", "Untitled Document"), parsed.get("summary", ""), True
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.warning("[SEMANTIC_CONVERTER] Gemini returned unparseable JSON, falling back: %s", e)

    logger.info("[SEMANTIC_CONVERTER] Falling back to naive paragraph split (AI unavailable or failed)")
    return (
        _naive_paragraph_blocks(raw_text),
        "Untitled Document",
        "AI restructuring unavailable — showing raw extracted text split into paragraphs. "
        "Configure GEMINI_API_KEYS for semantic reconstruction.",
        False,
    )
