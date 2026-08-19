import { useState } from 'react';
import './Newsletter.css';

export default function Newsletter({ variant = 'section' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    // Simulate subscription
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 4000);
    }, 800);
  };

  const isSection = variant === 'section';

  return (
    <div className={`newsletter ${isSection ? 'newsletter--section' : 'newsletter--footer'}`}>
      {isSection && (
        <div className="newsletter__content">
          <h2 className="section__title">Join the Club</h2>
          <p className="section__subtitle">
            Be the first to know about new drops, exclusive offers, and insider-only content.
          </p>
        </div>
      )}

      <form className="newsletter__form" onSubmit={handleSubmit}>
        <div className="newsletter__input-wrap">
          <input
            type="email"
            className="newsletter__input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address for newsletter"
            id={`newsletter-email-${variant}`}
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            className={`newsletter__btn ${status === 'success' ? 'newsletter__btn--success' : ''}`}
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' && (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {status === 'success' && '✓'}
            {(status === 'idle' || status === 'error') && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </div>
        {status === 'success' && (
          <p className="newsletter__success animate-fade-up">Thank you for subscribing!</p>
        )}
      </form>
    </div>
  );
}
