import numpy as np

from app.services.audio.activity import AudioActivityDetector


def test_silence_is_inactive():
    detector = AudioActivityDetector(rms_threshold=0.01)
    silence = np.zeros(1000, dtype=np.float32)
    result = detector.analyze(silence, timestamp=0.0)
    assert result.is_active is False
    assert result.rms == 0.0


def test_loud_signal_is_active():
    detector = AudioActivityDetector(rms_threshold=0.01)
    loud = np.ones(1000, dtype=np.float32) * 0.5
    result = detector.analyze(loud, timestamp=0.0)
    assert result.is_active is True
    assert result.rms > 0.01


def test_hold_time_keeps_active_briefly_after_loud_chunk():
    detector = AudioActivityDetector(rms_threshold=0.01, silence_hold_seconds=1.0)
    loud = np.ones(100, dtype=np.float32) * 0.5
    silence = np.zeros(100, dtype=np.float32)

    detector.analyze(loud, timestamp=0.0)
    # 0.5s later, still within hold window even though this chunk is silent
    result = detector.analyze(silence, timestamp=0.5)
    assert result.is_active is True

    # 2s later, past the hold window
    result2 = detector.analyze(silence, timestamp=2.0)
    assert result2.is_active is False


def test_seconds_since_active():
    detector = AudioActivityDetector(rms_threshold=0.01)
    assert detector.seconds_since_active() is None
    detector.analyze(np.ones(100, dtype=np.float32) * 0.5, timestamp=10.0)
    assert detector.seconds_since_active(now=12.0) == 2.0
