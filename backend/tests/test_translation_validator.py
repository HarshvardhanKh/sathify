from app.models.translation import ISLTranslation
from app.services.translation.validator import TranslationValidator


def make_translation(gloss_sequence, normalized_text="hello world"):
    return ISLTranslation(
        source_text=normalized_text,
        normalized_text=normalized_text,
        source_language="en",
        gloss_sequence=gloss_sequence,
    )


def test_valid_gloss_passes_through():
    t = make_translation(["HELLO", "WORLD"])
    result, validation = TranslationValidator().validate(t)
    assert validation.is_valid is True
    assert result.gloss_sequence == ["HELLO", "WORLD"]


def test_empty_gloss_is_invalid():
    t = make_translation([])
    result, validation = TranslationValidator().validate(t)
    assert validation.is_valid is False
    assert "empty gloss sequence" in " ".join(validation.reasons)


def test_invalid_tokens_are_stripped():
    t = make_translation(["HELLO", "", "___", "WORLD"])
    result, validation = TranslationValidator().validate(t)
    assert result.gloss_sequence == ["HELLO", "WORLD"]
    assert any("invalid" in r for r in validation.reasons)


def test_consecutive_duplicates_collapsed():
    t = make_translation(["HELLO", "HELLO", "WORLD", "WORLD", "WORLD"])
    result, validation = TranslationValidator().validate(t)
    assert result.gloss_sequence == ["HELLO", "WORLD"]
    assert any("duplicate" in r for r in validation.reasons)


def test_non_latin_script_tokens_are_not_stripped_as_invalid():
    """Regression: the 'has content' check used to be ASCII-only and
    misclassified every Devanagari gloss token as invalid/empty."""
    t = make_translation(["आज", "हम"], normalized_text="आज हम")
    result, validation = TranslationValidator().validate(t)
    assert result.gloss_sequence == ["आज", "हम"]
    assert validation.is_valid is True


def test_passthrough_gloss_identical_to_source_is_invalid():
    t = make_translation(
        ["HELLO", "EVERYONE", "THIS", "IS", "A", "TEST"],
        normalized_text="hello everyone this is a test",
    )
    result, validation = TranslationValidator().validate(t)
    assert validation.is_valid is False
    assert any("identical" in r for r in validation.reasons)
