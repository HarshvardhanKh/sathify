from app.services.transcript.aggregator import TranscriptAggregator, merge_with_overlap


def test_merge_with_overlap_basic():
    merged = merge_with_overlap("Hello everyone, today we", "today we are going to learn")
    assert merged == "Hello everyone, today we are going to learn"


def test_merge_with_overlap_three_chunks():
    agg = TranscriptAggregator()
    agg.add_final("Hello everyone today we", 0.0)
    agg.add_final("today we are going to learn", 1.0)
    agg.add_final("going to learn about artificial intelligence", 2.0)
    assert agg.get_current_transcript() == "Hello everyone today we are going to learn about artificial intelligence"


def test_no_overlap_just_appends():
    merged = merge_with_overlap("Hello everyone", "nice to meet you")
    assert merged == "Hello everyone nice to meet you"


def test_fully_duplicate_chunk_adds_nothing():
    agg = TranscriptAggregator()
    agg.add_final("Hello everyone today", 0.0)
    before = agg.get_current_transcript()
    agg.add_final("Hello everyone today", 1.0)
    assert agg.get_current_transcript() == before


def test_partial_does_not_pollute_stable_transcript():
    agg = TranscriptAggregator()
    agg.add_final("Hello everyone", 0.0)
    agg.add_partial("Hello everyone today we are", 1.0)
    assert agg.get_current_transcript() == "Hello everyone"
    assert "today we are" in agg.get_partial()


def test_get_last_added_text_is_only_the_delta():
    """This is what feeds ContextBuffer — must never include words already
    counted from a previous overlapping chunk."""
    agg = TranscriptAggregator()
    agg.add_final("Hello everyone today we", 0.0)
    assert agg.get_last_added_text() == "Hello everyone today we"

    agg.add_final("today we are going to learn", 1.0)
    assert agg.get_last_added_text() == "are going to learn"

    agg.add_final("going to learn about artificial intelligence", 2.0)
    assert agg.get_last_added_text() == "about artificial intelligence"

    # Fully-overlapped chunk contributes nothing new.
    agg.add_final("about artificial intelligence", 3.0)
    assert agg.get_last_added_text() == ""


def test_flush_produces_segment_and_resets():
    agg = TranscriptAggregator()
    agg.add_final("Hello everyone", 0.0)
    segment = agg.flush()
    assert segment is not None
    assert segment.text == "Hello everyone"
    assert agg.get_current_transcript() == ""
    assert agg.flush() is None
