"""
Tests for RuleBasedISLTranslator. These validate the STRUCTURE and ordering
rule of the semantic extraction (TIME, SUBJECT, LOCATION, OBJECT/CONCEPT,
ACTION), not exact linguistic correctness — the translator is explicitly
experimental (see translation_method / warnings on every result).
"""
import asyncio

from app.services.translation.rule_based import RuleBasedISLTranslator


def translate(text: str, lang: str = "en"):
    return asyncio.run(RuleBasedISLTranslator().translate(text, lang))


def test_college_tomorrow_example():
    result = translate("I am going to college tomorrow.")
    gloss = result.gloss_sequence
    assert "TOMORROW" in gloss
    assert "I" in gloss
    assert "COLLEGE" in gloss
    assert "GO" in gloss
    # canonical order: TIME, SUBJECT, LOCATION, OBJECT, ACTION
    assert gloss.index("TOMORROW") < gloss.index("I") < gloss.index("COLLEGE") < gloss.index("GO")
    assert result.translation_method == "semantic_hybrid"
    assert result.model_available is False
    assert result.fallback_used is True
    assert result.confidence_type == "heuristic"
    assert 0.0 < result.confidence <= 1.0
    assert result.warnings


def test_studying_ai_example():
    result = translate("We are studying artificial intelligence.")
    gloss = result.gloss_sequence
    assert "WE" in gloss
    assert "ARTIFICIAL_INTELLIGENCE" in gloss
    assert "STUDY" in gloss
    assert gloss.index("WE") < gloss.index("ARTIFICIAL_INTELLIGENCE") < gloss.index("STUDY")


def test_today_learning_ai_example():
    result = translate("Today we are learning about artificial intelligence.")
    gloss = result.gloss_sequence
    assert "TODAY" in gloss
    assert "WE" in gloss
    assert "ARTIFICIAL_INTELLIGENCE" in gloss
    assert "LEARN" in gloss
    assert gloss.index("TODAY") < gloss.index("WE") < gloss.index("ARTIFICIAL_INTELLIGENCE") < gloss.index("LEARN")


def test_full_master_prompt_example_greeting_and_periphrastic_verb():
    """'Hello everyone' must survive (INTJ + addressee), and 'going to learn'
    must resolve ACTION to LEARN, not the light verb GO (xcomp preference)."""
    result = translate("Hello everyone, today we are going to learn about artificial intelligence.")
    gloss = result.gloss_sequence
    for expected in ("HELLO", "EVERYONE", "TODAY", "WE", "ARTIFICIAL_INTELLIGENCE", "LEARN"):
        assert expected in gloss, f"{expected} missing from {gloss}"
    assert "GO" not in gloss
    assert gloss.index("HELLO") < gloss.index("EVERYONE") < gloss.index("TODAY") < gloss.index("WE")
    assert gloss.index("LEARN") == len(gloss) - 1 or gloss[-1] == "LEARN"


def test_proper_noun_surfaces_for_downstream_fingerspelling():
    result = translate("My name is Harshvardhan.")
    assert "HARSHVARDHAN" in result.gloss_sequence


def test_empty_text_returns_empty_gloss():
    result = translate("")
    assert result.gloss_sequence == []
    assert result.confidence == 0.0


def test_hindi_uses_fallback_method_and_does_not_crash():
    result = translate("आज हम आर्टिफिशियल इंटेलिजेंस के बारे में सीखेंगे", lang="hi")
    assert result.translation_method == "rule_based_fallback"
    assert result.confidence < 0.5
    assert result.gloss_sequence  # produced *something*, not empty
    # Regression: _gloss() used to be ASCII-only and silently turned every
    # Devanagari token into an empty string — assert real (non-empty)
    # Unicode content survived, not just a non-empty list of empty strings.
    assert all(tok.strip() for tok in result.gloss_sequence)
    assert any(len(tok) > 1 for tok in result.gloss_sequence)


# --- Phase 7 research follow-up: QUESTION / NEGATION / NUMBER / NAMED_ENTITY ---

def test_wh_question_detected_and_placed_clause_finally():
    result = translate("What are you doing?")
    gloss = result.gloss_sequence
    assert "WHAT" in gloss
    assert "YOU" in gloss
    assert "DO" in gloss
    assert gloss[-1] == "WHAT"  # wh-word placed clause-finally (heuristic)
    unit_types = {u.type for u in result.semantic_units}
    assert "QUESTION" in unit_types


def test_yes_no_question_gets_generic_marker():
    result = translate("Are you ready?")
    assert "Q" in result.gloss_sequence
    assert result.gloss_sequence[-1] == "Q"


def test_negation_detected():
    result = translate("I do not like coffee.")
    assert "NOT" in result.gloss_sequence
    unit_types = {u.type for u in result.semantic_units}
    assert "NEGATION" in unit_types


def test_number_preserved():
    result = translate("I have 3 apples.")
    assert "3" in result.gloss_sequence


def test_multiword_named_entity_kept_as_one_unit():
    """Regression for the compound-dependency bug: a multi-word PERSON name
    used as a sentence subject must not be silently dropped down to just its
    head noun."""
    result = translate("Steve Jobs founded Apple.")
    assert "STEVE_JOBS" in result.gloss_sequence
    unit_types = {u.type for u in result.semantic_units}
    assert "NAMED_ENTITY" in unit_types


def test_technical_phrase_decomposition():
    """'computer science' / 'neural network' aren't in compounds.json but
    decompose cleanly once both words are individually known signs —
    verified at the SignResolver layer in test_sign_resolver.py; here we
    just confirm the translator emits the multi-word CONCEPT gloss intact."""
    result = translate("We are studying computer science and neural networks.")
    gloss = result.gloss_sequence
    assert "COMPUTER_SCIENCE" in gloss
    assert any(g.startswith("NEURAL_NETWORK") for g in gloss)
