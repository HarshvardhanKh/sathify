"""
faster-whisper backed ASRService.

- Automatic device selection: CUDA if available, else CPU, with a real
  fallback (not just a flag) if CUDA init fails at model-load time (e.g.
  missing cuDNN/cuBLAS DLLs on Windows) — a very common failure mode that
  must not crash the server.
- Configurable model size and compute type via Settings.
- Inference is synchronous/blocking (CTranslate2), so it always runs via
  `asyncio.to_thread` — never call `.transcribe()` directly from the event
  loop.
"""
from __future__ import annotations

import logging
import time

import numpy as np
from faster_whisper import WhisperModel

from app.config import settings
from app.models.transcript import ASRResult, ASRSegment
from app.services.asr.base import ASRService

logger = logging.getLogger("isl.asr.faster_whisper")


def _detect_device_and_compute_type(requested_device: str, requested_compute_type: str) -> tuple[str, str]:
    if requested_device == "cpu":
        return "cpu", (requested_compute_type if requested_compute_type != "auto" else "int8")

    # requested "auto" or "cuda" -> try CUDA, verify it actually works, else fall back.
    try:
        import torch  # optional; only used to probe CUDA availability
        cuda_ok = torch.cuda.is_available()
    except Exception:
        cuda_ok = None  # torch not installed; we'll let ctranslate2 itself decide by trying

    if requested_device == "cuda" and cuda_ok is False:
        logger.warning("[ASR] CUDA requested but not available; falling back to CPU")
        return "cpu", (requested_compute_type if requested_compute_type != "auto" else "int8")

    if cuda_ok or requested_device == "cuda" or (cuda_ok is None and requested_device == "auto"):
        compute_type = requested_compute_type if requested_compute_type != "auto" else "float16"
        return "cuda", compute_type

    compute_type = requested_compute_type if requested_compute_type != "auto" else "int8"
    return "cpu", compute_type


class FasterWhisperASR(ASRService):
    def __init__(
        self,
        model_size: str | None = None,
        device: str | None = None,
        compute_type: str | None = None,
        language: str | None = None,
    ) -> None:
        self._model_size = model_size or settings.ASR_MODEL
        self._requested_device = device or settings.ASR_DEVICE
        self._requested_compute_type = compute_type or settings.ASR_COMPUTE_TYPE
        self._language = language if language is not None else settings.ASR_LANGUAGE
        self._model: WhisperModel | None = None
        self._device_used: str | None = None
        self._compute_type_used: str | None = None
        self._load_error: str | None = None

    def load(self) -> None:
        """Synchronous model load with CUDA->CPU fallback. Call once at startup
        (or lazily on first use) via asyncio.to_thread from async code."""
        device, compute_type = _detect_device_and_compute_type(
            self._requested_device, self._requested_compute_type
        )
        try:
            logger.info("[ASR] Loading model=%s device=%s compute_type=%s",
                        self._model_size, device, compute_type)
            t0 = time.perf_counter()
            self._model = WhisperModel(self._model_size, device=device, compute_type=compute_type)
            self._device_used = device
            self._compute_type_used = compute_type
            logger.info("[ASR] Model loaded in %.2fs on %s", time.perf_counter() - t0, device)
        except Exception as e:  # noqa: BLE001
            if device == "cuda":
                logger.warning("[ASR] CUDA model load failed (%s); retrying on CPU", e)
                fallback_compute = (
                    self._requested_compute_type if self._requested_compute_type not in ("auto", "float16") else "int8"
                )
                try:
                    t0 = time.perf_counter()
                    self._model = WhisperModel(self._model_size, device="cpu", compute_type=fallback_compute)
                    self._device_used = "cpu"
                    self._compute_type_used = fallback_compute
                    logger.info("[ASR] Model loaded on CPU fallback in %.2fs", time.perf_counter() - t0)
                    return
                except Exception as e2:  # noqa: BLE001
                    self._load_error = str(e2)
                    logger.error("[ASR] CPU fallback also failed: %s", e2)
                    raise
            else:
                self._load_error = str(e)
                raise

    def is_ready(self) -> bool:
        return self._model is not None

    @property
    def device_used(self) -> str | None:
        return self._device_used

    @property
    def compute_type_used(self) -> str | None:
        return self._compute_type_used

    def _transcribe_sync(self, audio: np.ndarray, sample_rate: int) -> ASRResult:
        assert self._model is not None
        if sample_rate != 16000:
            logger.warning("[ASR] Received audio at %dHz, faster-whisper expects 16000Hz; "
                            "quality may degrade. Resample upstream.", sample_rate)

        t0 = time.perf_counter()
        segments_iter, info = self._model.transcribe(
            audio,
            language=self._language,
            vad_filter=True,
            beam_size=1,
        )
        segments: list[ASRSegment] = []
        text_parts: list[str] = []
        for seg in segments_iter:
            segments.append(ASRSegment(text=seg.text.strip(), start=seg.start, end=seg.end,
                                        avg_logprob=getattr(seg, "avg_logprob", None)))
            text_parts.append(seg.text.strip())
        elapsed = time.perf_counter() - t0
        text = " ".join(t for t in text_parts if t).strip()
        logger.info("[ASR] Processing time: %.2f sec | Transcript: %r", elapsed, text)

        return ASRResult(
            text=text,
            language=info.language,
            language_probability=getattr(info, "language_probability", None),
            segments=segments,
            processing_time=elapsed,
        )

    async def transcribe(self, audio: np.ndarray, sample_rate: int) -> ASRResult:
        import asyncio

        if self._model is None:
            await asyncio.to_thread(self.load)
        return await asyncio.to_thread(self._transcribe_sync, audio, sample_rate)
