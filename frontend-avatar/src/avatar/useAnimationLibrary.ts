import { useEffect, useState } from "react";
import type { AnimationLibraryData } from "../types";

const IDLE_POSE = { right_hand: [0.35, -0.35, 0.15], left_hand: [-0.35, -0.35, 0.15], hold_ms: 600 } as const;

/** Fetches GET /api/animations ONCE and caches it — the frontend never asks
 * the backend for pose data per-event, only animation_id references. */
export function useAnimationLibrary() {
  const [library, setLibrary] = useState<AnimationLibraryData>({ idle: IDLE_POSE as any });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/animations")
      .then((r) => r.json())
      .then((data: AnimationLibraryData) => {
        if (!cancelled) {
          setLibrary(data);
          setLoaded(true);
        }
      })
      .catch((e) => {
        console.error("Failed to load animation library; using idle-only fallback", e);
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { library, loaded };
}
