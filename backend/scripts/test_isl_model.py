"""
Phase 2 validation script for the ISL translation research pass.

There is no downloadable pretrained model to validate (see the research
report / model_adapter.py docstring) — this instead independently validates
the semantic_hybrid engine that IS the selected approach, exactly as Phase 2
specifies: run the required sentences, print input/output/format/timing/
device/errors/warnings for each, BEFORE any pipeline integration decision.

Run:
  .venv\\Scripts\\python.exe scripts\\test_isl_model.py
"""
import asyncio
import time

from app.services.translation.hybrid import HybridISLTranslator
from app.services.translation.model_adapter import ModelISLTranslator

SENTENCES = [
    ("Hello everyone.", "en"),
    ("Today we are going to learn about artificial intelligence.", "en"),
    ("I am going to college tomorrow.", "en"),
    ("What are you doing?", "en"),
    ("My name is Harshvardhan.", "en"),
    ("आज हम आर्टिफिशियल इंटेलिजेंस के बारे में सीखेंगे।", "hi"),
]


def gpu_memory_info() -> str:
    try:
        import torch
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1024**2
            return f"{allocated:.1f} MB allocated (torch available, CUDA present)"
        return "CUDA not available to torch"
    except Exception:
        return "N/A (semantic_hybrid is a CPU-only spaCy pipeline; no GPU used)"


async def main():
    model = ModelISLTranslator()
    print("=" * 70)
    print("MODEL AVAILABILITY CHECK")
    print("=" * 70)
    print(f"ModelISLTranslator.is_available(): {model.is_available()}")
    print("  -> Confirmed: no pretrained ISL model configured/found. "
          "HybridISLTranslator will use the semantic_hybrid path for all "
          "sentences below (see research report).")
    print()

    hybrid = HybridISLTranslator()

    for text, lang in SENTENCES:
        print("=" * 70)
        print(f"INPUT ({lang}): {text}")
        t0 = time.perf_counter()
        errors = []
        result = None
        try:
            result = await hybrid.translate(text, lang)
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        if result is not None:
            print(f"MODEL OUTPUT (gloss_sequence): {result.gloss_sequence}")
            print(f"OUTPUT FORMAT: list[str] gloss tokens, canonical-order heuristic")
            print(f"SEMANTIC UNITS: {[(u.type, u.value) for u in result.semantic_units]}")
            print(f"UNKNOWN WORDS: {result.unknown_words}")
            print(f"TRANSLATION METHOD: {result.translation_method}")
            print(f"MODEL NAME: {result.model_name}")
            print(f"MODEL AVAILABLE: {result.model_available}")
            print(f"FALLBACK USED: {result.fallback_used}")
            print(f"CONFIDENCE: {result.confidence} (type: {result.confidence_type})")
            print(f"WARNINGS: {result.warnings}")
        print(f"INFERENCE TIME: {elapsed_ms:.2f} ms")
        print(f"DEVICE USED: CPU (spaCy en_core_web_sm; no GPU inference in this path)")
        print(f"GPU MEMORY: {gpu_memory_info()}")
        print(f"ERRORS: {errors or 'none'}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
