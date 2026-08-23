export type AvatarExpression = 'NEUTRAL' | 'HAPPY' | 'QUESTION' | 'NEGATION';
export type AvatarState = 'IDLE' | 'RECEIVING_SEQUENCE' | 'QUEUED' | 'PLAYING_SIGN' | 'RETURN_TO_IDLE';

export interface MotionItem {
  type: 'sign' | 'fingerspell';
  sign_id: string | null;
  animation_id: string | null;
  characters: string[];
  duration_ms: number;
}

export interface MotionSequence {
  sequence_id: string;
  source_text: string;
  translation: string[];
  items: MotionItem[];
  expression: AvatarExpression;
}

export interface PoseData {
  right_hand: [number, number, number];
  left_hand: [number, number, number] | null;
  hold_ms: number;
}

export type AnimationLibraryData = Record<string, PoseData>;
