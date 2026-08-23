import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAnnounce } from '../../hooks/useAnnounce';

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { announce } = useAnnounce();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    announce('Authentication successful. Redirecting to student portal.', 'polite');
    navigate('/dashboard');
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-saathi-navy text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
          S
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
          {isSignUp ? 'Create Student Account' : 'Sign In to SaathiFy'}
        </h1>
        <p className="text-xs text-text-secondary">
          Access your personalized educational conversion library
        </p>
      </div>

      <div className="bg-surface-raised border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="auth-email" className="text-xs font-bold text-text-primary">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text-primary text-sm focus-visible:ring-2"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password" className="text-xs font-bold text-text-primary">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-secondary absolute left-3 top-3.5" />
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-surface text-text-primary text-sm focus-visible:ring-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 font-bold rounded-lg bg-accent text-accent-fg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
          >
            <span>{isSignUp ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 mt-4 border-t border-border text-center text-xs">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-bold text-accent hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New student? Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
};
