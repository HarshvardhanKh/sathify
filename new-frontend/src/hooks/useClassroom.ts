import { useCallback, useEffect, useRef, useState } from 'react';

export type ClassroomRole = 'teacher' | 'student';

/** Real WebSocket connection to the backend's in-memory classroom room —
 * not simulated. Each hook instance owns its own socket (a room join is a
 * deliberate, explicit user action, unlike the singleton ISL socket). */
export function useClassroom() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [role, setRole] = useState<ClassroomRole | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const join = useCallback((id: string, asRole: ClassroomRole) => {
    wsRef.current?.close();
    const ws = new WebSocket(`ws://localhost:8000/ws/classroom/${id}?role=${asRole}`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'SLIDE_CHANGE') setCurrentSlide(data.slide);
      } catch {
        // ignore malformed frames
      }
    };
    wsRef.current = ws;
    setRoomId(id);
    setRole(asRole);
  }, []);

  const leave = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setRoomId(null);
    setRole(null);
    setConnected(false);
  }, []);

  const changeSlide = useCallback((slide: number) => {
    if (wsRef.current && role === 'teacher') {
      wsRef.current.send(JSON.stringify({ type: 'SLIDE_CHANGE', slide }));
    }
  }, [role]);

  useEffect(() => () => wsRef.current?.close(), []);

  return { roomId, role, currentSlide, connected, join, leave, changeSlide };
}
