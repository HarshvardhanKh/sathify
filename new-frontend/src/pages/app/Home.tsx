import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, GraduationCap, FileText, Mic, Settings, ExternalLink, Loader2 } from 'lucide-react';
import { useAnnounce } from '../../hooks/useAnnounce';

export const Home: React.FC = () => {
  const [isLaunchingAvatar, setIsLaunchingAvatar] = useState(false);
  const { announce } = useAnnounce();

  const handleLaunchAvatar = async () => {
    setIsLaunchingAvatar(true);
    announce('Starting ISL Avatar system...', 'polite');

    try {
      // Start the backend pipeline
      await fetch('http://localhost:8000/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'system_audio' }),
      });

      // Open the avatar in a popup window (always on top via window features)
      const popup = window.open(
        'http://localhost:5174/',
        'ISL Avatar',
        'width=360,height=540,alwaysRaised=yes,toolbar=no,menubar=no,location=no,status=no'
      );

      if (popup) {
        // When popup closes, stop the pipeline
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            fetch('http://localhost:8000/api/pipeline/stop', { method: 'POST' });
            announce('ISL Avatar closed', 'polite');
          }
        }, 1000);
      }

      announce('ISL Avatar launched! Play any audio on your computer.', 'assertive');
    } catch (e) {
      announce('Failed to start ISL system. Is the backend running?', 'assertive');
    }

    setIsLaunchingAvatar(false);
  };

  const features = [
    {
      icon: Radio,
      title: 'Live ISL Avatar',
      description: 'Real-time speech to Indian Sign Language translation with 3D avatar',
      action: handleLaunchAvatar,
      isButton: true,
      highlight: true,
    },
    {
      icon: GraduationCap,
      title: 'Dost AI',
      description: 'Voice-powered AI study companion - just speak your questions',
      link: '/dost',
    },
    {
      icon: FileText,
      title: 'Document Converter',
      description: 'Convert PDFs and slides into accessible, readable formats',
      link: '/library',
    },
    {
      icon: Mic,
      title: 'Voice Notes',
      description: 'Speech-to-text dictation for hands-free note taking',
      link: '/dictate',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-extrabold text-text-primary">
          Saathi<span className="text-accent">Fy</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Accessible learning for everyone. Convert content, get AI help, and experience real-time sign language translation.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const content = (
            <div
              className={`p-6 rounded-2xl border transition-all h-full ${
                feature.highlight
                  ? 'bg-accent/10 border-accent hover:bg-accent/20'
                  : 'bg-surface-raised border-border hover:border-accent/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${feature.highlight ? 'bg-accent text-accent-fg' : 'bg-surface border border-border'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    {feature.title}
                    {feature.isButton && <ExternalLink className="w-4 h-4 text-text-secondary" />}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">{feature.description}</p>
                </div>
              </div>
            </div>
          );

          if (feature.isButton) {
            return (
              <button
                key={feature.title}
                onClick={feature.action}
                disabled={isLaunchingAvatar}
                className="text-left w-full disabled:opacity-70"
              >
                {isLaunchingAvatar ? (
                  <div className="p-6 rounded-2xl border bg-accent/10 border-accent flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    <span className="font-bold text-accent">Launching ISL Avatar...</span>
                  </div>
                ) : (
                  content
                )}
              </button>
            );
          }

          return (
            <Link key={feature.title} to={feature.link!} className="block">
              {content}
            </Link>
          );
        })}
      </div>

      {/* Quick Settings */}
      <div className="flex justify-center pt-4">
        <Link
          to="/settings"
          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings className="w-4 h-4" />
          Accessibility Settings
        </Link>
      </div>
    </div>
  );
};

export default Home;
