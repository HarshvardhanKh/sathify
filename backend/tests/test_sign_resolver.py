from app.services.signs.resolver import SignResolver


def resolver():
    return SignResolver()


def test_exact_match():
    r = resolver().resolve("HELLO")
    assert r.resolution_type == "exact"
    assert r.signs == ["HELLO"]


def test_synonym_resolves_to_canonical_exact():
    r = resolver().resolve("STUDYING")
    assert r.resolution_type == "exact"
    assert r.signs == ["LEARN"]


def test_compound_resolution():
    r = resolver().resolve("ARTIFICIAL_INTELLIGENCE")
    assert r.resolution_type == "compound"
    assert r.signs == ["ARTIFICIAL", "INTELLIGENCE"]


def test_decomposed_resolution_for_unlisted_multiword_concept():
    r = resolver().resolve("ARTIFICIAL_COLLEGE")  # not in compounds.json but both parts are known
    assert r.resolution_type == "decomposed"
    assert r.signs == ["ARTIFICIAL", "COLLEGE"]


def test_fingerspelling_fallback_for_unknown_word():
    r = resolver().resolve("HARSHVARDHAN")
    assert r.resolution_type == "fingerspell"
    assert r.characters == list("HARSHVARDHAN")


def test_empty_input_is_unknown():
    r = resolver().resolve("")
    assert r.resolution_type == "unknown"


def test_technical_phrase_decomposes_via_vocabulary_not_compounds_json():
    """COMPUTER_SCIENCE / NEURAL_NETWORK are NOT in compounds.json — they
    must decompose automatically because both parts are individually known
    signs (Phase 7 named-entity/technical-term follow-up)."""
    r = resolver().resolve("COMPUTER_SCIENCE")
    assert r.resolution_type == "decomposed"
    assert r.signs == ["COMPUTER", "SCIENCE"]

    r2 = resolver().resolve("NEURAL_NETWORK")
    assert r2.resolution_type == "decomposed"
    assert r2.signs == ["NEURAL", "NETWORK"]


def test_multiword_named_entity_fingerspells_as_one_unit():
    r = resolver().resolve("STEVE_JOBS")
    assert r.resolution_type == "fingerspell"
    assert r.characters == list("STEVEJOBS")
