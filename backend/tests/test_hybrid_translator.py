import asyncio

from app.models.translation import ISLTranslation
from app.services.translation.hybrid import HybridISLTranslator
from app.services.translation.model_adapter import ModelISLTranslator
from app.services.translation.rule_based import RuleBasedISLTranslator


class _FakeModel(ModelISLTranslator):
    """Test double: lets us control availability/output without a real model."""

    def __init__(self, available: bool, result: ISLTranslation | None = None, raises: bool = False):
        super().__init__()
        self._available = available
        self._result = result
        self._raises = raises

    def is_available(self) -> bool:
        return self._available

    @property
    def model_name(self) -> str | None:
        return "fake-model-v1"

    async def translate(self, text: str, source_language: str) -> ISLTranslation:
        if self._raises:
            raise RuntimeError("simulated model failure")
        return self._result


def run(coro):
    return asyncio.run(coro)


def test_no_model_falls_back_to_semantic_hybrid_and_preserves_demo_case():
    """The exact master-prompt demo case must still work through the default
    (no-model) Hybrid path."""
    hybrid = HybridISLTranslator()  # default ModelISLTranslator() -> unavailable
    result = run(hybrid.translate(
        "Hello everyone, today we are going to learn about artificial intelligence.", "en"
    ))
    for expected in ("HELLO", "EVERYONE", "TODAY", "WE", "ARTIFICIAL_INTELLIGENCE", "LEARN"):
        assert expected in result.gloss_sequence
    assert result.translation_method == "semantic_hybrid"
    assert result.model_available is False
    assert result.fallback_used is True


def test_available_model_with_good_output_is_used():
    good = ISLTranslation(
        source_text="hi", normalized_text="hi", source_language="en",
        gloss_sequence=["HELLO", "THERE"],
    )
    fake = _FakeModel(available=True, result=good)
    hybrid = HybridISLTranslator(model_translator=fake)
    result = run(hybrid.translate("hi", "en"))
    assert result.gloss_sequence == ["HELLO", "THERE"]
    assert result.translation_method == "pretrained_isl_model"
    assert result.model_name == "fake-model-v1"
    assert result.model_available is True
    assert result.fallback_used is False
    assert result.confidence_type == "model"


def test_available_model_with_empty_output_falls_back():
    bad = ISLTranslation(source_text="hi", normalized_text="hi", source_language="en", gloss_sequence=[])
    fake = _FakeModel(available=True, result=bad)
    hybrid = HybridISLTranslator(model_translator=fake)
    result = run(hybrid.translate("Hello everyone.", "en"))
    assert result.translation_method in ("semantic_hybrid", "rule_based_fallback")
    assert result.fallback_used is True
    assert result.gloss_sequence  # rule-based fallback actually produced something


def test_model_exception_falls_back_without_crashing():
    fake = _FakeModel(available=True, raises=True)
    hybrid = HybridISLTranslator(model_translator=fake)
    result = run(hybrid.translate("Hello everyone.", "en"))
    assert result.fallback_used is True
    assert result.gloss_sequence
