"""
PipelineManager — the central orchestrator wiring every stage together:

  Input -> ASR -> TranscriptAggregator -> ContextBuffer -> LanguageDetection
  -> Normalization -> ISLTranslation -> SignResolution -> MotionSequence
  -> EventBus (-> WebSocketManager -> frontend)

Two ways to drive it:
  - start()/stop(): a continuous background stream (live system audio or a
    scripted mock) that runs indefinitely, publishing events as things
    happen.
  - process_text()/process_audio_file(): bounded, one-shot runs that push a
    single utterance/file through the exact same downstream stages and
    return a structured result synchronously — this is what lets the whole
    architecture be validated (Step 2 of the master implementation order)
    without live audio working.

Restartable: start() can be called again after stop() without restarting
the server; all per-run state (aggregator, context buffer, tasks) is
recreated each time.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Literal

from app.config import settings
from app.core.event_bus import event_bus
from app.core.metrics import metrics
from app.models.motion import MotionSequence
from app.models.sign import ResolvedSign
from app.models.translation import ISLTranslation, LanguageDetection, NormalizationResult
from app.services.asr.faster_whisper_service import FasterWhisperASR
from app.services.input.base import InputSource
from app.services.input.mock_input import MockInput
from app.services.input.system_audio import SystemAudioInput
from app.services.language.detector import LanguageDetector
from app.services.motion.generator import MotionSequenceGenerator
from app.services.normalization.normalizer import TextNormalizer
from app.services import saathify_compat
from app.services.signs.resolver import SignResolver
from app.services.transcript.aggregator import TranscriptAggregator
from app.services.transcript.context_buffer import ContextBuffer
from app.services.translation.hybrid import HybridISLTranslator

logger = logging.getLogger("isl.pipeline.manager")

StreamMode = Literal["system_audio", "mock"]

_DEFAULT_MOCK_SCRIPT = [
    "Hello everyone today we",
    "today we are going to learn",
    "going to learn about artificial intelligence",
]


class TextPipelineResult(dict):
    """Plain dict subclass so it's directly JSON-serializable by FastAPI while
    still being constructed with named fields below."""


class PipelineManager:
    def __init__(self) -> None:
        self.language_detector = LanguageDetector()
        self.normalizer = TextNormalizer()
        self.translator = HybridISLTranslator()
        self.sign_resolver = SignResolver()
        self.motion_generator = MotionSequenceGenerator()
        self.asr: FasterWhisperASR = FasterWhisperASR()

        self._status = {"audio": "idle", "asr": "idle", "translator": "ready"}

        self._input_source: InputSource | None = None
        self._stream_task: asyncio.Task | None = None
        self._watchdog_task: asyncio.Task | None = None
        self._aggregator: TranscriptAggregator | None = None
        self._context_buffer: ContextBuffer | None = None
        self._running = False
        self._last_transcript: str = ""
        self._stream_mode: StreamMode | None = None

    # ------------------------------------------------------------------ #
    # Status
    # ------------------------------------------------------------------ #
    def get_status(self) -> dict:
        snapshot = metrics.snapshot()
        cpu_pct = 0.0
        try:
            import psutil
            cpu_pct = psutil.cpu_percent(interval=None)
        except Exception:  # noqa: BLE001
            pass
        return {
            **self._status,
            "running": self._running,
            "stream_mode": self._stream_mode,
            "asr_device": self.asr.device_used,
            "asr_compute_type": self.asr.compute_type_used,
            "last_transcript": self._last_transcript,
            "metrics": metrics.snapshot(),
            # new-frontend's SystemStatusResponse shape (superset, additive):
            "activeStreams": 1 if self._running else 0,
            "asrLatencyMs": snapshot["last_run_ms"].get("asr", 0.0),
            "islLagMs": snapshot["last_run_ms"].get("total", 0.0),
            "avatarFps": 60,  # honest placeholder — no real client FPS signal reaches the backend
            "cpuUsagePct": round(cpu_pct, 1),
        }

    def get_debug_info(self) -> dict:
        """Phase 12 live-debug panel data — capture backend/device, RMS/peak,
        ring-buffer fill, ASR status, last transcript, and per-stage latency
        pulled straight from PipelineMetrics (measured, not estimated)."""
        snapshot = metrics.snapshot()
        info = {
            "stream_mode": self._stream_mode,
            "running": self._running,
            "asr_status": self._status.get("asr"),
            "audio_status": self._status.get("audio"),
            "last_transcript": self._last_transcript,
            "transcript_latency_ms": snapshot["last_run_ms"].get("asr"),
            "translation_latency_ms": snapshot["last_run_ms"].get("translation"),
            "total_pipeline_latency_ms": snapshot["last_run_ms"].get("total"),
        }
        if isinstance(self._input_source, SystemAudioInput):
            info["capture"] = self._input_source.get_debug_info()
        else:
            info["capture"] = None
        return info

    async def _publish_status(self) -> None:
        await event_bus.publish("PIPELINE_STATUS", self.get_status())
        snapshot = metrics.snapshot()
        cpu_pct = 0.0
        try:
            import psutil
            cpu_pct = psutil.cpu_percent(interval=None)
        except Exception:  # noqa: BLE001
            pass
        # Legacy/simple alias for the minimal-frontend spec, extended with
        # new-frontend's SaathiFy field vocabulary (see saathify_compat.py) —
        # same event, superset payload, both frontends read what they know.
        await event_bus.publish("SYSTEM_STATUS", {
            "audio": self._status["audio"], "asr": self._status["asr"], "translator": self._status["translator"],
            **saathify_compat.system_status_fields(
                audio_active=self._status["audio"] == "running",
                asr_latency_ms=snapshot["last_run_ms"].get("asr", 0.0),
                translator_lag_ms=snapshot["last_run_ms"].get("translation", 0.0),
                cpu_pct=cpu_pct,
            ),
        })

    async def _publish_error(self, component: str, message: str, recoverable: bool = True) -> None:
        logger.error("[%s] %s", component.upper(), message)
        # "stage"/"error"/"recoverable" is the Phase 13 shape; "component"/
        # "message" is kept alongside for backward compatibility with the
        # original WebSocket protocol spec and existing frontend code;
        # "code"/"retryable" is new-frontend's SaathiFy vocabulary.
        await event_bus.publish("PIPELINE_ERROR", {
            "component": component, "message": message,
            "stage": component, "error": message, "recoverable": recoverable,
            **saathify_compat.pipeline_error_fields(recoverable),
        })
        await event_bus.publish("ERROR", {"component": component, "message": message})

    # ------------------------------------------------------------------ #
    # Continuous streaming: start / stop
    # ------------------------------------------------------------------ #
    async def start(self, mode: StreamMode = "system_audio") -> None:
        if self._running:
            logger.info("[PIPELINE] start() called while already running; ignoring")
            return

        self._aggregator = TranscriptAggregator()
        self._context_buffer = ContextBuffer()
        self._stream_mode = mode

        if mode == "system_audio":
            self._input_source = SystemAudioInput()
        elif mode == "mock":
            self._input_source = MockInput(list(_DEFAULT_MOCK_SCRIPT))
        else:
            raise ValueError(f"Unknown stream mode: {mode}")

        self._status["audio"] = "starting"
        await self._publish_status()
        try:
            await self._input_source.start()
            self._status["audio"] = "running"
        except Exception as e:  # noqa: BLE001
            self._status["audio"] = "error"
            await self._publish_error("audio_capture", str(e))
            await self._publish_status()
            return

        self._status["asr"] = "loading" if mode == "system_audio" else "not_required"
        await self._publish_status()

        if mode == "system_audio" and not self.asr.is_ready():
            # Load explicitly here (awaited, timed) rather than lazily on the
            # first transcribe() call — otherwise the entire cold-load time
            # (which includes a one-time Hugging Face download on a fresh
            # cache, easily 60-100s) gets folded into the FIRST chunk's ASR
            # latency measurement, making it look like inference itself is
            # catastrophically slow when it's actually a one-time setup cost.
            load_start = time.perf_counter()
            try:
                await asyncio.to_thread(self.asr.load)
                logger.info("[PIPELINE] ASR model ready in %.2fs (device=%s)",
                            time.perf_counter() - load_start, self.asr.device_used)
            except Exception as e:  # noqa: BLE001
                await self._publish_error("asr", f"Model load failed: {e}", recoverable=False)
                self._status["audio"] = "error"
                self._status["asr"] = "error"
                await self._publish_status()
                await self._input_source.stop()
                return
            self._status["asr"] = "ready"
            await self._publish_status()

        self._running = True
        self._stream_task = asyncio.create_task(self._run_stream(mode))
        self._watchdog_task = asyncio.create_task(self._run_context_watchdog())
        logger.info("[PIPELINE] Started in %r mode", mode)

    async def stop(self) -> None:
        if not self._running:
            logger.info("[PIPELINE] stop() called while not running; ignoring")
            return
        self._running = False

        for task in (self._stream_task, self._watchdog_task):
            if task is not None:
                task.cancel()
        for task in (self._stream_task, self._watchdog_task):
            if task is not None:
                try:
                    await task
                except (asyncio.CancelledError, Exception):
                    pass

        if self._input_source is not None:
            await self._input_source.stop()

        # Flush any remaining buffered context so nothing is silently lost.
        if self._context_buffer is not None:
            segment = self._context_buffer.flush()
            if segment and segment.text.strip():
                try:
                    await self._run_downstream(segment.text, time.time(), reason="flush")
                except Exception as e:  # noqa: BLE001
                    await self._publish_error("pipeline", f"Error flushing final segment: {e}")

        self._status["audio"] = "idle"
        self._status["asr"] = "idle"
        self._input_source = None
        self._stream_task = None
        self._watchdog_task = None
        self._stream_mode = None
        await self._publish_status()
        logger.info("[PIPELINE] Stopped")

    async def _run_context_watchdog(self) -> None:
        """Catches silence/max-duration triggers even when no new text arrives."""
        try:
            while self._running:
                await asyncio.sleep(0.5)
                if self._context_buffer is None:
                    continue
                segment = self._context_buffer.check_timeout()
                if segment and segment.text.strip():
                    await self._run_downstream(segment.text, time.time(), reason=segment.reason)
        except asyncio.CancelledError:
            pass

    async def _run_stream(self, mode: StreamMode) -> None:
        assert self._input_source is not None and self._aggregator is not None and self._context_buffer is not None
        try:
            async for event in self._input_source.stream():
                if not self._running:
                    break

                if event.text is not None:
                    # mock / already-text input: treat as a finalized ASR chunk directly.
                    final_text = event.text
                else:
                    final_text = await self._run_asr_chunk(event)
                    if final_text is None:
                        continue

                stable = self._aggregator.add_final(final_text, event.timestamp)
                self._last_transcript = stable
                await event_bus.publish("TRANSCRIPT_UPDATED", {"text": stable})
                await event_bus.publish("TRANSCRIPT_FINAL", {
                    "text": stable,
                    **saathify_compat.transcript_final_fields(stable, event.timestamp, time.time()),
                })

                # Feed the context buffer only the NEW, deduplicated words
                # from this chunk — feeding it the raw chunk text would
                # double-count whatever overlapped the previous chunk.
                delta_text = self._aggregator.get_last_added_text()
                if not delta_text:
                    continue
                context_segment = self._context_buffer.add_text(delta_text, event.timestamp)
                if context_segment and context_segment.text.strip():
                    await self._run_downstream(context_segment.text, event.timestamp, reason=context_segment.reason)

            # The stream ended on its own (not via stop()/CancelledError) —
            # if it was SystemAudioInput's capture thread that failed, the
            # loop above would otherwise go silently idle with no error
            # surfaced anywhere. Report it (Phase 13).
            if self._running and isinstance(self._input_source, SystemAudioInput) and self._input_source.last_error:
                await self._publish_error("audio_capture", self._input_source.last_error, recoverable=True)
                self._status["audio"] = "error"
                await self._publish_status()
        except asyncio.CancelledError:
            raise
        except Exception as e:  # noqa: BLE001
            await self._publish_error("pipeline_stream", str(e))
            self._status["audio"] = "error"
            await self._publish_status()

    async def _run_asr_chunk(self, event) -> str | None:
        if self._status["asr"] != "running":
            self._status["asr"] = "running"
            await self._publish_status()
        try:
            with metrics.timer("asr"):
                result = await self.asr.transcribe(event.audio, event.sample_rate or settings.AUDIO_SAMPLE_RATE)
            await event_bus.publish("ASR_PARTIAL", {"text": result.text})
            await event_bus.publish("TRANSCRIPT_PARTIAL", {
                "text": result.text,
                **saathify_compat.transcript_partial_fields(result.text),
            })
            return result.text
        except Exception as e:  # noqa: BLE001
            await self._publish_error("asr", str(e))
            return None

    # ------------------------------------------------------------------ #
    # Shared downstream pipeline (context text -> ... -> motion)
    # ------------------------------------------------------------------ #
    async def _run_downstream(self, text: str, timestamp: float, reason: str = "manual") -> dict:
        text = text.strip()
        if not text:
            return {}

        total_start = time.perf_counter()
        await event_bus.publish("CONTEXT_READY", {"text": text, "reason": reason})

        with metrics.timer("language_detection"):
            lang: LanguageDetection = self.language_detector.detect(text)
        await event_bus.publish("LANGUAGE_DETECTED", lang.model_dump())

        with metrics.timer("normalization"):
            norm: NormalizationResult = self.normalizer.normalize(text)
        await event_bus.publish("TEXT_NORMALIZED", norm.model_dump())

        try:
            with metrics.timer("translation"):
                translation: ISLTranslation = await self.translator.translate(norm.normalized_text, lang.language)
        except Exception as e:  # noqa: BLE001
            await self._publish_error("translation", str(e))
            return {}
        await event_bus.publish("ISL_TRANSLATION", {
            **translation.model_dump(),
            **saathify_compat.isl_translation_fields(translation),
        })

        with metrics.timer("sign_resolution"):
            resolved: list[ResolvedSign] = [self.sign_resolver.resolve(g) for g in translation.gloss_sequence]
        await event_bus.publish("SIGN_RESOLVED", {"signs": [r.model_dump() for r in resolved]})

        with metrics.timer("motion_generation"):
            unit_types = [u.type for u in translation.semantic_units]
            motion: MotionSequence = self.motion_generator.generate(
                text, translation.gloss_sequence, resolved, semantic_unit_types=unit_types,
            )
        await event_bus.publish("MOTION_SEQUENCE", motion.model_dump())
        # Same payload, avatar-facing event name (Phase 5 of the live-avatar
        # integration) — kept as an alias so existing MOTION_SEQUENCE
        # consumers (the simple test frontend) are unaffected.
        await event_bus.publish("AVATAR_SEQUENCE_READY", motion.model_dump())
        # new-frontend expects one AVATAR_MOTION event per sign rather than a
        # batch — fan the same sequence out, purely additive (no existing
        # consumer listens for this type).
        for item_fields in saathify_compat.avatar_motion_events([i.model_dump() for i in motion.items]):
            await event_bus.publish("AVATAR_MOTION", item_fields)

        total_ms = (time.perf_counter() - total_start) * 1000.0
        metrics.record("total", total_ms)
        await event_bus.publish("PIPELINE_METRICS", metrics.snapshot())

        return {
            "source_text": text,
            "source_language": lang.language,
            "language": lang.language,  # kept for backward compatibility with earlier clients
            "language_confidence": lang.confidence,
            "normalized_text": norm.normalized_text,
            "translation_method": translation.translation_method,
            "model_name": translation.model_name,
            "model_available": translation.model_available,
            "fallback_used": translation.fallback_used,
            "confidence": translation.confidence,
            "confidence_type": translation.confidence_type,
            "intermediate_language": translation.intermediate_language,
            "translation_path": translation.translation_path,
            "warnings": translation.warnings,
            "semantic_units": [u.model_dump() for u in translation.semantic_units],
            "isl_gloss": translation.gloss_sequence,
            "unknown_words": translation.unknown_words,
            "resolved_signs": [r.model_dump() for r in resolved],
            "motion_sequence": motion.model_dump(),
            "metrics": {
                "translation_ms": metrics.snapshot()["last_run_ms"].get("translation", 0.0),
            },
            "total_ms": round(total_ms, 2),
        }

    # ------------------------------------------------------------------ #
    # One-shot entry points
    # ------------------------------------------------------------------ #
    async def process_text(self, text: str) -> dict:
        await event_bus.publish("INPUT_RECEIVED", {"source": "text", "text": text})
        return await self._run_downstream(text, time.time(), reason="manual")

    async def process_audio_file(self, path: str) -> dict:
        from app.services.input.audio_file import AudioFileInput

        await event_bus.publish("INPUT_RECEIVED", {"source": "audio_file", "path": path})
        aggregator = TranscriptAggregator()
        source = AudioFileInput(path)
        await source.start()
        self._status["asr"] = "running"
        await self._publish_status()
        try:
            async for event in source.stream():
                with metrics.timer("asr"):
                    result = await self.asr.transcribe(event.audio, event.sample_rate or settings.AUDIO_SAMPLE_RATE)
                await event_bus.publish("ASR_PARTIAL", {"text": result.text})
                stable = aggregator.add_final(result.text, event.timestamp)
                await event_bus.publish("TRANSCRIPT_UPDATED", {"text": stable})
        finally:
            await source.stop()
            self._status["asr"] = "idle"
            await self._publish_status()

        final_text = aggregator.get_current_transcript()
        await event_bus.publish("ASR_FINAL", {"text": final_text})
        result_dict = await self._run_downstream(final_text, time.time(), reason="audio_file_complete")
        result_dict["transcript"] = final_text
        return result_dict


pipeline_manager = PipelineManager()
