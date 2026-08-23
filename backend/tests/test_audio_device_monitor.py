"""Unit tests for the pure-logic parts of AudioDeviceMonitor (the
threshold/verdict computation) — the live pycaw session enumeration itself
is integration-tested via scripts/audio_activity_monitor.py against real
Windows audio state, not mocked here."""
from app.services.audio.device_monitor import AUDIO_ACTIVE_THRESHOLD, AudioActivitySnapshot, SessionActivity


def test_snapshot_active_when_peak_above_threshold():
    snap = AudioActivitySnapshot(
        output_device_name="Speakers",
        sessions=[SessionActivity(process_name="brave.exe", peak=AUDIO_ACTIVE_THRESHOLD + 0.1, active=True)],
        max_peak=AUDIO_ACTIVE_THRESHOLD + 0.1,
    )
    assert snap.audio_active is True


def test_snapshot_inactive_when_peak_below_threshold():
    snap = AudioActivitySnapshot(output_device_name="Speakers", sessions=[], max_peak=0.0)
    assert snap.audio_active is False


def test_format_includes_key_fields():
    snap = AudioActivitySnapshot(
        output_device_name="Speakers (Realtek(R) Audio)",
        sessions=[SessionActivity(process_name="brave.exe", peak=0.5, active=True)],
        max_peak=0.5,
    )
    text = snap.format()
    assert "Speakers (Realtek(R) Audio)" in text
    assert "brave.exe" in text
    assert "AUDIO ACTIVE" in text
