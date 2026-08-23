import React, { useState } from 'react';
import { StickyNote, Plus, Trash2 } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

export interface BlockNote {
  id: string;
  blockId: string;
  text: string;
  createdAt: string;
}

interface NotesPanelProps {
  activeBlockId: string | null;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ activeBlockId }) => {
  const [notes, setNotes] = useState<BlockNote[]>([
    {
      id: 'n-1',
      blockId: 'blk-2',
      text: 'Important exam question: ALU executes boolean operations directly inside CPU registers.',
      createdAt: '2026-08-22',
    },
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const { announce } = useAnnounce();

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const note: BlockNote = {
      id: `n-${Date.now()}`,
      blockId: activeBlockId || 'general',
      text: newNoteText,
      createdAt: new Date().toISOString().split('T')[0] ?? '2026-08-23',
    };

    setNotes([note, ...notes]);
    setNewNoteText('');
    announce(`Study note added for block ${note.blockId}.`, 'polite');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    announce('Study note deleted.', 'polite');
  };

  return (
    <div
      role="region"
      aria-label="Student Study Notes & Block Highlights"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center space-x-2 border-b border-border pb-3">
        <StickyNote className="w-5 h-5 text-accent" aria-hidden="true" />
        <div>
          <h2 className="font-extrabold text-base text-text-primary">Study Notes & Highlights</h2>
          <p className="text-xs text-text-secondary">Keyboard-createable notes attached to course blocks</p>
        </div>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-2">
        <label htmlFor="new-note-textarea" className="text-xs font-bold text-text-primary block">
          Add Note for {activeBlockId ? `Block [${activeBlockId}]` : 'Selected Block'}:
        </label>
        <textarea
          id="new-note-textarea"
          rows={3}
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Type study note or summary here... (No mouse drag-select required)"
          className="w-full p-2.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus-visible:ring-2"
        />
        <button
          type="submit"
          className="w-full py-2 font-bold text-xs rounded-lg bg-accent text-accent-fg hover:opacity-90 flex items-center justify-center space-x-1 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Save Note to Block</span>
        </button>
      </form>

      {/* Saved Notes List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto">
        {notes.map((note) => (
          <div key={note.id} className="p-3 rounded-lg bg-surface border border-border text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] text-text-secondary">
              <span className="font-mono font-bold text-accent">Block: {note.blockId}</span>
              <span>{note.createdAt}</span>
            </div>
            <p className="text-text-primary font-medium">{note.text}</p>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => handleDeleteNote(note.id)}
                aria-label={`Delete note for block ${note.blockId}`}
                className="text-danger hover:underline text-[11px] flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-xs text-text-secondary italic text-center py-4">
            No study notes added yet. Select a text block and type your note above.
          </p>
        )}
      </div>
    </div>
  );
};
