"""
GeminiKeyManager — tracks health/cooldown per configured Gemini API key and
picks a healthy one for each request, with failover across keys on
transient errors. A key stays in use while healthy; it is never rotated
away just because a previous call succeeded.

Failure classification matters: a rate limit or 5xx should cool the key
down temporarily, not disable it forever; a malformed/auth error is treated
the same way here for MVP simplicity (conservative cooldown) rather than a
permanent ban, since misclassifying "invalid key" from a transient response
is easy to get wrong and a temporary cooldown is a safe default.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from enum import Enum

from app.config import settings

logger = logging.getLogger("isl.ai.key_manager")


class FailureType(str, Enum):
    RATE_LIMIT = "rate_limit"
    QUOTA = "quota"
    TIMEOUT = "timeout"
    NETWORK = "network"
    SERVER_ERROR = "server_error"
    MALFORMED_RESPONSE = "malformed_response"
    AUTH = "auth"
    UNKNOWN = "unknown"


@dataclass
class KeyHealth:
    index: int
    masked: str
    healthy: bool = True
    cooldown_until: float = 0.0
    failure_count: int = 0
    last_failure_type: FailureType | None = None
    last_failure_at: float | None = None

    def is_available(self, now: float) -> bool:
        if self.cooldown_until and now < self.cooldown_until:
            return False
        return self.healthy


def _mask(key: str) -> str:
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:4]}...{key[-4:]}"


class GeminiKeyManager:
    def __init__(self, keys: list[str] | None = None) -> None:
        raw_keys = keys if keys is not None else settings.gemini_keys()
        self._keys: list[str] = raw_keys
        self._health: list[KeyHealth] = [
            KeyHealth(index=i, masked=_mask(k)) for i, k in enumerate(raw_keys)
        ]
        self._rr_pos = 0  # round-robin starting point across healthy keys

    @property
    def configured(self) -> bool:
        return len(self._keys) > 0

    def get_healthy_key(self) -> tuple[int, str] | None:
        """Round-robin over currently-available keys, so load spreads across
        all healthy keys rather than hammering key 0 forever."""
        now = time.time()
        n = len(self._keys)
        if n == 0:
            return None
        for offset in range(n):
            idx = (self._rr_pos + offset) % n
            if self._health[idx].is_available(now):
                self._rr_pos = (idx + 1) % n
                return idx, self._keys[idx]
        return None

    def report_success(self, index: int) -> None:
        h = self._health[index]
        h.healthy = True
        h.cooldown_until = 0.0
        h.failure_count = 0

    def report_failure(self, index: int, failure_type: FailureType) -> None:
        h = self._health[index]
        h.failure_count += 1
        h.last_failure_type = failure_type
        h.last_failure_at = time.time()

        if failure_type in (FailureType.RATE_LIMIT, FailureType.QUOTA, FailureType.SERVER_ERROR):
            h.cooldown_until = time.time() + settings.GEMINI_COOLDOWN_SECONDS
            logger.warning("[GEMINI] Key #%d (%s) cooling down %.0fs after %s",
                            index, h.masked, settings.GEMINI_COOLDOWN_SECONDS, failure_type.value)
        elif failure_type in (FailureType.TIMEOUT, FailureType.NETWORK):
            h.cooldown_until = time.time() + min(15.0, settings.GEMINI_COOLDOWN_SECONDS)
            logger.warning("[GEMINI] Key #%d (%s) brief cooldown after %s", index, h.masked, failure_type.value)
        else:
            # AUTH / MALFORMED_RESPONSE / UNKNOWN: don't nuke it forever on
            # one bad response, but do cool it down conservatively.
            h.cooldown_until = time.time() + settings.GEMINI_COOLDOWN_SECONDS
            logger.error("[GEMINI] Key #%d (%s) failure: %s", index, h.masked, failure_type.value)

    def status(self) -> list[dict]:
        now = time.time()
        return [
            {
                "index": h.index,
                "key": h.masked,
                "healthy": h.is_available(now),
                "in_cooldown": bool(h.cooldown_until and now < h.cooldown_until),
                "cooldown_remaining_s": max(0.0, round(h.cooldown_until - now, 1)) if h.cooldown_until else 0.0,
                "failure_count": h.failure_count,
                "last_failure_type": h.last_failure_type.value if h.last_failure_type else None,
            }
            for h in self._health
        ]


gemini_key_manager = GeminiKeyManager()
