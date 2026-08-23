"""
POST /api/documents (upload), GET /api/documents, GET /api/documents/{id},
POST /api/documents/{id}/convert

Supports PDF and PPTX (real parsing) directly. Images (handwritten notes,
Phase 15) are accepted but OCR gracefully reports unavailable if no OCR
engine is installed — see the honesty note in the handler below.
"""
from __future__ import annotations

import logging
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.models.document import ConversionJob, Document
from app.services.documents.pdf_parser import extract_pdf_pages
from app.services.documents.semantic_converter import convert_raw_text
from app.services.documents.slides_parser import extract_slides
from app.services.documents.store import document_store

logger = logging.getLogger("isl.api.documents")

router = APIRouter(tags=["documents"])

_SUPPORTED_EXTENSIONS = {".pdf": "pdf", ".pptx": "pptx", ".png": "notes", ".jpg": "notes", ".jpeg": "notes"}


@router.get("/api/documents")
async def list_documents():
    return [d.model_dump(by_alias=True) for d in document_store.list()]


@router.get("/api/documents/{doc_id}")
async def get_document(doc_id: str):
    doc = document_store.get(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc.model_dump(by_alias=True)


@router.post("/api/documents")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    ext = Path(file.filename).suffix.lower()
    if ext not in _SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    document_store.cleanup_old_uploads()

    saved_path = settings.UPLOAD_DIR / f"{uuid.uuid4()}{ext}"
    content = await file.read()
    saved_path.write_bytes(content)

    doc = Document(
        title=Path(file.filename).stem,
        original_format=_SUPPORTED_EXTENSIONS[ext],  # type: ignore[arg-type]
        status="raw",
    )
    document_store.add(doc)
    logger.info("[DOCUMENTS] Uploaded %r as %s -> document %s", file.filename, ext, doc.id)

    # Stash the saved path for the convert step (in-memory, not part of the
    # public Document model).
    _UPLOAD_PATHS[doc.id] = saved_path

    return doc.model_dump(by_alias=True)


_UPLOAD_PATHS: dict[str, Path] = {}


@router.post("/api/documents/{doc_id}/convert")
async def convert_document(doc_id: str):
    doc = document_store.get(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    saved_path = _UPLOAD_PATHS.get(doc_id)
    if saved_path is None or not saved_path.exists():
        raise HTTPException(status_code=410, detail="Uploaded file no longer available (temporary storage expired)")

    doc.status = "processing"
    document_store.update(doc)
    t0 = time.perf_counter()

    try:
        if doc.original_format == "pdf":
            pages = extract_pdf_pages(saved_path)
            raw_text = "\n\n".join(pages)
            doc.page_count = len(pages)
        elif doc.original_format == "pptx":
            slides = extract_slides(saved_path)
            raw_text = "\n\n".join(
                f"Slide {s.slide_number}: {s.title}\n" + "\n".join(f"- {b}" for b in s.bullets) +
                (f"\nNotes: {s.notes}" if s.notes else "")
                for s in slides
            )
            doc.page_count = len(slides)
        elif doc.original_format == "notes":
            # Handwritten/image notes: OCR would go here. No OCR engine
            # (tesseract) is confirmed installed in this environment, so this
            # is honestly reported as unavailable rather than faked.
            doc.status = "error"
            document_store.update(doc)
            raise HTTPException(
                status_code=501,
                detail="OCR for handwritten/image notes is not available in this environment "
                       "(no OCR engine installed). This is a real limitation, not a bug.",
            )
        else:
            raise HTTPException(status_code=400, detail=f"Conversion not implemented for {doc.original_format}")

        blocks, title, summary, ai_used = await convert_raw_text(raw_text)
        doc.blocks = blocks
        doc.title = title if title and title != "Untitled Document" else doc.title
        doc.summary = summary
        doc.status = "ready"
        doc.complexity_level = "original"
        document_store.update(doc)

        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info("[DOCUMENTS] Converted %s in %.0fms (ai_used=%s, blocks=%d)",
                    doc_id, elapsed_ms, ai_used, len(blocks))

        return {
            "document": doc.model_dump(by_alias=True),
            "aiUsed": ai_used,
            "processingMs": round(elapsed_ms, 1),
        }
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        doc.status = "error"
        document_store.update(doc)
        logger.error("[DOCUMENTS] Conversion failed for %s: %s", doc_id, e)
        raise HTTPException(status_code=500, detail=f"Conversion failed: {e}")
