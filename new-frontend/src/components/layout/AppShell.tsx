import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AccessibilityQuickToggle } from '../ui/AccessibilityQuickToggle';
import { useAnnounce } from '../../hooks/useAnnounce';
import {
  Home,
  Library,
  Radio,
  Mic,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  onOpenHotkeys?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, onOpenHotkeys }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { announce } = useAnnounce();
  const mainRef = useRef<HTMLElement>(null);

  const navigationItems = [
    { label: 'Home', path: '/', icon: Home, shortcut: 'Alt+H' },
    { label: 'ISL Avatar', path: '/live', icon: Radio, shortcut: 'Alt+1' },
    { label: 'Dost AI', path: '/dost', icon: GraduationCap, shortcut: 'Alt+2' },
    { label: 'Documents', path: '/library', icon: Library, shortcut: 'Alt+3' },
    { label: 'Voice Notes', path: '/dictate', icon: Mic, shortcut: 'Alt+4' },
    { label: 'Settings', path: '/settings', icon: Settings, shortcut: 'Alt+5' },
  ];

  // Route title mapping and focus management
  useEffect(() => {
    const titleMap: Record<string, string> = {
      '/': 'Home — SaathiFy',
      '/features': 'Features — SaathiFy',
      '/how-it-works': 'How It Works — SaathiFy',
      '/accessibility': 'Accessibility Statement — SaathiFy',
      '/about': 'About Us — SaathiFy',
      '/contact': 'Contact Us — SaathiFy',
      '/auth': 'Sign In — SaathiFy',
      '/onboarding': 'Accessibility Setup — SaathiFy',
      '/dashboard': 'Dashboard — SaathiFy',
      '/library': 'Document Library — SaathiFy',
      '/live': 'Live ISL Session — SaathiFy',
      '/dictate': 'Voice Dictation — SaathiFy',
      '/dost': 'Dost AI — SaathiFy',
      '/settings': 'Accessibility Settings — SaathiFy',
    };

    const currentPath = location.pathname;
    let pageName = 'Page';

    if (titleMap[currentPath]) {
      document.title = titleMap[currentPath]!;
      pageName = titleMap[currentPath]!.split('—')[0]?.trim() || 'Page';
    } else if (currentPath.startsWith('/read/')) {
      document.title = 'Document Reader — SaathiFy';
      pageName = 'Document Reader';
    } else {
      document.title = 'SaathiFy — Learn. Grow. Belong.';
    }

    // Move focus to main element on route change
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }

    // Announce page change to screen reader
    announce(`${pageName}, loaded`, 'polite');
  }, [location.pathname, announce]);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-text-primary">
      {/* Top Global Quick Toggle Bar */}
      <AccessibilityQuickToggle onOpenHotkeys={onOpenHotkeys} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav Rail */}
        <aside
          aria-label="Application Navigation Rail"
          className={`bg-surface-raised border-r border-border flex flex-col transition-all duration-200 shrink-0 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Logo & Rail Toggle */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            {!isCollapsed && (
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-saathi-navy text-white font-black flex items-center justify-center text-base shadow-sm">
                  S
                </div>
                <span className="font-extrabold text-lg tracking-tight text-text-primary">
                  Saathi<span className="text-saathi-amber-text">Fy</span>
                </span>
              </Link>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
              aria-expanded={!isCollapsed}
              className={`p-1.5 rounded-lg border border-border bg-surface text-text-primary hover:bg-surface-raised focus-visible:ring-2 ${
                isCollapsed ? 'mx-auto' : ''
              }`}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Student App Navigation" className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path === '/library' && location.pathname.startsWith('/read/'));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors group ${
                    isActive
                      ? 'bg-accent text-accent-fg font-bold shadow-xs'
                      : 'text-text-primary hover:bg-surface/80 hover:text-accent'
                  } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent-fg' : 'text-accent'}`} aria-hidden="true" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'border-accent-fg/30 text-accent-fg bg-accent-fg/10'
                          : 'border-border text-text-secondary bg-surface'
                      }`}
                    >
                      {item.shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer of Sidebar */}
          <div className="p-3 border-t border-border space-y-1">
            {onOpenHotkeys && !isCollapsed && (
              <button
                onClick={onOpenHotkeys}
                className="w-full px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-accent" />
                  <span>Shortcuts Sheet</span>
                </div>
                <kbd className="px-1 font-mono text-[10px] border border-border rounded bg-surface">?</kbd>
              </button>
            )}

            <Link
              to="/"
              className={`flex items-center px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10 rounded-lg transition-colors ${
                isCollapsed ? 'justify-center' : 'space-x-2'
              }`}
              aria-label="Exit Student Portal to Public Homepage"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>Exit to Marketing</span>}
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className="flex-1 p-4 sm:p-6 lg:p-8 outline-none transition-opacity duration-150"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
