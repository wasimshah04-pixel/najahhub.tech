import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../../utils/api';
import { useDebounce } from '../../hooks/useHooks';
import './SearchBar.css';

export default function SearchBar({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 250);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Load popular searches
  useEffect(() => {
    if (isOpen && popular.length === 0) {
      api.get('/search/popular').then(data => setPopular(data.popular || [])).catch(() => {});
    }
  }, [isOpen]);

  // Search as user types
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    Promise.all([
      api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`),
      api.get(`/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`),
    ])
      .then(([searchData, suggestData]) => {
        setResults(searchData.products || []);
        setSuggestions(suggestData.suggestions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSuggestionClick = (term) => {
    navigate(`/shop?search=${encodeURIComponent(term)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-bar" role="search">
      <div className="search-bar__inner container">
        <form className="search-bar__form" onSubmit={handleSubmit}>
          <svg className="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-bar__input"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            id="search-input"
          />
          <button
            type="button"
            className="search-bar__close"
            onClick={onClose}
            aria-label="Close search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </form>

        {/* Results Dropdown */}
        <div className="search-bar__dropdown">
          {/* Loading State */}
          {loading && (
            <div className="search-bar__loading">
              <span className="animate-spin">⟳</span> Searching...
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="search-bar__section">
              <div className="search-bar__section-title">Suggestions</div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="search-bar__suggestion"
                  onClick={() => handleSuggestionClick(s)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Product Results */}
          {results.length > 0 && (
            <div className="search-bar__section">
              <div className="search-bar__section-title">Products</div>
              {results.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="search-bar__result"
                  onClick={onClose}
                >
                  <img
                    src={product.primary_image}
                    alt={product.title}
                    className="search-bar__result-img"
                    loading="lazy"
                  />
                  <div className="search-bar__result-info">
                    <span className="search-bar__result-title">{product.title}</span>
                    <span className="search-bar__result-price">{formatPrice(product.price)}</span>
                  </div>
                </Link>
              ))}
              <button
                className="search-bar__view-all btn btn--outline btn--sm btn--full"
                onClick={handleSubmit}
              >
                View all results
              </button>
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="search-bar__empty">
              No products found for "{query}"
            </div>
          )}

          {/* Popular Searches (when no query) */}
          {query.length < 2 && popular.length > 0 && (
            <div className="search-bar__section">
              <div className="search-bar__section-title">Popular Searches</div>
              <div className="search-bar__tags">
                {popular.map((term, i) => (
                  <button
                    key={i}
                    className="search-bar__tag"
                    onClick={() => handleSuggestionClick(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
