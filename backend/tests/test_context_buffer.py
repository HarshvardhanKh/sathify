from app.services.transcript.context_buffer import ContextBuffer


def test_punctuation_triggers_finalization():
    buf = ContextBuffer(max_words=100, max_duration_seconds=100, silence_threshold_seconds=100)
    result = buf.add_text("Hello everyone.", timestamp=0.0)
    assert result is not None
    assert result.reason == "punctuation"
    assert result.text == "Hello everyone."


def test_max_words_triggers_finalization():
    buf = ContextBuffer(max_words=3, max_duration_seconds=100, silence_threshold_seconds=100)
    assert buf.add_text("one two", timestamp=0.0) is None
    result = buf.add_text("three", timestamp=0.1)
    assert result is not None
    assert result.reason == "max_words"
    assert result.word_count == 3


def test_max_duration_triggers_finalization():
    buf = ContextBuffer(max_words=100, max_duration_seconds=2.0, silence_threshold_seconds=100)
    assert buf.add_text("hello", timestamp=0.0) is None
    result = buf.add_text("world", timestamp=2.5)
    assert result is not None
    assert result.reason == "max_duration"


def test_silence_pause_triggers_finalization():
    buf = ContextBuffer(max_words=100, max_duration_seconds=100, silence_threshold_seconds=1.0)
    assert buf.add_text("hello", timestamp=0.0) is None
    result = buf.add_text("world", timestamp=5.0)
    assert result is not None
    assert result.reason == "silence"


def test_flush_returns_buffered_text():
    buf = ContextBuffer(max_words=100, max_duration_seconds=100, silence_threshold_seconds=100)
    buf.add_text("partial thought", timestamp=0.0)
    result = buf.flush()
    assert result is not None
    assert result.text == "partial thought"
    assert result.reason == "flush"
    assert buf.flush() is None
