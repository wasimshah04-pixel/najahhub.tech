import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './AnnouncementBar.css';

export default function AnnouncementBar() {
  const { getSetting } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  const enabled = getSetting('announcement', 'announcement_enabled', '1');
  const text = getSetting(
    'announcement',
    'announcement_text',
    '✨ SPECIAL OFFER: GET 20% OFF YOUR FIRST ORDER — USE CODE: WELCOME10'
  );
  const link = getSetting('announcement', 'announcement_link', '/shop');
  const bgColor = getSetting('announcement', 'announcement_bg_color', '#000000');
  const textColor = getSetting('announcement', 'announcement_text_color', '#FFFFFF');

  const isEnabled = enabled === '1' || enabled === 'true' || enabled === true;

  if (!isEnabled || !text || dismissed) {
    return null;
  }

  const isExternalLink = link && (link.startsWith('http://') || link.startsWith('https://'));
  const isInternalLink = link && link.startsWith('/');

  return (
    <div
      className="announcement-bar"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      role="region"
      aria-label="Announcement"
    >
      <div className="announcement-bar__inner container">
        <div className="announcement-bar__content">
          {isInternalLink ? (
            <Link to={link} className="announcement-bar__link" style={{ color: textColor }}>
              <span>{text}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : isExternalLink ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="announcement-bar__link"
              style={{ color: textColor }}
            >
              <span>{text}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          ) : (
            <span className="announcement-bar__text">{text}</span>
          )}
        </div>

        <button
          className="announcement-bar__close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          style={{ color: textColor }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
