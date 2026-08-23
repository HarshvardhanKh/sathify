"""
AudioDeviceMonitor — Phase 1 of the live-audio investigation: an independent
way to answer "is audio actually being rendered right now?" BEFORE trusting
any capture backend's output. Built after two rounds of chasing "0 frames"
capture bugs that turned out to be "nothing was playing," this exists so
that mistake can't happen a third time.

Uses pycaw (Windows Core Audio COM bindings) to read the real Windows audio
engine session list and each session's live peak meter — the same
information Windows' own volume mixer shows — independent of whichever
capture backend (soundcard / PyAudioWPatch) is being tested.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

from pycaw.pycaw import AudioUtilities, IAudioMeterInformation

logger = logging.getLogger("isl.audio.device_monitor")

AUDIO_ACTIVE_THRESHOLD = 0.02  # peak meter value (0.0-1.0); tune per environment


@dataclass
class SessionActivity:
    process_name: str
    peak: float
    active: bool


@dataclass
class AudioActivitySnapshot:
    output_device_name: str
    sessions: list[SessionActivity] = field(default_factory=list)
    max_peak: float = 0.0
    timestamp: float = field(default_factory=time.time)

    @property
    def audio_active(self) -> bool:
        return self.max_peak >= AUDIO_ACTIVE_THRESHOLD

    def format(self) -> str:
        active_procs = [s.process_name for s in self.sessions if s.active]
        lines = [
            f"OUTPUT DEVICE:\n  {self.output_device_name}",
            f"ACTIVE SESSIONS:\n  {', '.join(active_procs) or '(none)'}",
            f"PEAK:\n  {self.max_peak:.4f}",
            f"STATUS:\n  {'AUDIO ACTIVE' if self.audio_active else 'silent'}",
        ]
        return "\n".join(lines)


class AudioDeviceMonitor:
    """Queries the live Windows audio session list. Cheap enough to poll
    repeatedly (used both as a standalone verifier and, later, to gate
    ASR windows so silence never reaches faster-whisper)."""

    def get_default_output_device_name(self) -> str:
        try:
            import soundcard as sc
            return sc.default_speaker().name
        except Exception as e:  # noqa: BLE001
            logger.warning("[AUDIO_MONITOR] Could not resolve default speaker via soundcard: %s", e)
            return "(unknown)"

    def snapshot(self) -> AudioActivitySnapshot:
        device_name = self.get_default_output_device_name()
        sessions: list[SessionActivity] = []
        max_peak = 0.0

        try:
            for s in AudioUtilities.GetAllSessions():
                proc = s.Process
                name = proc.name() if proc else "(system sounds)"
                peak = 0.0
                try:
                    meter = s._ctl.QueryInterface(IAudioMeterInformation)
                    peak = float(meter.GetPeakValue())
                except Exception:
                    pass
                active = peak >= AUDIO_ACTIVE_THRESHOLD
                sessions.append(SessionActivity(process_name=name, peak=peak, active=active))
                max_peak = max(max_peak, peak)
        except Exception as e:  # noqa: BLE001
            logger.error("[AUDIO_MONITOR] Failed to enumerate audio sessions: %s", e)

        return AudioActivitySnapshot(output_device_name=device_name, sessions=sessions, max_peak=max_peak)

    def wait_for_active_audio(self, timeout_seconds: float = 30.0, poll_interval: float = 0.5) -> AudioActivitySnapshot | None:
        """Block (synchronously) until AUDIO_ACTIVE is True or timeout. Used
        as the required gate before any capture-backend test is allowed to run."""
        deadline = time.time() + timeout_seconds
        last = None
        while time.time() < deadline:
            last = self.snapshot()
            if last.audio_active:
                return last
            time.sleep(poll_interval)
        return last
