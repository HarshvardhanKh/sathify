"""
In-memory document store — no database per the explicit MVP constraint.
Uploaded files live in UPLOAD_DIR temporarily; `cleanup_old_uploads()` can
be called periodically (or on-demand) to remove files past UPLOAD_MAX_AGE_SECONDS.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path

from app.config import settings
from app.models.document import Document

logger = logging.getLogger("isl.documents.store")


class DocumentStore:
    def __init__(self) -> None:
        self._documents: dict[str, Document] = {}
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    def add(self, doc: Document) -> Document:
        self._documents[doc.id] = doc
        return doc

    def get(self, doc_id: str) -> Document | None:
        return self._documents.get(doc_id)

    def update(self, doc: Document) -> Document:
        self._documents[doc.id] = doc
        return doc

    def list(self) -> list[Document]:
        return list(self._documents.values())

    def cleanup_old_uploads(self) -> int:
        removed = 0
        now = time.time()
        for f in Path(settings.UPLOAD_DIR).glob("*"):
            if f.name == ".gitkeep":
                continue
            try:
                if now - f.stat().st_mtime > settings.UPLOAD_MAX_AGE_SECONDS:
                    f.unlink()
                    removed += 1
            except OSError as e:
                logger.warning("[DOCUMENTS] Failed to clean up %s: %s", f, e)
        return removed


document_store = DocumentStore()
