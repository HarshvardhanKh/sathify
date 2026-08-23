import { useEffect, useState } from 'react';
import type { AnimationLibraryData, PoseData } from './types';

const IDLE_POSE: PoseData = { right_hand: [0.35, -0.35, 0.15], left_hand: [-0.35, -0.35, 0.15], hold_ms: 600 };

export function useAnimationLibrary() {
  const [library, setLibrary] = useState<AnimationLibraryData>({ idle: IDLE_POSE });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:8000/api/animations')
      .then((r) => r.json())
      .then((data: AnimationLibraryData) => {
        if (!cancelled) {
          setLibrary(data);
          setLoaded(true);
        }
      })
      .catch((e) => {
        console.error('Failed to load animation library; using idle-only fallback', e);
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { library, loaded };
}
