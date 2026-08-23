import React from 'react';
import { useAnnounceStore } from '@/hooks/useAnnounce';

export const LiveRegion: React.FC = () => {
  const politeMessage = useAnnounceStore((s) => s.politeMessage);
  const assertiveMessage = useAnnounceStore((s) => s.assertiveMessage);

  return (
    <>
      <div
        id="a11y-polite-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        id="a11y-assertive-announcer"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  );
};
