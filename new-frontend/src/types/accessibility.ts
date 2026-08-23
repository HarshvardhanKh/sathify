// The single action vocabulary that switch access, voice commands, and (in
// principle) any future assistive hardware all converge on — nothing
// downstream cares which input method produced the action.

export type AccessibilityAction =
  | 'NEXT'
  | 'PREVIOUS'
  | 'ACTIVATE'
  | 'BACK'
  | 'PLAY_PAUSE'
  | 'SCROLL_UP'
  | 'SCROLL_DOWN'
  | 'SAVE'
  | 'SUBMIT';

export type AccessibilityActionHandler = (action: AccessibilityAction) => void;
