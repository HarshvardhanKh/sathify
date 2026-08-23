"""
Step 1 validation script (standalone, no app code).

Purpose:
  1. Enumerate Windows audio devices via PyAudioWPatch.
  2. Find the default speakers' WASAPI loopback device (or use an override).
  3. Record N seconds of whatever is currently playing on the system.
  4. Save it to a WAV file.
  5. Compute RMS/peak levels to prove the capture is not silence.

Tries callback-mode first; if zero callbacks fire, falls back to
blocking-read mode and reports which one worked.

Run:
  .venv\\Scripts\\python.exe scripts\\step1_test_wasapi_loopback.py [seconds] [device_index]

Before running: start playing audio (YouTube / any media) on the laptop.
"""
import sys
import time
import wave
import queue
import threading
import numpy as np
import pyaudiowpatch as pyaudio

RECORD_SECONDS = float(sys.argv[1]) if len(sys.argv) > 1 else 6.0
DEVICE_INDEX_OVERRIDE = int(sys.argv[2]) if len(sys.argv) > 2 else None
OUTPUT_WAV = "step1_capture.wav"
CHUNK = 1024


def list_devices(p: pyaudio.PyAudio):
    print("\n=== Host APIs ===")
    for i in range(p.get_host_api_count()):
        info = p.get_host_api_info_by_index(i)
        print(f"  [{i}] {info['name']} (devices: {info['deviceCount']})")

    print("\n=== All devices ===")
    for i in range(p.get_device_count()):
        info = p.get_device_info_by_index(i)
        tag = "  <-- LOOPBACK" if info.get("isLoopbackDevice") else ""
        host_api = p.get_host_api_info_by_index(info["hostApi"])["name"]
        print(
            f"  [{i}] {info['name']!r} "
            f"in={info['maxInputChannels']} out={info['maxOutputChannels']} "
            f"rate={int(info['defaultSampleRate'])} hostApi={host_api}{tag}"
        )


def get_default_loopback_device(p: pyaudio.PyAudio):
    """Find the loopback device that mirrors the current default output device."""
    wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    default_speakers = p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
    print(f"\nDefault WASAPI output device: {default_speakers['name']!r} "
          f"(index {default_speakers['index']})")

    if not default_speakers.get("isLoopbackDevice", False):
        found = None
        for loopback in p.get_loopback_device_info_generator():
            if default_speakers["name"] in loopback["name"]:
                found = loopback
                break
        if found is None:
            raise RuntimeError(
                "Could not find a loopback device matching the default output "
                "device."
            )
        default_speakers = found

    return default_speakers


def compute_levels(samples: np.ndarray) -> tuple[float, float]:
    if samples.size == 0:
        return 0.0, 0.0
    samples_f = samples.astype(np.float64) / 32768.0
    rms = float(np.sqrt(np.mean(samples_f**2)))
    peak = float(np.max(np.abs(samples_f)))
    return rms, peak


def try_callback_mode(p, device, channels, rate):
    print("\n--- Attempt 1: callback mode ---")
    frames = []
    callback_count = 0
    status_flags_seen = set()

    def callback(in_data, frame_count, time_info, status):
        nonlocal callback_count
        callback_count += 1
        status_flags_seen.add(status)
        frames.append(in_data)
        if callback_count <= 3 or callback_count % 50 == 0:
            print(f"  [CALLBACK #{callback_count}] frames={frame_count} "
                  f"bytes={len(in_data)} status={status}")
        return (in_data, pyaudio.paContinue)

    stream = p.open(
        format=pyaudio.paInt16,
        channels=channels,
        rate=rate,
        input=True,
        frames_per_buffer=CHUNK,
        input_device_index=device["index"],
        stream_callback=callback,
        start=False,
    )
    print(f"  Stream opened. is_active={stream.is_active()}")
    stream.start_stream()
    print(f"  Stream started. is_active={stream.is_active()}")

    start = time.time()
    while stream.is_active() and (time.time() - start) < RECORD_SECONDS:
        time.sleep(0.1)
    elapsed = time.time() - start
    stream.stop_stream()
    stream.close()
    print(f"  Elapsed: {elapsed:.2f}s, callbacks: {callback_count}, "
          f"status flags seen: {status_flags_seen}")

    return frames, callback_count


