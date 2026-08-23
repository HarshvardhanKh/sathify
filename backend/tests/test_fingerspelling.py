from app.services.signs.fingerspelling import FingerspellingResolver


def test_basic_fingerspell():
    r = FingerspellingResolver().resolve("ChatGPT")
    assert r.resolution_type == "fingerspell"
    assert r.characters == list("CHATGPT")


def test_fingerspell_strips_non_alnum():
    r = FingerspellingResolver().resolve("A.I.")
    assert r.characters == ["A", "I"]
