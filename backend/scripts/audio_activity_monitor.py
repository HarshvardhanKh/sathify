"""
Phase 1 standalone verifier: prints live Windows audio session activity so
we can PROVE audio is rendering before trusting/debugging any capture
backend. This directly replaces guesswork with ground truth (see
step1c_active_sessions.py from the earlier investigation, which this
supersedes with continuous polling + a real ACTIVE/silent verdict).

Run for N seconds (default 15):
  .venv\\Scripts\\python.exe -u scripts\\audio_activity_monitor.py [seconds]
"""
import sys
import time

sys.path.insert(0, ".")  # allow running as `python scripts/audio_activity_monitor.py`

from app.services.audio.device_monitor import AudioDeviceMonitor  # noqa: E402

DURATION = float(sys.argv[1]) if len(sys.argv) > 1 else 15.0


def main():
    monitor = AudioDeviceMonitor()
    print(f"Polling audio activity for {DURATION:.0f}s (Ctrl+C to stop early)...\n")
    end = time.time() + DURATION
    any_active = False
    while time.time() < end:
        snap = monitor.snapshot()
        any_active = any_active or snap.audio_active
        ts = time.strftime("%H:%M:%S", time.localtime(snap.timestamp))
        print(f"[{ts}] {snap.format().replace(chr(10), ' | ')}")
        time.sleep(1.0)

    print()
    print("=" * 50)
    print(f"RESULT: {'AUDIO WAS ACTIVE at least once' if any_active else 'NO ACTIVE AUDIO DETECTED'}")
    print("=" * 50)


if __name__ == "__main__":
    main()
