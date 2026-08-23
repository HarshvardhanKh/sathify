import { useEffect, useState, useCallback, useRef } from 'react';
import { voiceCommandManager, VoiceCommandStatus } from '../services/accessibility/voiceCommands';

/** Opt-in only, per the explicit requirement — never starts listening on its own. */
export function useVoiceCommands() {
  const [status, setStatus] = useState<VoiceCommandStatus>('off');
  const [lastHeard, setLastHeard] = useState<string | undefined>();
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubRef.current = voiceCommandManager.onStatusChange((s, heard) => {
      setStatus(s);
      setLastHeard(heard);
    });
    return () => {
      unsubRef.current?.();
      voiceCommandManager.stop();
    };
  }, []);

  const enable = useCallback(() => voiceCommandManager.start(), []);
  const disable = useCallback(() => voiceCommandManager.stop(), []);

  return { status, lastHeard, enable, disable, isListening: status === 'listening' };
}
