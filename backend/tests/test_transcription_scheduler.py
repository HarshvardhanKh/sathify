import numpy as np

from app.services.asr.scheduler import TranscriptionScheduler
from app.services.audio.activity import AudioActivityDetector
from app.services.audio.ring_buffer import AudioRingBuffer


def make_scheduler(rms_threshold=0.01):
    ring = AudioRingBuffer(sample_rate=100, window_seconds=1.0, overlap_seconds=0.25)
    detector = AudioActivityDetector(rms_threshold=rms_threshold)
    return TranscriptionScheduler(ring, detector)


def test_no_window_ready_returns_none():
    sched = make_scheduler()
    sched.push(np.ones(50, dtype=np.float32) * 0.5)
    assert sched.get_ready_window() is None


def test_silent_window_is_dropped_not_returned():
    sched = make_scheduler(rms_threshold=0.01)
    sched.push(np.zeros(100, dtype=np.float32))  # a full, but silent, window
    assert sched.get_ready_window() is None
    assert sched.stats["dropped_silent_windows"] == 1


def test_active_window_is_returned():
    sched = make_scheduler(rms_threshold=0.01)
    sched.push(np.ones(100, dtype=np.float32) * 0.5)
    window = sched.get_ready_window()
    assert window is not None
    assert len(window) == 100


def test_backlog_keeps_only_latest_window():
    """If several windows became ready between calls, only the most recent
    should be returned — older ones dropped, not queued."""
    sched = make_scheduler(rms_threshold=0.01)
    # Push enough for 3 windows' worth of active audio in one go.
    sched.push(np.ones(100 + 75 + 75, dtype=np.float32) * 0.5)
    window = sched.get_ready_window()
    assert window is not None
    assert sched.stats["dropped_stale_windows"] >= 1
