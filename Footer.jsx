import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Newsletter from '../Newsletter/Newsletter';
import './Footer.css';

const QUICK_LINKS = [
  { label: 'Shop All', path: '/shop' },
  { label: 'New Arrivals', path: '/shop?sort=newest' },
  { label: 'Best Sellers', path: '/shop?tag=bestseller' },
  { label: 'T-Shirts', path: '/shop/t-shirts' },
  { label: 'Jeans', path: '/shop/jeans' },
  { label: 'Outerwear', path: '/shop/outerwear' },
];

const POLICY_LINKS = [
  { label: 'About Us', path: '/page/about' },
  { label: 'Privacy Policy', path: '/page/privacy-policy' },
  { label: 'Terms & Conditions', path: '/page/terms-and-conditions' },
  { label: 'Refund Policy', path: '/page/refund-policy' },
  { label: 'Shipping Policy', path: '/page/shipping-policy' },
  { label: 'Contact', path: '/page/contact' },
];

const SOCIAL_ICONS = {
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  twitter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  ),
  pinterest: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.25 2.67 7.87 6.42 9.31-.09-.78-.17-1.99.04-2.84.18-.78 1.2-5.1 1.2-5.1s-.31-.61-.31-1.51c0-1.42.82-2.48 1.84-2.48.87 0 1.29.65 1.29 1.43 0 .87-.56 2.18-.84 3.39-.24 1.01.5 1.83 1.49 1.83 1.79 0 3.17-1.89 3.17-4.61 0-2.41-1.73-4.1-4.21-4.1-2.87 0-4.55 2.15-4.55 4.37 0 .87.33 1.79.75 2.3.08.1.09.19.07.29l-.28 1.13c-.04.19-.15.23-.35.14-1.31-.61-2.13-2.53-2.13-4.07 0-3.31 2.41-6.36 6.94-6.36 3.65 0 6.48 2.6 6.48 6.07 0 3.62-2.28 6.53-5.45 6.53-1.06 0-2.06-.55-2.4-1.2l-.65 2.49c-.24.91-.88 2.05-1.32 2.74.99.31 2.04.47 3.13.47 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  ),
  whatsapp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  ),
};

export default function Footer() {
  const { siteName, getSetting } = useTheme();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const socialLinks = {
    instagram: getSetting('social', 'instagram_url', ''),
    facebook: getSetting('social', 'facebook_url', ''),
    twitter: getSetting('social', 'twitter_url', ''),
    youtube: getSetting('social', 'youtube_url', ''),
    pinterest: getSetting('social', 'pinterest_url', ''),
  };

  const whatsappNumber = getSetting('general', 'whatsapp_number', '');
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';

  const hasSocial = Object.values(socialLinks).some(Boolean) || whatsappUrl;

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner container">
        <div className="footer__grid">
          {/* Brand Column */}
          <div className="footer__col footer__col--brand">
            <Link to="/" className="footer__logo">{siteName}</Link>
            <p className="footer__tagline">
              Premium clothing for the modern individual. Quality fabrics, timeless designs.
            </p>
            {hasSocial && (
              <div className="footer__social">
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Instagram">
                    {SOCIAL_ICONS.instagram}
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Facebook">
                    {SOCIAL_ICONS.facebook}
                  </a>
                )}
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Twitter">
                    {SOCIAL_ICONS.twitter}
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="YouTube">
                    {SOCIAL_ICONS.youtube}
                  </a>
                )}
                {socialLinks.pinterest && (
                  <a href={socialLinks.pinterest} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Pinterest">
                    {SOCIAL_ICONS.pinterest}
                  </a>
                )}
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="WhatsApp">
                    {SOCIAL_ICONS.whatsapp}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h3 className="footer__heading footer__heading--desktop">Shop</h3>
            <button
              className="footer__col-toggle"
              onClick={() => toggleSection('shop')}
              aria-expanded={expandedSection === 'shop'}
            >
              <span className="footer__heading">Shop</span>
              <svg className={`footer__chevron ${expandedSection === 'shop' ? 'footer__chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <ul className={`footer__links ${expandedSection === 'shop' ? 'footer__links--open' : ''}`}>
              {QUICK_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer__link link-underline">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Links */}
          <div className="footer__col">
            <h3 className="footer__heading footer__heading--desktop">Information</h3>
            <button
              className="footer__col-toggle"
              onClick={() => toggleSection('info')}
              aria-expanded={expandedSection === 'info'}
            >
              <span className="footer__heading">Information</span>
              <svg className={`footer__chevron ${expandedSection === 'info' ? 'footer__chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <ul className={`footer__links ${expandedSection === 'info' ? 'footer__links--open' : ''}`}>
              {POLICY_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer__link link-underline">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer__col footer__col--newsletter">
            <h3 className="footer__heading">Stay Updated</h3>
            <p className="footer__newsletter-text">
              Subscribe for early access to new arrivals and exclusive offers.
            </p>
            <Newsletter variant="footer" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}