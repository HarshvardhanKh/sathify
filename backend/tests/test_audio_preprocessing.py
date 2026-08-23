import numpy as np

from app.services.audio.preprocessing import AudioPreprocessor, downmix_to_mono, resample_linear


def test_downmix_stereo_to_mono():
    stereo = np.array([[1.0, 3.0], [1.0, 3.0]], dtype=np.float32)  # 2 frames, 2 channels
    mono = downmix_to_mono(stereo)
    assert mono.shape == (2,)
    assert np.allclose(mono, [2.0, 2.0])


def test_downmix_already_mono_is_noop():
    mono_in = np.array([0.1, 0.2, 0.3], dtype=np.float32)
    assert np.array_equal(downmix_to_mono(mono_in), mono_in)


def test_resample_same_rate_is_noop():
    samples = np.array([0.1, 0.2, 0.3], dtype=np.float32)
    result = resample_linear(samples, 16000, 16000)
    assert np.array_equal(result, samples)


def test_resample_changes_length_proportionally():
    samples = np.ones(48000, dtype=np.float32)  # 1 second @ 48kHz
    result = resample_linear(samples, 48000, 16000)
    assert abs(len(result) - 16000) <= 1  # ~1 second @ 16kHz


def test_preprocessor_full_pipeline_stereo_48k_to_mono_16k():
    stereo_48k = np.ones((48000, 2), dtype=np.float32) * 0.5  # 1s of constant stereo signal
    result = AudioPreprocessor(target_sample_rate=16000).process(stereo_48k, src_rate=48000)
    assert abs(len(result) - 16000) <= 1
    assert np.allclose(result, 0.5, atol=1e-5)
