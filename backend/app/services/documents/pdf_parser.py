"""
PDF text extraction via pypdf. Real, dependency-light extraction — no
layout/column reconstruction (pypdf gives reading-order-ish text per page,
not guaranteed correct for true multi-column layouts; see module docstring
in semantic_converter.py for how that limitation is handled honestly).
"""
from __future__ import annotations

import logging
from pathlib import Path

from pypdf import PdfReader

logger = logging.getLogger("isl.documents.pdf_parser")


def extract_pdf_pages(path: str | Path) -> list[str]:
    """Returns one raw-text string per page. Never raises for a single bad
    page — that page's text is just empty, extraction continues."""
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages):
        try:
            pages.append(page.extract_text() or "")
        except Exception as e:  # noqa: BLE001
            logger.warning("[PDF_PARSER] Failed to extract page %d: %s", i, e)
            pages.append("")
    return pages
