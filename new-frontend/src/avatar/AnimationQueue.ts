import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimationLibraryData, AvatarExpression, AvatarState, MotionSequence, PoseData } from './types';

const STALE_THRESHOLD_MS = 4000;
const LETTER_MS = 350;
const RETURN_TO_IDLE_MS = 400;

const FALLBACK_IDLE: PoseData = { right_hand: [0.35, -0.35, 0.15], left_hand: [-0.35, -0.35, 0.15], hold_ms: 600 };

interface PlayStep {
  animationId: string;
  durationMs: number;
  label: string;
}

function expandToSteps(seq: MotionSequence): PlayStep[] {
  const steps: PlayStep[] = [];
  for (const item of seq.items) {
    if (item.type === 'sign') {
      steps.push({ animationId: item.animation_id ?? 'idle', durationMs: item.duration_ms, label: item.sign_id ?? '' });
      continue;
    }
    const letterIds = (item.animation_id ?? '').split(',');
    item.characters.forEach((ch, i) => {
      steps.push({ animationId: letterIds[i] ?? `letter_${ch.toLowerCase()}`, durationMs: LETTER_MS, label: ch });
    });
    const pauseMs = Math.max(0, item.duration_ms - item.characters.length * LETTER_MS);
    if (pauseMs > 0) steps.push({ animationId: 'idle', durationMs: pauseMs, label: '' });
  }
  return steps;
}

export function useAnimationQueue(library: AnimationLibraryData) {
  const queueRef = useRef<PlayStep[]>([]);
  const playingRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const libraryRef = useRef(library);
  libraryRef.current = library;

  const [state, setState] = useState<AvatarState>('IDLE');
  const [currentPose, setCurrentPose] = useState<PoseData>(library.idle ?? FALLBACK_IDLE);
  const [currentLabel, setCurrentLabel] = useState('');
  const [queueLength, setQueueLength] = useState(0);
  const [expression, setExpression] = useState<AvatarExpression>('NEUTRAL');

  const idlePose = (): PoseData => libraryRef.current.idle ?? FALLBACK_IDLE;

  const scheduleNext = useCallback(() => {
    const next = queueRef.current.shift();
    setQueueLength(queueRef.current.length);

    if (!next) {
      setState('RETURN_TO_IDLE');
      setCurrentPose(idlePose());
      setCurrentLabel('');
      timerRef.current = window.setTimeout(() => {
        setState('IDLE');
        playingRef.current = false;
      }, RETURN_TO_IDLE_MS);
      return;
    }

    setState('PLAYING_SIGN');
    setCurrentPose(libraryRef.current[next.animationId] ?? idlePose());
    setCurrentLabel(next.label);
    timerRef.current = window.setTimeout(scheduleNext, next.durationMs);
  }, []);

  const enqueueSequence = useCallback(
    (seq: MotionSequence) => {
      setState('RECEIVING_SEQUENCE');

      const backlogMs = queueRef.current.reduce((sum, s) => sum + s.durationMs, 0);
      if (backlogMs > STALE_THRESHOLD_MS) {
        queueRef.current = [];
      }

      queueRef.current.push(...expandToSteps(seq));
      setQueueLength(queueRef.current.length);
      setExpression(seq.expression);
      setState('QUEUED');

      if (!playingRef.current) {
        playingRef.current = true;
        scheduleNext();
      }
    },
    [scheduleNext]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { enqueueSequence, state, currentPose, currentLabel, queueLength, expression };
}
