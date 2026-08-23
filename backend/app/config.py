"""
Centralized, environment-driven configuration.

Every tunable in the pipeline lives here so behavior can be changed without
touching code. Uses pydantic-settings so values are validated and can be
overridden via environment variables or a `.env` file in backend/.
"""
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Server ---
    WEBSOCKET_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # --- Audio capture ---
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_CHUNK_SECONDS: float = 3.0
    AUDIO_OVERLAP_SECONDS: float = 0.5
    AUDIO_BACKEND: Literal["soundcard", "pyaudiowpatch"] = "soundcard"

    # --- ASR (faster-whisper) ---
    # Evidence-based: "small" measured both more accurate AND faster than
    # "base" in a real live-audio verification run on this RTX 3050 (base:
    # ~1.1s avg + noticeably garbled output; small: ~500-545ms avg + clean,
    # grammatically correct transcription of real speech). See the live-audio
    # integration report for the actual transcript comparison.
    ASR_MODEL: str = "small"
    ASR_DEVICE: Literal["auto", "cuda", "cpu"] = "auto"
    ASR_COMPUTE_TYPE: str = "auto"  # e.g. float16, int8_float16, int8, float32
    ASR_LANGUAGE: str | None = None  # None = auto-detect

    # --- Context buffer ---
    CONTEXT_MAX_WORDS: int = 20
    CONTEXT_MAX_SECONDS: float = 3.0
    CONTEXT_SILENCE_THRESHOLD: float = 0.8

    # --- Queues ---
    AUDIO_QUEUE_MAXSIZE: int = 50
    TRANSCRIPT_QUEUE_MAXSIZE: int = 100
    TRANSLATION_QUEUE_MAXSIZE: int = 100

    # --- Paths ---
    SIGN_VOCABULARY_PATH: Path = DATA_DIR / "signs" / "vocabulary.json"
    SIGN_COMPOUNDS_PATH: Path = DATA_DIR / "signs" / "compounds.json"
    SIGN_SYNONYMS_PATH: Path = DATA_DIR / "signs" / "synonyms.json"

    # --- Translation ---
    TRANSLATOR_STRATEGY: Literal["rule_based", "hybrid"] = "hybrid"

    # --- Gemini / Dost AI ---
    # Comma-separated list, e.g. "key1,key2,key3". No key configured -> Dost
    # and AI-powered document/equation features report unavailable honestly
    # rather than fabricating output. Never logged, never sent to the frontend.
    GEMINI_API_KEYS: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_TIMEOUT_SECONDS: float = 20.0
    GEMINI_MAX_RETRIES_PER_REQUEST: int = 3  # across distinct keys, not same-key retries
    GEMINI_COOLDOWN_SECONDS: float = 60.0  # how long a rate-limited/failing key sits out

    # --- Uploaded documents (temporary, no persistence layer) ---
    UPLOAD_DIR: Path = BACKEND_DIR / "data" / "uploads"
    UPLOAD_MAX_AGE_SECONDS: float = 3600.0  # cleaned up after this age

    def gemini_keys(self) -> list[str]:
        return [k.strip() for k in self.GEMINI_API_KEYS.split(",") if k.strip()]


settings = Settings()
