import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MobileNav.css';

export default function MobileNav({ isOpen, onClose, navLinks }) {
  const location = useLocation();
  const drawerRef = useRef(null);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('scroll-locked');
    } else {
      document.body.classList.remove('scroll-locked');
    }
    return () => document.body.classList.remove('scroll-locked');
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="mobile-nav-overlay" onClick={onClose}>
      <nav
        ref={drawerRef}
        className="mobile-nav"
        onClick={(e) => e.stopPropagation()}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Close Button */}
        <div className="mobile-nav__header">
          <span className="mobile-nav__title">Menu</span>
          <button
            className="mobile-nav__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="mobile-nav__links">
          {navLinks.map((link, i) => (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-nav__link ${
                location.pathname === link.path ? 'mobile-nav__link--active' : ''
              }`}
              onClick={onClose}
              style={{ animationDelay: `${(i + 1) * 50}ms` }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Account Links */}
        <div className="mobile-nav__footer">
          <Link to="/login" className="mobile-nav__footer-link" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Account
          </Link>
        </div>
      </nav>
    </div>
  );
}
