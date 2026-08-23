import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Keyboard } from 'lucide-react';

interface FooterProps {
  onOpenHotkeys?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHotkeys }) => {
  return (
    <footer className="bg-surface-raised border-t border-border mt-auto text-text-secondary text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Brand */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-saathi-navy text-white font-extrabold text-sm flex items-center justify-center">
              S
            </div>
            <span className="text-xl font-bold text-text-primary">
              Saathi<span className="text-saathi-amber-text">Fy</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            Learn. Grow. Belong. Empowering every student with accessible, personalized multimodal learning experiences.
          </p>
          <div className="flex items-center space-x-2 text-xs font-semibold text-success pt-1">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>WCAG 2.2 AA Certified Design</span>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Platform</h3>
          <ul className="space-y-2 text-xs">
            <li><Link to="/features" className="hover:text-accent transition-colors">Features & Matrix</Link></li>
            <li><Link to="/how-it-works" className="hover:text-accent transition-colors">How It Works</Link></li>
            <li><Link to="/accessibility" className="hover:text-accent transition-colors">Accessibility Statement</Link></li>
            <li><Link to="/about" className="hover:text-accent transition-colors">About Mission</Link></li>
          </ul>
        </div>

        {/* Col 3: Student Tools */}
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Student Tools</h3>
          <ul className="space-y-2 text-xs">
            <li><Link to="/dashboard" className="hover:text-accent transition-colors">Student Dashboard</Link></li>
            <li><Link to="/library" className="hover:text-accent transition-colors">Document Library</Link></li>
            <li><Link to="/live" className="hover:text-accent transition-colors">Live ISL Studio</Link></li>
            <li><Link to="/dictate" className="hover:text-accent transition-colors">Voice Dictation</Link></li>
            <li><Link to="/settings" className="hover:text-accent transition-colors">Accessibility Settings</Link></li>
          </ul>
        </div>

        {/* Col 4: Hotkeys & Support */}
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Accessibility Support</h3>
          <p className="text-xs mb-3 text-text-secondary">
            Full keyboard navigation supported across all surfaces. Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-border rounded">?</kbd> anywhere to view hotkeys.
          </p>
          {onOpenHotkeys && (
            <button
              onClick={onOpenHotkeys}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-border bg-surface text-text-primary hover:bg-surface-raised transition-colors flex items-center space-x-1.5"
            >
              <Keyboard className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              <span>View Keyboard Shortcuts</span>
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface px-4 py-4 text-center text-xs text-text-secondary flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto">
        <p>© 2026 SaathiFy Platform. Built with accessibility first for visually, hearing, motor, and neurodivergent learners.</p>
        <p className="flex items-center justify-center space-x-1 mt-2 sm:mt-0">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-danger fill-danger" aria-hidden="true" />
          <span>for inclusive education</span>
        </p>
      </div>
    </footer>
  );
};
