import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AccessibilityQuickToggle } from '../ui/AccessibilityQuickToggle';
import { User, Menu, X, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenHotkeys?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHotkeys }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Accessibility', path: '/accessibility' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-border shadow-xs">
      <AccessibilityQuickToggle onOpenHotkeys={onOpenHotkeys} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          aria-label="SaathiFy Home Page"
          className="flex items-center space-x-3 group focus-visible:ring-2 rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saathi-navy to-saathi-blue flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-text-primary block leading-none">
              Saathi<span className="text-saathi-amber-text">Fy</span>
            </span>
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider block mt-0.5">
              Learn. Grow. Belong.
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-fg font-bold'
                    : 'text-text-primary hover:bg-surface-raised hover:text-accent'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link
            to="/auth"
            className="px-4 py-2 text-sm font-semibold border border-border rounded-lg text-text-primary hover:bg-surface-raised transition-colors flex items-center space-x-1.5"
          >
            <User className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Sign In</span>
          </Link>
          <Link
            to="/onboarding"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-fg hover:opacity-90 transition-opacity shadow-sm flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>Get Started</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="md:hidden p-2 text-text-primary rounded-lg hover:bg-surface-raised focus-visible:ring-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-b border-border bg-surface px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-semibold rounded-lg text-text-primary hover:bg-surface-raised"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex flex-col space-y-2">
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2 text-sm font-semibold border border-border rounded-lg text-text-primary"
            >
              Sign In
            </Link>
            <Link
              to="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-fg"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
