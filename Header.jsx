import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../utils/api';
import AnnouncementBar from '../AnnouncementBar/AnnouncementBar';
import SearchBar from '../SearchBar/SearchBar';
import MobileNav from './MobileNav';
import MegaMenu from './MegaMenu';
import './Header.css';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop', hasMega: true },
  { label: 'New Arrivals', path: '/shop?sort=newest' },
  { label: 'Best Sellers', path: '/shop?tag=bestseller' },
];

export default function Header() {
  const { itemCount, toggleCart } = useCart();
  const { siteName } = useTheme();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const headerRef = useRef(null);
  const megaTimerRef = useRef(null);

  // Sticky header shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
    setSearchOpen(false);
    setMegaMenuOpen(false);
  }, [location.pathname]);

  // Fetch categories for mega menu
  useEffect(() => {
    api.get('/categories')
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const handleMegaEnter = () => {
    clearTimeout(megaTimerRef.current);
    setMegaMenuOpen(true);
  };

  const handleMegaLeave = () => {
    megaTimerRef.current = setTimeout(() => setMegaMenuOpen(false), 150);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`header ${scrolled ? 'header--scrolled' : ''}`}
        role="banner"
      >
        <AnnouncementBar />
        <div className="header__inner container">
          {/* Mobile hamburger */}
          <button
            className="header__hamburger"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            id="header-hamburger"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>

          {/* Logo */}
          <Link to="/" className="header__logo" id="header-logo">
            {siteName}
          </Link>

          {/* Desktop Navigation */}
          <nav className="header__nav" role="navigation" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <div
                key={link.path}
                onMouseEnter={() => link.hasMega && handleMegaEnter()}
                onMouseLeave={() => link.hasMega && handleMegaLeave()}
                className="header__nav-item"
              >
                <Link
                  to={link.path}
                  className={`header__nav-link link-underline ${
                    location.pathname === link.path ? 'header__nav-link--active' : ''
                  }`}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="header__actions">
            {/* Search */}
            <button
              className="header__action-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              id="header-search-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Account */}
            <Link
              to="/login"
              className="header__action-btn"
              aria-label="Account"
              id="header-account-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            {/* Cart */}
            <button
              className="header__action-btn header__cart-btn"
              onClick={toggleCart}
              aria-label={`Cart (${itemCount} items)`}
              id="header-cart-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className="header__cart-count" key={itemCount}>
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Mega Menu Dropdown */}
        <MegaMenu
          isOpen={megaMenuOpen}
          onClose={() => setMegaMenuOpen(false)}
          categories={categories}
          onMouseEnter={handleMegaEnter}
          onMouseLeave={handleMegaLeave}
        />
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        navLinks={NAV_LINKS}
      />
    </>
  );
}
