from app.services.normalization.normalizer import TextNormalizer


def test_removes_fillers_and_expands_contractions_and_abbreviations():
    result = TextNormalizer().normalize("Umm, today we're, we're going to talk about A.I.")
    assert "umm" not in result.normalized_text.lower()
    assert "we are" in result.normalized_text.lower()
    assert "artificial intelligence" in result.normalized_text.lower()
    assert result.changes  # something was recorded as changed


def test_removes_stutter_repeats():
    result = TextNormalizer().normalize("I I am going going to college")
    tokens = result.normalized_text.lower().split()
    assert tokens.count("i") == 1
    assert tokens.count("going") == 1


def test_capitalizes_sentence_start():
    result = TextNormalizer().normalize("hello everyone.")
    assert result.normalized_text.startswith("Hello")


def test_preserves_numbers():
    result = TextNormalizer().normalize("I have 3 apples and 42 oranges.")
    assert "3" in result.normalized_text
    assert "42" in result.normalized_text
