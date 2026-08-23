import { create } from 'zustand';

interface AnnounceState {
  politeMessage: string;
  assertiveMessage: string;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
}

export const useAnnounceStore = create<AnnounceState>((set) => ({
  politeMessage: '',
  assertiveMessage: '',
  announcePolite: (message: string) => set({ politeMessage: message }),
  announceAssertive: (message: string) => set({ assertiveMessage: message }),
}));

export function useAnnounce() {
  const announcePolite = useAnnounceStore((s) => s.announcePolite);
  const announceAssertive = useAnnounceStore((s) => s.announceAssertive);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      announceAssertive(message);
    } else {
      announcePolite(message);
    }
  };

  return { announce, announcePolite, announceAssertive };
}
