import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../../utils/api';
import { useToast } from '../../components/Toast/Toast';
import './AdminProducts.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get('/admin/products');
      setProducts(res.products || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? products.map((p) => p.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} products?`)) return;
    try {
      await api.post('/admin/products/bulk-delete', { ids: selectedIds });
      toast.success('Deleted');
      setSelectedIds([]);
      loadData();
    } catch (err) {
      toast.error('Bulk delete failed');
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      {/* Header */}
      <div className="admin-page-topbar">
        <div className="admin-page-topbar__left">
          <h1 className="admin-page-title">Products</h1>
          <span className="admin-page-count">{products.length} total</span>
        </div>
        <div className="admin-page-topbar__right">
          {selectedIds.length > 0 && (
            <button className="btn btn--outline btn--sm text-danger" onClick={handleBulkDelete}>
              Delete ({selectedIds.length})
            </button>
          )}
          <button className="btn btn--primary btn--sm" onClick={() => navigate('/admin/products/new')}>
            + New Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search">
        <input
          type="text"
          className="admin-search__input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-skeleton-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="admin-skeleton-row" />
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Inventory</th>
                  <th>Price</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                      />
                    </td>
                    <td>
                      <div className="admin-product-cell">
                        <img src={p.primary_image} alt="" className="admin-product-cell__img" />
                        <div className="admin-product-cell__info">
                          <span className="admin-product-cell__title">{p.title}</span>
                          <span className="admin-product-cell__meta">
                            {p.category_name || 'Uncategorized'}
                            {p.sku && <> · {p.sku}</>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${p.stock <= 5 ? 'admin-badge--danger' : 'admin-badge--ok'}`}>
                        {p.stock <= 0 ? 'Out of stock' : p.stock <= 5 ? 'Low stock' : 'In stock'}
                      </span>
                    </td>
                    <td>{p.stock} units</td>
                    <td className="admin-table__price">{formatPrice(p.price)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button className="btn btn--ghost btn--xs" onClick={() => navigate(`/admin/products/${p.id}`)}>
                          Edit
                        </button>
                        <button className="btn btn--ghost btn--xs text-danger" onClick={() => handleDelete(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="admin-table__empty">
                      {search ? 'No products match your search.' : 'No products yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
