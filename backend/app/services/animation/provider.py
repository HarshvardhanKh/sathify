"""
BaseSignAnimationProvider — Phase 6's animation abstraction. MotionSequence
carries sign metadata; this is what turns it into something a renderer can
actually play. Multiple providers can implement this (local pose clips
today, a real GLB/mocap clip library or a generative model later) without
touching SignResolver, MotionSequenceGenerator, or the frontend contract.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class PoseSequence:
    """A single-target hand pose the avatar tweens to and holds — the
    procedural provider's native format. See poses.json's docstring for why
    this is honestly a placeholder animation, not real ISL movement data."""
    animation_id: str
    right_hand: list[float]
    left_hand: list[float] | None = None
    hold_ms: int = 600


@dataclass
class AnimationClip:
    """A richer multi-keyframe clip format (e.g. a future GLB/mocap-backed
    provider). Not produced by ProceduralAnimationProvider today, but part
    of the interface so a real clip library can plug in without changing
    the contract other code depends on."""
    animation_id: str
    keyframes: list[dict] = field(default_factory=list)
    duration_ms: int = 800


class BaseSignAnimationProvider(ABC):
    @abstractmethod
    def get_animation(self, animation_id: str) -> "PoseSequence | AnimationClip":
        """Resolve an animation_id to playable pose/clip data. Must never
        raise for an unknown id — fall back to a safe neutral pose instead
        (Phase 15's procedural-fallback rule)."""

    @abstractmethod
    def get_all(self) -> dict:
        """The full animation library, JSON-serializable, for the frontend
        to fetch once and cache (GET /api/animations)."""
