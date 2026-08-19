import { useState } from 'react';
import './FilterPanel.css';

const AVAILABILITY = [
  { label: 'All Items', value: '' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

export default function FilterPanel({
  categories = [],
  filters = {},
  onFilterChange,
  onClearFilters,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const [expanded, setExpanded] = useState({
    categories: true,
    price: true,
    availability: true,
  });

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters =
    filters.category ||
    filters.min_price ||
    filters.max_price ||
    filters.availability;

  const content = (
    <aside className="filter-panel">
      <div className="filter-panel__header">
        <h2 className="filter-panel__title">Filters</h2>
        {hasActiveFilters && (
          <button className="filter-panel__clear btn btn--ghost btn--sm" onClick={onClearFilters}>
            Clear All
          </button>
        )}
        {isOpenMobile && (
          <button className="filter-panel__close" onClick={onCloseMobile} aria-label="Close filters">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="filter-group">
        <button className="filter-group__header" onClick={() => toggleSection('categories')}>
          <span>Category</span>
          <svg
            className={`filter-group__chevron ${expanded.categories ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {expanded.categories && (
          <div className="filter-group__content">
            <label className="filter-radio">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => onFilterChange('category', '')}
              />
              <span>All Categories</span>
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className="filter-radio">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat.slug}
                  onChange={() => onFilterChange('category', cat.slug)}
                />
                <span>{cat.name}</span>
                <span className="filter-radio__count">({cat.product_count || 0})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="filter-group">
        <button className="filter-group__header" onClick={() => toggleSection('price')}>
          <span>Price Range</span>
          <svg
            className={`filter-group__chevron ${expanded.price ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {expanded.price && (
          <div className="filter-group__content filter-group__price-inputs">
            <input
              type="number"
              className="input input--sm"
              placeholder="Min"
              value={filters.min_price || ''}
              onChange={(e) => onFilterChange('min_price', e.target.value)}
            />
            <span className="filter-price-dash">—</span>
            <input
              type="number"
              className="input input--sm"
              placeholder="Max"
              value={filters.max_price || ''}
              onChange={(e) => onFilterChange('max_price', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="filter-group">
        <button className="filter-group__header" onClick={() => toggleSection('availability')}>
          <span>Availability</span>
          <svg
            className={`filter-group__chevron ${expanded.availability ? 'open' : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {expanded.availability && (
          <div className="filter-group__content">
            {AVAILABILITY.map((avail) => (
              <label key={avail.value} className="filter-radio">
                <input
                  type="radio"
                  name="availability"
                  checked={filters.availability === avail.value}
                  onChange={() => onFilterChange('availability', avail.value)}
                />
                <span>{avail.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  if (onCloseMobile) {
    if (!isOpenMobile) return null;
    return (
      <div className="filter-mobile-overlay" onClick={onCloseMobile}>
        <div className="filter-mobile-drawer" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
