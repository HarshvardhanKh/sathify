import React, { useEffect, useRef } from 'react';
import { HOTKEY_DEFINITIONS } from '../../hooks/useGlobalHotkeys';
import { X, Keyboard } from 'lucide-react';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotkeys-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-saathi-navy/10 text-text-primary">
              <Keyboard className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="hotkeys-modal-title" className="text-xl font-bold text-text-primary">
                Keyboard Shortcuts Reference
              </h2>
              <p className="text-xs text-text-secondary">
                Navigate SaathiFy quickly without using a mouse
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-raised focus-visible:ring-2"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-raised/50 text-text-secondary">
                <th scope="col" className="py-2 px-3 font-semibold">Shortcut</th>
                <th scope="col" className="py-2 px-3 font-semibold">Action</th>
                <th scope="col" className="py-2 px-3 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {HOTKEY_DEFINITIONS.map((def, idx) => (
                <tr key={idx} className="hover:bg-surface-raised/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-surface-raised text-text-primary border border-border rounded shadow-sm">
                      {def.keyCombo}
                    </kbd>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-text-primary">{def.actionName}</div>
                    <div className="text-xs text-text-secondary">{def.description}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-saathi-mist/40 text-text-primary">
                      {def.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-fg hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