def try_blocking_mode(p, device, channels, rate, max_stall_seconds=2.0, max_consecutive_stalls=3):
    print("\n--- Attempt 2: blocking read mode (watchdog-protected) ---")
    stream = p.open(
        format=pyaudio.paInt16,
        channels=channels,
        rate=rate,
        input=True,
        frames_per_buffer=CHUNK,
        input_device_index=device["index"],
        start=False,
    )
    print(f"  Stream opened. is_active={stream.is_active()}")
    stream.start_stream()
    print(f"  Stream started. is_active={stream.is_active()}")

    frames = []
    n_reads = int((rate * RECORD_SECONDS) / CHUNK)
    read_count = 0
    consecutive_stalls = 0

    result_q: "queue.Queue" = queue.Queue(maxsize=1)

    def do_read():
        try:
            data = stream.read(CHUNK, exception_on_overflow=False)
            result_q.put(("ok", data))
        except Exception as e:
            result_q.put(("error", e))

    try:
        for i in range(n_reads):
            t = threading.Thread(target=do_read, daemon=True)
            t.start()
            try:
                kind, payload = result_q.get(timeout=max_stall_seconds)
            except queue.Empty:
                consecutive_stalls += 1
                print(f"  [STALL] read #{i} did not return within "
                      f"{max_stall_seconds}s ({consecutive_stalls}/{max_consecutive_stalls})")
                if consecutive_stalls >= max_consecutive_stalls:
                    print("  Aborting: engine is not delivering data at all "
                          "(leaving stalled reader thread behind as daemon).")
                    break
                continue

            if kind == "error":
                print(f"  [READ ERROR] {payload}")
                break

            frames.append(payload)
            read_count += 1
            consecutive_stalls = 0
            if read_count <= 3 or read_count % 50 == 0:
                print(f"  [READ #{read_count}] bytes={len(payload)}")
    finally:
        try:
            stream.stop_stream()
        except Exception as e:
            print(f"  (stop_stream raised, likely due to a still-blocked reader thread: {e})")
        try:
            stream.close()
        except Exception as e:
            print(f"  (close raised: {e})")
    print(f"  Reads completed: {read_count}/{n_reads}")
    return frames, read_count


def main():
    p = pyaudio.PyAudio()
    try:
        list_devices(p)
        if DEVICE_INDEX_OVERRIDE is not None:
            device = p.get_device_info_by_index(DEVICE_INDEX_OVERRIDE)
        else:
            device = get_default_loopback_device(p)
        print(f"\nUsing loopback device: [{device['index']}] {device['name']!r}")
        print(f"isLoopbackDevice={device.get('isLoopbackDevice')}")

        channels = int(device["maxInputChannels"])
        rate = int(device["defaultSampleRate"])
        print(f"Channels: {channels}, Sample rate: {rate}")

        print(f"\nRecording {RECORD_SECONDS} sec of system audio... "
              f"(make sure something is playing!)")

        frames, count = try_callback_mode(p, device, channels, rate)
        mode_used = "callback"

        if count == 0:
            print("\nCallback mode produced 0 events. Falling back to blocking read...")
            frames, count = try_blocking_mode(p, device, channels, rate)
            mode_used = "blocking"

        print(f"\nMode used: {mode_used}, buffers captured: {len(frames)}")

        if count == 0:
            print("\nERROR: Both callback and blocking modes produced zero data.")
            print("This points to the stream not actually being fed by the audio")
            print("engine at all (endpoint format mismatch, exclusive-mode lock by")
            print("another app, or driver-level issue) rather than an app-level bug.")
            return

        raw = b"".join(frames)
        samples = np.frombuffer(raw, dtype=np.int16)

        with wave.open(OUTPUT_WAV, "wb") as wf:
            wf.setnchannels(channels)
            wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
            wf.setframerate(rate)
            wf.writeframes(raw)
        print(f"Saved: {OUTPUT_WAV}")

        actual_duration = len(samples) / channels / rate
        rms, peak = compute_levels(samples)
        print(f"\n=== Audio level check ===")
        print(f"Actual duration captured: {actual_duration:.2f} sec")
        print(f"RMS:  {rms:.5f}")
        print(f"Peak: {peak:.5f}")
        if peak < 0.001:
            print("WARNING: Captured audio appears to be SILENCE.")
        else:
            print("OK: Captured audio contains signal (not silence).")

    finally:
        p.terminate()


if __name__ == "__main__":
    main()
