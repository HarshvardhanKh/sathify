import React, { useState, useRef } from 'react';
import { Send, Check, AlertCircle } from 'lucide-react';
import { useAnnounce } from '../../hooks/useAnnounce';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitted, setSubmitted] = useState(false);
  
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const { announce } = useAnnounce();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; message?: string } = {};

    if (!name.trim()) newErrors.name = 'Please enter your full name.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Please enter a valid email address.';
    if (!message.trim() || message.length < 10) newErrors.message = 'Please enter a message at least 10 characters long.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      announce('Form submission failed. Please correct the errors listed in the error summary.', 'assertive');
      setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 50);
      return;
    }

    setErrors({});
    setSubmitted(true);
    announce('Thank you! Your message has been received.', 'polite');
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
          Contact Accessibility & Support
        </h1>
        <p className="text-base text-text-secondary">
          We welcome questions, feature suggestions, and accessibility barrier reports.
        </p>
      </div>

      <div className="bg-surface-raised border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-success text-white flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Message Received</h2>
            <p className="text-xs text-text-secondary">
              Our accessibility team will review your report and respond within 24 business hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Error Summary Box */}
            {Object.keys(errors).length > 0 && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                aria-labelledby="error-summary-heading"
                className="p-4 rounded-xl bg-danger/10 border-2 border-danger text-text-primary space-y-2 focus-visible:outline-none"
              >
                <div className="flex items-center space-x-2 text-danger font-bold text-sm">
                  <AlertCircle className="w-5 h-5" aria-hidden="true" />
                  <h2 id="error-summary-heading">Form Submission Errors ({Object.keys(errors).length})</h2>
                </div>
                <ul className="list-disc pl-5 text-xs text-danger font-semibold space-y-1">
                  {errors.name && (
                    <li>
                      <a href="#contact-name" className="underline hover:opacity-80">
                        Name: {errors.name}
                      </a>
                    </li>
                  )}
                  {errors.email && (
                    <li>
                      <a href="#contact-email" className="underline hover:opacity-80">
                        Email: {errors.email}
                      </a>
                    </li>
                  )}
                  {errors.message && (
                    <li>
                      <a href="#contact-message" className="underline hover:opacity-80">
                        Message: {errors.message}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Field 1: Name */}
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="text-xs font-bold text-text-primary block">
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
                className={`w-full p-3 rounded-lg border bg-surface text-text-primary text-sm focus-visible:ring-2 ${
                  errors.name ? 'border-danger' : 'border-border'
                }`}
              />
              {errors.name && (
                <p id="contact-name-error" className="text-xs font-bold text-danger">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Field 2: Email */}
            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="text-xs font-bold text-text-primary block">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'contact-email-error' : undefined}
                className={`w-full p-3 rounded-lg border bg-surface text-text-primary text-sm focus-visible:ring-2 ${
                  errors.email ? 'border-danger' : 'border-border'
                }`}
              />
              {errors.email && (
                <p id="contact-email-error" className="text-xs font-bold text-danger">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Field 3: Message */}
            <div className="space-y-1.5">
              <label htmlFor="contact-message" className="text-xs font-bold text-text-primary block">
                Your Message or Barrier Report <span className="text-danger">*</span>
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
                className={`w-full p-3 rounded-lg border bg-surface text-text-primary text-sm focus-visible:ring-2 ${
                  errors.message ? 'border-danger' : 'border-border'
                }`}
              />
              {errors.message && (
                <p id="contact-message-error" className="text-xs font-bold text-danger">
                  {errors.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 font-bold text-sm rounded-lg bg-accent text-accent-fg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Submit Accessibility Report</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
