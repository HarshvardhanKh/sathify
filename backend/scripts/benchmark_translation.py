"""
Phase 8 benchmark script.

Benchmarks RuleBasedISLTranslator, ModelISLTranslator (reports its
honest 0% availability rather than skipping it silently), and
HybridISLTranslator across a curated set of representative sentences
covering: greetings, educational sentences, questions, time expressions,
negation, named entities, technical concepts, Hindi, and unknown words.

Run:
  .venv\\Scripts\\python.exe scripts\\benchmark_translation.py
"""
import asyncio
import statistics
import time

from app.services.translation.hybrid import HybridISLTranslator
from app.services.translation.model_adapter import ModelISLTranslator
from app.services.translation.rule_based import RuleBasedISLTranslator

# Curated test set (category, text, language)
TEST_SET = [
    # Greetings
    ("greeting", "Hello everyone.", "en"),
    ("greeting", "Hi there, good morning.", "en"),
    ("greeting", "Hey everyone, welcome back.", "en"),
    # Educational sentences
    ("educational", "Today we are going to learn about artificial intelligence.", "en"),
    ("educational", "We are studying computer science and neural networks.", "en"),
    ("educational", "The teacher explained the lesson clearly.", "en"),
    ("educational", "Students must submit their homework by Friday.", "en"),
    ("educational", "This chapter covers machine learning basics.", "en"),
    # Questions
    ("question", "What are you doing?", "en"),
    ("question", "Where is the library?", "en"),
    ("question", "Who is your teacher?", "en"),
    ("question", "Are you ready?", "en"),
    ("question", "Why did you leave early?", "en"),
    # Time expressions
    ("time", "I am going to college tomorrow.", "en"),
    ("time", "She arrived yesterday morning.", "en"),
    ("time", "We will meet again tonight.", "en"),
    ("time", "He is working right now.", "en"),
    # Negation
    ("negation", "I do not like coffee.", "en"),
    ("negation", "She is not coming today.", "en"),
    ("negation", "We cannot finish this on time.", "en"),
    # Named entities
    ("named_entity", "Steve Jobs founded Apple.", "en"),
    ("named_entity", "My name is Harshvardhan.", "en"),
    ("named_entity", "NASA launched a new satellite.", "en"),
    ("named_entity", "OpenAI released ChatGPT.", "en"),
    # Technical concepts
    ("technical", "The neural network improved accuracy significantly.", "en"),
    ("technical", "We are going to learn about artificial intelligence.", "en"),
    ("technical", "The computer science department is hiring.", "en"),
    # Numbers
    ("number", "I have 3 apples and 5 oranges.", "en"),
    ("number", "The meeting is at 10 o'clock.", "en"),
    # Hindi
    ("hindi", "आज हम आर्टिफिशियल इंटेलिजेंस के बारे में सीखेंगे।", "hi"),
    ("hindi", "मेरा नाम हर्षवर्धन है।", "hi"),
    ("hindi", "हम कल कॉलेज जा रहे हैं।", "hi"),
    # Unknown words / edge cases
    ("unknown_words", "Zylophonic quantum entanglement destabilized rapidly.", "en"),
    ("unknown_words", "The xenomorphic algorithm recalibrated itself.", "en"),
]


async def benchmark_translator(name: str, translator, cases: list[tuple[str, str, str]]) -> dict:
    latencies_ms = []
    successes = 0
    fallbacks = 0
    token_counts = []
    errors = 0

    for _category, text, lang in cases:
        t0 = time.perf_counter()
        try:
            result = await translator.translate(text, lang)
            elapsed = (time.perf_counter() - t0) * 1000.0
            latencies_ms.append(elapsed)
            if result.gloss_sequence:
                successes += 1
            if getattr(result, "fallback_used", True):
                fallbacks += 1
            token_counts.append(len(result.gloss_sequence))
        except Exception:  # noqa: BLE001
            errors += 1

    n = len(cases)
    return {
        "name": name,
        "n": n,
        "errors": errors,
        "success_rate": round(successes / n, 3) if n else 0.0,
        "fallback_rate": round(fallbacks / n, 3) if n else 0.0,
        "avg_latency_ms": round(statistics.mean(latencies_ms), 2) if latencies_ms else None,
        "median_latency_ms": round(statistics.median(latencies_ms), 2) if latencies_ms else None,
        "max_latency_ms": round(max(latencies_ms), 2) if latencies_ms else None,
        "avg_token_count": round(statistics.mean(token_counts), 2) if token_counts else 0,
    }


async def main():
    print(f"Benchmarking on {len(TEST_SET)} curated sentences across "
          f"{len(set(c for c, _, _ in TEST_SET))} categories\n")

    model = ModelISLTranslator()
    print(f"ModelISLTranslator.is_available(): {model.is_available()}  "
          f"(expected False — see research report)\n")

    translators = {
        "RuleBasedISLTranslator": RuleBasedISLTranslator(),
        "ModelISLTranslator": model,
        "HybridISLTranslator": HybridISLTranslator(),
    }

    results = []
    for name, translator in translators.items():
        stats = await benchmark_translator(name, translator, TEST_SET)
        results.append(stats)

    header = f"{'Translator':<24}{'N':>4}{'Errors':>8}{'Success%':>10}{'Fallback%':>11}{'Avg ms':>10}{'Median ms':>11}{'Max ms':>9}{'AvgTok':>8}"
    print(header)
    print("-" * len(header))
    for r in results:
        avg = r["avg_latency_ms"] if r["avg_latency_ms"] is not None else "-"
        med = r["median_latency_ms"] if r["median_latency_ms"] is not None else "-"
        mx = r["max_latency_ms"] if r["max_latency_ms"] is not None else "-"
        print(f"{r['name']:<24}{r['n']:>4}{r['errors']:>8}{r['success_rate']*100:>9.1f}%"
              f"{r['fallback_rate']*100:>10.1f}%{avg!s:>10}{med!s:>11}{mx!s:>9}{r['avg_token_count']:>8}")

    print()
    print("Note: ModelISLTranslator has 0% success (no gloss produced) because")
    print("it correctly refuses to fabricate a translation with no model loaded —")
    print("this is the expected, honest result confirming the research conclusion.")


if __name__ == "__main__":
    asyncio.run(main())
