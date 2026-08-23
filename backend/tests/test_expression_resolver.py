from app.services.animation.expression_resolver import ExpressionResolver


def test_neutral_by_default():
    assert ExpressionResolver().resolve([]) == "NEUTRAL"
    assert ExpressionResolver().resolve(["SUBJECT", "ACTION"]) == "NEUTRAL"


def test_question_takes_priority():
    resolver = ExpressionResolver()
    assert resolver.resolve(["QUESTION"]) == "QUESTION"
    assert resolver.resolve(["GREETING", "QUESTION"]) == "QUESTION"


def test_negation_maps_correctly():
    assert ExpressionResolver().resolve(["NEGATION"]) == "NEGATION"


def test_greeting_maps_to_happy():
    assert ExpressionResolver().resolve(["GREETING"]) == "HAPPY"
