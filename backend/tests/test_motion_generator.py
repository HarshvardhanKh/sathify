from app.services.motion.generator import MotionSequenceGenerator
from app.services.signs.resolver import SignResolver


def test_motion_sequence_for_mixed_resolution_types():
    resolver = SignResolver()
    gloss_sequence = ["HELLO", "ARTIFICIAL_INTELLIGENCE", "HARSHVARDHAN"]
    resolved = [resolver.resolve(g) for g in gloss_sequence]

    generator = MotionSequenceGenerator()
    sequence = generator.generate("Hello artificial intelligence Harshvardhan", gloss_sequence, resolved)

    # HELLO -> 1 sign item, ARTIFICIAL_INTELLIGENCE -> 2 sign items (compound), HARSHVARDHAN -> 1 fingerspell item
    assert len(sequence.items) == 4
    assert sequence.items[0].type == "sign"
    assert sequence.items[0].sign_id == "HELLO"          # gloss, for debug display
    assert sequence.items[0].animation_id == "hello"      # animation-library lookup key
    assert sequence.items[1].sign_id == "ARTIFICIAL"
    assert sequence.items[1].animation_id == "artificial"
    assert sequence.items[2].sign_id == "INTELLIGENCE"
    assert sequence.items[2].animation_id == "intelligence"
    assert sequence.items[3].type == "fingerspell"
    assert sequence.items[3].characters == list("HARSHVARDHAN")
    assert sequence.items[3].animation_id == ",".join(f"letter_{c.lower()}" for c in "HARSHVARDHAN")
    assert sequence.total_duration_ms > 0
    assert sequence.expression == "NEUTRAL"


def test_multiword_fingerspell_splits_into_separate_paced_runs():
    """Phase 9 requirement: multi-word names must NOT flatten into one
    continuous fingerspelling run."""
    resolver = SignResolver()
    gloss_sequence = ["STEVE_JOBS"]
    resolved = [resolver.resolve(g) for g in gloss_sequence]

    generator = MotionSequenceGenerator()
    sequence = generator.generate("Steve Jobs", gloss_sequence, resolved)

    assert len(sequence.items) == 2
    assert sequence.items[0].characters == list("STEVE")
    assert sequence.items[1].characters == list("JOBS")
    # each word's duration includes the trailing word-pause
    assert sequence.items[0].duration_ms > len("STEVE") * 350


def test_expression_reflects_semantic_unit_types():
    resolver = SignResolver()
    generator = MotionSequenceGenerator()

    question_seq = generator.generate("What?", ["WHAT"], [resolver.resolve("WHAT")],
                                       semantic_unit_types=["QUESTION"])
    assert question_seq.expression == "QUESTION"

    greeting_seq = generator.generate("Hello", ["HELLO"], [resolver.resolve("HELLO")],
                                       semantic_unit_types=["GREETING"])
    assert greeting_seq.expression == "HAPPY"
