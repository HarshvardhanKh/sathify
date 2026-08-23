import React from 'react';

export const SkipLinks: React.FC = () => {
  return (
    <div className="relative z-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-fg focus:rounded-md focus:shadow-lg focus:font-semibold text-sm"
      >
        Skip to main content
      </a>
      <a
        href="#quick-a11y-controls"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-36 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-fg focus:rounded-md focus:shadow-lg focus:font-semibold text-sm"
      >
        Skip to accessibility controls
      </a>
    </div>
  );
};
