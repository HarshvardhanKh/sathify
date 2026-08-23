"""
Cross-check script: try WASAPI loopback capture using the `soundcard` library
(different backend than PyAudioWPatch/PortAudio) to determine whether the
zero-data issue is library-specific or system-level.
"""
import sys
import numpy as np
import soundcard as sc

RECORD_SECONDS = float(sys.argv[1]) if len(sys.argv) > 1 else 6.0

print("=== Speakers (playback devices) ===")
for spk in sc.all_speakers():
    print(f"  {spk}")

default_speaker = sc.default_speaker()
print(f"\nDefault speaker: {default_speaker}")

mic = sc.get_microphone(id=str(default_speaker.name), include_loopback=True)
print(f"Loopback mic handle: {mic}")

samplerate = 48000
print(f"\nRecording {RECORD_SECONDS}s via soundcard loopback...")
with mic.recorder(samplerate=samplerate) as rec:
    data = rec.record(numframes=int(samplerate * RECORD_SECONDS))

print(f"Captured shape: {data.shape}, dtype={data.dtype}")
rms = float(np.sqrt(np.mean(data.astype(np.float64) ** 2)))
peak = float(np.max(np.abs(data)))
print(f"RMS: {rms:.5f}")
print(f"Peak: {peak:.5f}")
if peak < 0.001:
    print("WARNING: silence")
else:
    print("OK: real signal captured")
