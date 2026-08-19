import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import FilterPanel from '../../components/FilterPanel/FilterPanel';
import Skeleton from '../../components/Skeleton/Skeleton';
import './Shop.css';

export default function Shop() {
  const { category: urlCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const category = urlCategory || searchParams.get('category') || '';
  const min_price = searchParams.get('min_price') || '';
  const max_price = searchParams.get('max_price') || '';
  const availability = searchParams.get('availability') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const filters = { category, min_price, max_price, availability, search, sort, page };

  useEffect(() => {
    api.get('/categories')
      .then((data) => setCategories(data.categories || []))
      .catch((err) => console.error(err));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.set('category', category);
      if (search) queryParams.set('search', search);
      if (sort) queryParams.set('sort', sort);
      if (min_price) queryParams.set('min_price', min_price);
      if (max_price) queryParams.set('max_price', max_price);
      if (availability) queryParams.set('availability', availability);
      queryParams.set('page', page);
      queryParams.set('limit', 12);

      const res = await api.get(`/products?${queryParams.toString()}`);
      setProducts(res.products || []);
      setPagination(res.pagination || { page: 1, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, min_price, max_price, availability, page]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (sort) newParams.set('sort', sort);
    setSearchParams(newParams);
  };

  return (
    <div className="shop-page container">
      <div className="shop-page__header">
        <h1 className="text-h1">
          {search ? `Search results for "${search}"` : category ? `${category.toUpperCase()}` : 'Shop All'}
        </h1>
        <p className="shop-page__count">
          Showing {products.length} of {pagination.total} products
        </p>
      </div>

      <div className="shop-page__controls">
        <button
          className="shop-page__filter-btn btn btn--outline btn--sm"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters {category || min_price || max_price || availability ? '(Active)' : ''}
        </button>

        <div className="shop-page__sort">
          <label htmlFor="shop-sort-select" className="shop-page__sort-label">Sort:</label>
          <select
            id="shop-sort-select"
            className="input input--sm shop-page__sort-select"
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="bestseller">Best Sellers</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
      </div>

      {(category || min_price || max_price || availability || search) && (
        <div className="shop-page__active-filters">
          <span className="active-filters__label">Active filters:</span>
          {category && (
            <span className="active-filter-pill">
              Category: {category}
              <button onClick={() => updateParam('category', '')}>✕</button>
            </span>
          )}
          {(min_price || max_price) && (
            <span className="active-filter-pill">
              Price: ₹{min_price || 0} - ₹{max_price || '∞'}
              <button onClick={() => { updateParam('min_price', ''); updateParam('max_price', ''); }}>✕</button>
            </span>
          )}
          {availability && (
            <span className="active-filter-pill">
              Status: {availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
              <button onClick={() => updateParam('availability', '')}>✕</button>
            </span>
          )}
          {search && (
            <span className="active-filter-pill">
              Search: "{search}"
              <button onClick={() => updateParam('search', '')}>✕</button>
            </span>
          )}
          <button className="active-filters__clear-all" onClick={clearAllFilters}>
            Clear All
          </button>
        </div>
      )}

      <div className="shop-page__layout">
        <aside className="shop-page__sidebar">
          <FilterPanel
            categories={categories}
            filters={filters}
            onFilterChange={updateParam}
            onClearFilters={clearAllFilters}
          />
        </aside>

        <div className="shop-page__grid-wrap">
          {loading ? (
            <Skeleton variant="product-grid" count={8} />
          ) : products.length === 0 ? (
            <div className="shop-page__empty">
              <h3>No products found</h3>
              <p>Try adjusting your search or filter settings to find what you are looking for.</p>
              <button className="btn btn--outline" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((p, idx) => (
                  <ProductCard key={p.id} product={p} index={idx} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="shop-page__pagination">
                  <button
                    className="btn btn--outline btn--sm"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', (page - 1).toString())}
                  >
                    Previous
                  </button>

                  <span className="shop-page__page-info">
                    Page {page} of {pagination.pages}
                  </span>

                  <button
                    className="btn btn--outline btn--sm"
                    disabled={page >= pagination.pages}
                    onClick={() => updateParam('page', (page + 1).toString())}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <FilterPanel
        categories={categories}
        filters={filters}
        onFilterChange={updateParam}
        onClearFilters={clearAllFilters}
        isOpenMobile={mobileFiltersOpen}
        onCloseMobile={() => setMobileFiltersOpen(false)}
      />
    </div>
  );
}
