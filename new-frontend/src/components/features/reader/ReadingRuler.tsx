import React, { useEffect, useState } from 'react';

interface ReadingRulerProps {
  enabled: boolean;
}

export const ReadingRuler: React.FC<ReadingRulerProps> = ({ enabled }) => {
  const [mouseY, setMouseY] = useState<number>(200);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-150"
    >
      {/* Top Dimming Mask */}
      <div
        className="bg-black/40 w-full transition-all duration-75"
        style={{ height: `${Math.max(0, mouseY - 40)}px` }}
      />
      {/* Active Clear Focus Band */}
      <div className="w-full h-20 border-y-2 border-accent bg-accent/5 shadow-md" />
      {/* Bottom Dimming Mask */}
      <div className="bg-black/40 w-full flex-1" />
    </div>
  );
};
