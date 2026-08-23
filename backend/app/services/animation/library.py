"""
AnimationLibrary (ProceduralAnimationProvider) — loads the hand-authored
"hero" poses from data/signs/poses.json and procedurally, deterministically
fills in every other sign_id (and all 26 fingerspelling letters) so that
NO sign in vocabulary.json is ever left without a playable animation —
this is Phase 15's "procedural fallback" rule implemented at the source
rather than as an afterthought.

Deterministic = hashlib-seeded, so `resolve("SCIENCE")` always yields the
same pose across restarts (important: a flaky-looking avatar that repositions
signs randomly between runs would undermine the demo).
"""
from __future__ import annotations

import hashlib
import json
import logging
import string
from pathlib import Path

from app.config import settings
from app.services.animation.provider import BaseSignAnimationProvider, PoseSequence

logger = logging.getLogger("isl.animation.library")

IDLE_POSE_ID = "idle"
_X_RANGE = (-0.40, 0.40)
_Y_RANGE = (-0.10, 0.60)
_Z_RANGE = (0.05, 0.45)


def _procedural_pose(seed: str) -> dict:
    """Deterministic pseudo-random target position derived from a hash of
    the animation_id — real motion, honestly not real ISL choreography."""
    digest = hashlib.sha256(seed.encode("utf-8")).digest()

    def scaled(byte: int, lo: float, hi: float) -> float:
        return lo + (byte / 255.0) * (hi - lo)

    right = [
        scaled(digest[0], *_X_RANGE),
        scaled(digest[1], *_Y_RANGE),
        scaled(digest[2], *_Z_RANGE),
    ]
    # ~1 in 3 signs procedurally get a two-handed pose for visual variety.
    left = None
    if digest[3] % 3 == 0:
        left = [-right[0], right[1], right[2]]
    return {"right_hand": right, "left_hand": left}


class AnimationLibrary(BaseSignAnimationProvider):
    def __init__(self, poses_path: Path | None = None, vocabulary_path: Path | None = None) -> None:
        self._raw: dict = {}
        self._cache: dict[str, PoseSequence] = {}
        self._load(poses_path)
        self._seed_from_vocabulary(vocabulary_path)

    def _load(self, poses_path: Path | None) -> None:
        path = poses_path or (Path(__file__).resolve().parent.parent.parent.parent / "data" / "signs" / "poses.json")
        if not path.exists():
            logger.warning("[ANIMATION] poses.json not found at %s; starting with an empty library "
                            "(everything will be procedurally generated)", path)
            self._raw = {}
            return
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data.pop("_comment", None)
        self._raw = data
        logger.info("[ANIMATION] Loaded %d hand-authored poses from %s", len(self._raw), path)

    def _seed_from_vocabulary(self, vocabulary_path: Path | None) -> None:
        """Pre-materialize every vocabulary sign_id + all 26 letters so
        GET /api/animations returns a complete, stable library up front."""
        path = vocabulary_path or settings.SIGN_VOCABULARY_PATH
        if path.exists():
            with open(path, "r", encoding="utf-8") as f:
                vocab = json.load(f)
            for entry in vocab.values():
                sign_id = entry.get("sign_id")
                if sign_id:
                    self.get_animation(sign_id)
        for letter in string.ascii_uppercase:
            self.get_animation(self.letter_animation_id(letter))
        self.get_animation(IDLE_POSE_ID)

    @staticmethod
    def letter_animation_id(letter: str) -> str:
        return f"letter_{letter.lower()}"

    def resolve(self, sign_id: str) -> str:
        """sign_id (as stored in vocabulary.json, e.g. 'hello') maps 1:1 to
        animation_id today — kept as a separate method so a future provider
        can implement a real many-to-one or versioned mapping."""
        return sign_id.lower()

    def get_animation(self, animation_id: str) -> PoseSequence:
        animation_id = animation_id.lower()
        if animation_id in self._cache:
            return self._cache[animation_id]

        pose_data = self._raw.get(animation_id)
        if pose_data is None:
            pose_data = _procedural_pose(animation_id)
            logger.debug("[ANIMATION] No hand-authored pose for %r; generated procedurally", animation_id)

        pose = PoseSequence(
            animation_id=animation_id,
            right_hand=list(pose_data["right_hand"]),
            left_hand=list(pose_data["left_hand"]) if pose_data.get("left_hand") else None,
        )
        self._cache[animation_id] = pose
        return pose

    def get_all(self) -> dict:
        return {
            aid: {"right_hand": p.right_hand, "left_hand": p.left_hand, "hold_ms": p.hold_ms}
            for aid, p in self._cache.items()
        }


animation_library = AnimationLibrary()
