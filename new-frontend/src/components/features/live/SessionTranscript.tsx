import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { Copy, Download, FileText, Check } from 'lucide-react';
import { useAnnounce } from '../../../hooks/useAnnounce';

export const SessionTranscript: React.FC = () => {
  const finals = useAppStore((s) => s.transcript.finals);
  const [copied, setCopied] = React.useState(false);
  const { announce } = useAnnounce();

  const handleCopy = () => {
    const text = finals.map((f) => `[${new Date(f.timestamp).toLocaleTimeString()}] ${f.speaker}: ${f.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    announce('Transcript copied to clipboard.', 'polite');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = finals.map((f) => `[${new Date(f.timestamp).toLocaleTimeString()}] ${f.speaker}: ${f.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `saathify-lecture-transcript-${Date.now()}.txt`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    announce('Plain text transcript downloaded.', 'polite');
  };

  const handleDownloadVtt = () => {
    // Basic WebVTT format generator
    let vtt = 'WEBVTT\n\n';
    finals.forEach((f, idx) => {
      const startSec = idx * 5;
      const endSec = (idx + 1) * 5;
      const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}.000`;
      };
      vtt += `${idx + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n<v ${f.speaker}>${f.text}\n\n`;
    });

    const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `saathify-lecture-captions-${Date.now()}.vtt`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    announce('WebVTT caption tracks downloaded.', 'polite');
  };

  return (
    <div
      role="region"
      aria-label="Lecture stream caption recording actions"
      className="bg-surface-raised border border-border rounded-xl p-5 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">
          Committed Lecture Transcript Log
        </h2>
        <span className="text-xs font-semibold text-text-secondary">
          {finals.length} sentences captured
        </span>
      </div>

      {finals.length > 0 ? (
        <div className="space-y-4 text-xs">
          <div
            tabIndex={0}
            className="max-h-60 overflow-y-auto bg-surface border border-border rounded-lg p-3 space-y-2 font-mono"
          >
            {finals.slice().reverse().map((item) => (
              <div key={item.id} className="text-text-primary leading-relaxed">
                <span className="text-accent font-bold">
                  [{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                </span>{' '}
                <strong className="text-saathi-navy">{item.speaker}:</strong> {item.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleCopy}
              className="px-4 py-2 font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1.5 focus-visible:ring-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-accent" />}
              <span>{copied ? 'Copied' : 'Copy Log'}</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="px-4 py-2 font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1.5 focus-visible:ring-2"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={handleDownloadVtt}
              className="px-4 py-2 font-bold rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised flex items-center space-x-1.5 focus-visible:ring-2"
            >
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>Download .vtt Track</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-secondary italic text-center py-6">
          Committed lecture captions will appear here once audio recording starts.
        </p>
      )}
    </div>
  );
};
export default SessionTranscript;
