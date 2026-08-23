import React, { useState, useRef, useEffect } from 'react';
import { Send, GraduationCap, Smile, AlertTriangle, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { api } from '../../../services/api';
import { useAnnounce } from '../../../hooks/useAnnounce';
import { SpeechToTextService } from '../../../services/speechToText';

type DostMode = 'teacher' | 'friend';
type DostLanguage = 'english' | 'hindi' | 'hinglish';

interface ChatMessage {
  id: string;
  role: 'user' | 'dost';
  text: string;
  available?: boolean;
}

export const DostChat: React.FC = () => {
  const [mode, setMode] = useState<DostMode>('teacher');
  const [age, setAge] = useState(18);
  const [language, setLanguage] = useState<DostLanguage>('english');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const { announce } = useAnnounce();
  const listRef = useRef<HTMLDivElement>(null);
  const sttRef = useRef<SpeechToTextService | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    const stt = new SpeechToTextService();
    sttRef.current = stt;

    stt.onResult(({ text, isFinal }) => {
      if (isFinal) {
        setInput((prev) => (prev ? `${prev} ${text}` : text).trim());
        setInterimText('');
      } else {
        setInterimText(text);
      }
    });

    stt.onStatusChange((status) => {
      setIsListening(status === 'listening');
    });

    return () => stt.stop();
  }, []);

  const speakResponse = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (messageText?: string) => {
    const message = (messageText || input).trim();
    if (!message || isSending) return;

    // Stop listening when sending
    sttRef.current?.stop();
    setIsListening(false);

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: message }]);
    setInput('');
    setInterimText('');
    setIsSending(true);
    announce('Dost is thinking...', 'polite');

    const result = await api.dostChat({ message, mode, age, language });
    if (result.ok) {
      const responseText = result.value.response;
      setMessages((prev) => [
        ...prev,
        { id: `d-${Date.now()}`, role: 'dost', text: responseText, available: result.value.available },
      ]);
      if (result.value.available) {
        speakResponse(responseText);
        announce('Dost replied.', 'polite');
      } else {
        announce('Dost is unavailable right now.', 'polite');
      }
    } else {
      setMessages((prev) => [
        ...prev,
        { id: `d-${Date.now()}`, role: 'dost', text: `Error: ${result.error.message}`, available: false },
      ]);
    }
    setIsSending(false);
  };

  const toggleListening = () => {
    if (isListening) {
      sttRef.current?.stop();
      // Auto-send if there's text
      if (input.trim()) {
        handleSend();
      }
    } else {
      sttRef.current?.start(language === 'hindi' ? 'hi-IN' : 'en-US');
    }
  };

  return (
    <div className="bg-surface-raised border border-border rounded-xl p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-accent text-accent-fg">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary">Dost AI</h1>
            <p className="text-xs text-text-secondary">Tap the mic and ask your question</p>
          </div>
        </div>

        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          aria-pressed={ttsEnabled}
          className={`p-2 rounded-lg border ${ttsEnabled ? 'bg-accent/20 border-accent text-accent' : 'bg-surface border-border text-text-secondary'}`}
          aria-label={ttsEnabled ? 'Disable voice responses' : 'Enable voice responses'}
        >
          {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Mode & Settings */}
      <div className="flex flex-wrap items-center gap-4 text-xs" role="group" aria-label="Dost settings">
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setMode('teacher')}
            aria-pressed={mode === 'teacher'}
            className={`px-3 py-2 font-bold flex items-center space-x-1.5 ${mode === 'teacher' ? 'bg-accent text-accent-fg' : 'bg-surface text-text-primary'}`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>
          <button
            onClick={() => setMode('friend')}
            aria-pressed={mode === 'friend'}
            className={`px-3 py-2 font-bold flex items-center space-x-1.5 ${mode === 'friend' ? 'bg-accent text-accent-fg' : 'bg-surface text-text-primary'}`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Friend</span>
          </button>
        </div>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as DostLanguage)}
          className="bg-surface text-text-primary border border-border rounded-lg p-2 font-semibold text-xs"
          aria-label="Response language"
        >
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="hinglish">Hinglish</option>
        </select>

        <label className="flex items-center gap-2 font-bold text-text-primary">
          Age: <span className="font-mono text-accent">{age}</span>
          <input
            type="range"
            min={10}
            max={60}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            aria-label="Learner age"
            className="w-20"
          />
        </label>
      </div>

      {/* Big Voice Button */}
      <div className="flex flex-col items-center py-6">
        <button
          onClick={toggleListening}
          disabled={isSending}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? 'bg-danger text-white animate-pulse scale-110'
              : 'bg-accent text-accent-fg hover:scale-105'
          } disabled:opacity-50`}
          aria-label={isListening ? 'Stop listening and send' : 'Start speaking'}
        >
          {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
        </button>
        <p className="mt-3 text-sm text-text-secondary">
          {isListening ? 'Listening... tap to send' : isSending ? 'Thinking...' : 'Tap to speak'}
        </p>
        {(interimText || (isListening && input)) && (
          <p className="mt-2 text-sm text-text-primary italic max-w-md text-center">
            "{interimText || input}"
          </p>
        )}
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with Dost"
        className="h-64 overflow-y-auto space-y-3 p-4 bg-surface border border-border rounded-xl"
      >
        {messages.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">
            Tap the microphone and ask Dost anything!
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-accent text-accent-fg'
                  : m.available === false
                  ? 'bg-danger/10 border border-danger text-text-primary'
                  : 'bg-surface-raised border border-border text-text-primary'
              }`}
            >
              {m.available === false && (
                <div className="flex items-center gap-1.5 text-danger font-bold text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Unavailable</span>
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Text Input (secondary) */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Or type here..."
          className="flex-1 p-3 rounded-xl border border-border bg-surface text-text-primary text-sm focus-visible:ring-2"
        />
        <button
          onClick={() => handleSend()}
          disabled={isSending || !input.trim()}
          aria-label="Send message"
          className="p-3 rounded-xl bg-accent text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
