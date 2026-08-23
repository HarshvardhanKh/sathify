"""
Phase 2/3 (STEP C/D/E): retest both capture backends, but ONLY after
independently verifying real audio is rendering (AudioDeviceMonitor from
Phase 1) — this is the gate the master prompt requires: "Do not start
capture validation until AUDIO ACTIVE = TRUE."

For each backend: capture ~7s, compute RMS/peak/frames/duration, save a WAV
if non-silent, and report pass/fail against the stated success criteria.

Run:
  .venv\\Scripts\\python.exe -u scripts\\step2_test_backends_with_verified_audio.py
"""
import asyncio
import sys
import time
import wave

import numpy as np

sys.path.insert(0, ".")

from app.services.audio.device_monitor import AudioDeviceMonitor  # noqa: E402
from app.services.audio.pyaudio_capture import PyAudioWASAPICapture  # noqa: E402
from app.services.audio.soundcard_capture import SoundcardCapture  # noqa: E402

CAPTURE_SECONDS = 7.0
SILENCE_RMS_THRESHOLD = 0.001


def save_wav(path: str, samples: np.ndarray, sample_rate: int, channels: int):
    pcm16 = np.clip(samples.reshape(-1) * 32767, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm16.tobytes())


async def test_backend(name: str, capture, capture_seconds: float, out_wav: str) -> dict:
    print(f"\n--- Testing backend: {name} ---")
    chunks = []
    t_start = time.time()
    try:
        await capture.start()
        print(f"  Started. device_info: {capture.device_info}")
        async for chunk in capture.stream_chunks():
            chunks.append(chunk)
            if time.time() - t_start >= capture_seconds:
                break
    except Exception as e:  # noqa: BLE001
        print(f"  ERROR during capture: {e}")
        await capture.stop()
        return {"name": name, "error": str(e)}
    await capture.stop()

    if not chunks:
        print("  Captured 0 chunks.")
        return {"name": name, "frames": 0, "duration": 0.0, "rms": 0.0, "peak": 0.0, "callbacks": 0}

    sample_rate = chunks[0].sample_rate
    channels = chunks[0].channels
    all_samples = np.concatenate([c.samples.reshape(-1) for c in chunks])
    duration = len(all_samples) / channels / sample_rate
    rms = float(np.sqrt(np.mean(np.square(all_samples, dtype=np.float64))))
    peak = float(np.max(np.abs(all_samples)))

    print(f"  Chunks: {len(chunks)}, sample_rate={sample_rate}, channels={channels}")
    print(f"  Duration: {duration:.2f}s, RMS: {rms:.5f}, Peak: {peak:.5f}")

    non_silent = peak > SILENCE_RMS_THRESHOLD
    if non_silent:
        save_wav(out_wav, all_samples, sample_rate, channels)
        print(f"  Saved: {out_wav}")
    else:
        print("  Not saving WAV — signal below silence threshold.")

    return {
        "name": name, "frames": len(all_samples), "duration": duration,
        "rms": rms, "peak": peak, "callbacks": len(chunks), "non_silent": non_silent,
    }


async def main():
    monitor = AudioDeviceMonitor()
    print("Waiting for verified active audio (AUDIO_ACTIVE_THRESHOLD gate)...")
    snap = monitor.wait_for_active_audio(timeout_seconds=30.0)
    if snap is None or not snap.audio_active:
        print("\nABORTING: no active audio detected within timeout.")
        print(snap.format() if snap else "(no snapshot)")
        print("\nPlay audio through the Windows Speakers and re-run this script.")
        return

    print("AUDIO ACTIVE confirmed:")
    print(snap.format())

    results = []
    results.append(await test_backend("soundcard", SoundcardCapture(), CAPTURE_SECONDS, "output_soundcard.wav"))
    results.append(await test_backend("pyaudiowpatch", PyAudioWASAPICapture(), CAPTURE_SECONDS, "output_pyaudio.wav"))

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for r in results:
        if "error" in r:
            print(f"{r['name']:<15} ERROR: {r['error']}")
            continue
        verdict = "PASS" if r.get("non_silent") and r["frames"] > 0 else "FAIL"
        print(f"{r['name']:<15} frames={r['frames']:<10} duration={r['duration']:.2f}s "
              f"rms={r['rms']:.5f} peak={r['peak']:.5f} -> {verdict}")


if __name__ == "__main__":
    asyncio.run(main())
