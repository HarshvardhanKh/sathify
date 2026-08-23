"""
AudioPreprocessor — normalizes whatever the capture backend hands back
(typically 48kHz stereo float32 from WASAPI loopback) into what
faster-whisper expects: 16kHz mono float32, entirely in memory, no
temporary WAV files.

Pipeline: downmix (stereo/N-channel -> mono) -> resample -> 16kHz float32.
"""
from __future__ import annotations

import numpy as np

TARGET_SAMPLE_RATE = 16000


def downmix_to_mono(samples: np.ndarray) -> np.ndarray:
    """samples: (n,) already mono, or (n, channels)."""
    if samples.ndim == 1:
        return samples.astype(np.float32)
    return samples.mean(axis=1).astype(np.float32)


def resample_linear(samples: np.ndarray, src_rate: int, dst_rate: int) -> np.ndarray:
    """Simple linear-interpolation resampler — no extra heavy DSP dependency
    (scipy/librosa) for what is, for speech-recognition purposes, a good
    enough resampling quality at these rates."""
    if src_rate == dst_rate or samples.size == 0:
        return samples.astype(np.float32)
    duration = len(samples) / src_rate
    n_dst = max(1, int(round(duration * dst_rate)))
    src_x = np.linspace(0, duration, num=len(samples), endpoint=False)
    dst_x = np.linspace(0, duration, num=n_dst, endpoint=False)
    return np.interp(dst_x, src_x, samples).astype(np.float32)


class AudioPreprocessor:
    def __init__(self, target_sample_rate: int = TARGET_SAMPLE_RATE) -> None:
        self.target_sample_rate = target_sample_rate

    def process(self, samples: np.ndarray, src_rate: int) -> np.ndarray:
        mono = downmix_to_mono(samples)
        return resample_linear(mono, src_rate, self.target_sample_rate)
