import { useState, useEffect } from 'react';
import { api, formatPrice, formatDate } from '../../utils/api';
import { useToast } from '../../components/Toast/Toast';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.customers || []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter((c) =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleToggleBlock = async (c) => {
    const action = c.is_blocked ? 'unblock' : 'block';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${c.email}?`)) return;
    try {
      await api.put(`/admin/customers/${c.id}/block`, { is_blocked: !c.is_blocked });
      toast.success(`Customer ${action}ed`);
      loadCustomers();
    } catch (err) {
      toast.error('Failed');
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-topbar">
        <div className="admin-page-topbar__left">
          <h1 className="admin-page-title">Customers</h1>
          <span className="admin-page-count">{customers.length} total</span>
        </div>
      </div>

      <div className="admin-search">
        <input
          type="text"
          className="admin-search__input"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-skeleton-list">
          {[...Array(5)].map((_, i) => <div key={i} className="admin-skeleton-row" />)}
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Orders</th>
                  <th>Spent</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.first_name} {c.last_name}</strong></td>
                    <td>
                      <div>{c.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-secondary)' }}>{c.phone || '—'}</div>
                    </td>
                    <td>{c.order_count}</td>
                    <td><strong>{formatPrice(c.total_spent)}</strong></td>
                    <td>{formatDate(c.created_at)}</td>
                    <td>
                      <span className={`status-dot ${c.is_blocked ? 'status-dot--blocked' : 'status-dot--active'}`}>
                        {c.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleToggleBlock(c)}
                        style={{ fontSize: 12, color: c.is_blocked ? 'var(--color-success)' : 'var(--color-danger)' }}
                      >
                        {c.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="7" className="admin-table__empty">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
