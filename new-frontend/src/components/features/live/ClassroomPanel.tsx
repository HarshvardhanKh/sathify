import React, { useState } from 'react';
import { Users, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { api } from '../../../services/api';
import { useClassroom } from '../../../hooks/useClassroom';

export const ClassroomPanel: React.FC = () => {
  const { roomId, role, currentSlide, connected, join, leave, changeSlide } = useClassroom();
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleCreateAndJoinAsTeacher = async () => {
    const result = await api.createClassroomRoom();
    if (result.ok) join(result.value.roomId, 'teacher');
  };

  const handleJoinAsStudent = () => {
    if (joinRoomId.trim()) join(joinRoomId.trim(), 'student');
  };

  return (
    <div
      role="region"
      aria-label="Live classroom synchronization"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs space-y-4"
    >
      <h2 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
        <Users className="w-4 h-4 text-accent" /> Live Classroom Sync
      </h2>

      {!roomId ? (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            onClick={handleCreateAndJoinAsTeacher}
            className="px-4 py-2 font-bold rounded-lg bg-accent text-accent-fg hover:opacity-90 shadow-xs"
          >
            Create Room (Teacher)
          </button>
          <span className="text-text-secondary">or</span>
          <input
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Room ID"
            aria-label="Room ID to join as student"
            className="p-2 rounded-lg border border-border bg-surface text-text-primary font-mono w-28"
          />
          <button
            onClick={handleJoinAsStudent}
            disabled={!joinRoomId.trim()}
            className="px-4 py-2 font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised disabled:opacity-50"
          >
            Join (Student)
          </button>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text-primary">
              Room <span className="font-mono text-accent">{roomId}</span> — {role === 'teacher' ? 'Teacher' : 'Student'} —{' '}
              <span className={connected ? 'text-success' : 'text-danger'}>{connected ? 'Connected' : 'Disconnected'}</span>
            </span>
            <button
              onClick={leave}
              aria-label="Leave classroom"
              className="px-3 py-1.5 font-bold rounded-lg bg-danger/10 text-danger border border-danger/40 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Leave
            </button>
          </div>

          <div className="p-4 bg-surface border border-border rounded-lg text-center space-y-2">
            <p className="text-text-secondary">Accessible Outline</p>
            <p className="text-2xl font-extrabold text-text-primary">Slide {currentSlide}</p>
          </div>

          {role === 'teacher' && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => changeSlide(Math.max(0, currentSlide - 1))}
                aria-label="Previous slide"
                className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-raised"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeSlide(currentSlide + 1)}
                aria-label="Next slide"
                className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-raised"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
