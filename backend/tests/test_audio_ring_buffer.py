import numpy as np

from app.services.audio.ring_buffer import AudioRingBuffer


def test_no_window_until_enough_audio():
    buf = AudioRingBuffer(sample_rate=100, window_seconds=1.0, overlap_seconds=0.25)
    buf.push(np.zeros(50, dtype=np.float32))
    assert buf.pop_window() is None


def test_first_window_returned_once_full():
    buf = AudioRingBuffer(sample_rate=100, window_seconds=1.0, overlap_seconds=0.25)
    buf.push(np.ones(100, dtype=np.float32))
    window = buf.pop_window()
    assert window is not None
    assert len(window) == 100


def test_overlap_step_matches_window_minus_overlap():
    sample_rate = 100
    buf = AudioRingBuffer(sample_rate=sample_rate, window_seconds=1.0, overlap_seconds=0.25)
    buf.push(np.arange(100, dtype=np.float32))
    first = buf.pop_window()
    assert first is not None
    # Not enough new audio yet for a second window (step = 0.75s = 75 samples).
    buf.push(np.zeros(50, dtype=np.float32))
    assert buf.pop_window() is None
    buf.push(np.zeros(25, dtype=np.float32))
    second = buf.pop_window()
    assert second is not None
    # second window should start 75 samples after the first (the overlap region reused)
    assert np.array_equal(second[:25], first[75:100])


def test_buffer_trims_beyond_max_seconds():
    buf = AudioRingBuffer(sample_rate=100, window_seconds=1.0, overlap_seconds=0.25, max_seconds=2.0)
    for _ in range(10):
        buf.push(np.ones(100, dtype=np.float32))
        buf.pop_window()
    assert buf.buffered_seconds <= 2.0 + 1e-6


def test_reset_clears_state():
    buf = AudioRingBuffer(sample_rate=100, window_seconds=1.0, overlap_seconds=0.25)
    buf.push(np.ones(100, dtype=np.float32))
    buf.reset()
    assert buf.buffered_seconds == 0.0
    assert buf.pop_window() is None


def test_rejects_overlap_not_smaller_than_window():
    import pytest
    with pytest.raises(ValueError):
        AudioRingBuffer(sample_rate=100, window_seconds=1.0, overlap_seconds=1.0)
