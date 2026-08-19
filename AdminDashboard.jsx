import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice, formatDate } from '../../utils/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/admin/analytics');
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton-list">
          {[...Array(4)].map((_, i) => <div key={i} className="admin-skeleton-row" />)}
        </div>
      </div>
    );
  }

  const { stats, recentOrders, topProducts, salesGraph } = data || {};

  return (
    <div className="admin-page animate-fade-in">
      <div className="admin-page-topbar">
        <h1 className="admin-page-title">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <span className="stat-card__label">Revenue</span>
          <span className="stat-card__value">{formatPrice(stats?.revenue || 0)}</span>
          <span className="stat-card__trend">All time</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Orders</span>
          <span className="stat-card__value">{stats?.orders || 0}</span>
          <span className="stat-card__trend">All time</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Products</span>
          <span className="stat-card__value">{stats?.products || 0}</span>
          <span className="stat-card__trend">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Customers</span>
          <span className="stat-card__value">{stats?.customers || 0}</span>
          <span className="stat-card__trend">Registered</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="admin-dashboard-grid">
        <div className="admin-card admin-card--padded">
          <h3 className="admin-card__title" style={{ marginBottom: 12 }}>Sales (7 Days)</h3>
          <svg viewBox="0 0 500 150" className="sales-chart__svg">
            {salesGraph?.length > 0 && (
              <>
                <polyline
                  fill="none"
                  stroke="var(--color-text)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={salesGraph.map((pt, i) => `${70 * i},${130 - (pt.sales / 1000) * 1.3}`).join(' ')}
                />
                {salesGraph.map((pt, i) => (
                  <circle key={i} cx={70 * i} cy={130 - (pt.sales / 1000) * 1.3} r="3" fill="var(--color-text)" />
                ))}
              </>
            )}
          </svg>
          <div className="sales-chart__labels">
            {salesGraph?.map((pt, i) => <span key={i}>{pt.day}</span>)}
          </div>
        </div>

        <div className="admin-card admin-card--padded">
          <h3 className="admin-card__title" style={{ marginBottom: 8 }}>Top Products</h3>
          <div className="admin-top-list">
            {topProducts?.map((p) => (
              <div key={p.id} className="admin-top-item">
                <img src={p.image} alt="" className="admin-top-img" />
                <div className="admin-top-info">
                  <span className="admin-top-title">{p.title}</span>
                  <span className="admin-top-price">{formatPrice(p.price)} · {p.sales_count} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Recent Orders</h3>
          <Link to="/admin/orders" className="btn btn--ghost btn--sm">View all →</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map((ord) => (
                <tr key={ord.id}>
                  <td><strong>#{ord.order_number}</strong></td>
                  <td>{ord.shipping_name}</td>
                  <td>{formatDate(ord.created_at)}</td>
                  <td>{formatPrice(ord.total)}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${ord.status === 'delivered' ? 'ok' : ord.status === 'cancelled' ? 'danger' : 'neutral'}`}>
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
