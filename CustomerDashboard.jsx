import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast/Toast';
import { api, formatPrice, formatDate } from '../../utils/api';
import Skeleton from '../../components/Skeleton/Skeleton';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('orders'); // orders | profile | password
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const data = await api.get('/orders/my-orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadOrderDetail(orderNumber) {
    try {
      const data = await api.get(`/orders/${orderNumber}`);
      setSelectedOrder(data.order);
    } catch (err) {
      toast.error('Failed to load order details');
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.put('/auth/update-profile', { first_name: firstName, last_name: lastName, phone });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out');
    navigate('/login');
  };

  return (
    <div className="dashboard-page container">
      <div className="dashboard-header">
        <h1 className="text-h1">My Account</h1>
        <p className="dashboard-welcome">
          Welcome back, {user?.first_name || user?.email}!
        </p>
      </div>

      <div className="dashboard-layout">
        {/* Navigation Tabs Rail */}
        <aside className="dashboard-nav">
          <button
            className={`dashboard-nav__btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
            </svg>
            My Orders
          </button>

          <button
            className={`dashboard-nav__btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>

          <button
            className={`dashboard-nav__btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Password
          </button>

          <button className="dashboard-nav__btn dashboard-nav__btn--logout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </aside>

        {/* Tab Content Panel */}
        <main className="dashboard-content">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="animate-fade-in">
              {selectedOrder ? (
                /* Single Order View with Status Timeline */
                <div className="order-detail-view">
                  <button
                    className="btn btn--ghost btn--sm dashboard-back-btn"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ← Back to Order History
                  </button>

                  <div className="order-detail-header">
                    <h2>Order #{selectedOrder.order_number}</h2>
                    <span className={`badge badge--status badge--${selectedOrder.status}`}>
                      {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="order-date">Placed on {formatDate(selectedOrder.created_at)}</p>

                  {/* Status Timeline */}
                  <div className="order-timeline">
                    <h3 className="timeline-title">Order Status Timeline</h3>
                    <div className="timeline-steps">
                      {selectedOrder.timeline?.map((step, idx) => (
                        <div
                          key={step.status}
                          className={`timeline-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
                        >
                          <div className="timeline-dot" />
                          {idx < selectedOrder.timeline.length - 1 && (
                            <div className={`timeline-line ${step.completed ? 'completed' : ''}`} />
                          )}
                          <span className="timeline-label">{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="order-items-summary">
                    <h3>Items in Order</h3>
                    <div className="order-items-list">
                      {selectedOrder.items?.map((item) => (
                        <div key={item.id} className="order-item-row">
                          <img src={item.image} alt={item.title} className="order-item-img" />
                          <div className="order-item-info">
                            <span className="order-item-title">{item.title}</span>
                            {item.variant_info && (
                              <span className="order-item-variant">{item.variant_info}</span>
                            )}
                            <span className="order-item-qty">Qty: {item.quantity} × {formatPrice(item.price)}</span>
                          </div>
                          <span className="order-item-total">{formatPrice(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address & Payment Info */}
                  <div className="order-meta-grid">
                    <div>
                      <h4>Shipping Address</h4>
                      <p>{selectedOrder.shipping_name}</p>
                      <p>{selectedOrder.shipping_address}</p>
                      <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_postal_code}</p>
                      <p>Phone: {selectedOrder.shipping_phone}</p>
                    </div>

                    <div>
                      <h4>Payment & Summary</h4>
                      <p>Method: <strong>{selectedOrder.payment_method.toUpperCase()}</strong></p>
                      <p>Status: <strong>{selectedOrder.payment_status.toUpperCase()}</strong></p>
                      <div className="divider" />
                      <p>Subtotal: {formatPrice(selectedOrder.subtotal)}</p>
                      <p>Shipping: {formatPrice(selectedOrder.shipping_cost)}</p>
                      {selectedOrder.discount > 0 && <p>Discount: -{formatPrice(selectedOrder.discount)}</p>}
                      <p className="order-total-highlight">Total: {formatPrice(selectedOrder.total)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Order History List */
                <div className="orders-list-view">
                  <h2>Order History</h2>

                  {loadingOrders ? (
                    <Skeleton variant="page" />
                  ) : orders.length === 0 ? (
                    <div className="dashboard-empty">
                      <p>You haven't placed any orders yet.</p>
                      <button className="btn btn--primary" onClick={() => navigate('/shop')}>
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="orders-table">
                      {orders.map((ord) => (
                        <div key={ord.id} className="order-card" onClick={() => loadOrderDetail(ord.order_number)}>
                          <img src={ord.first_item_image} alt="Order item" className="order-card__img" />
                          <div className="order-card__info">
                            <span className="order-card__number">#{ord.order_number}</span>
                            <span className="order-card__date">{formatDate(ord.created_at)}</span>
                            <span className="order-card__items-count">{ord.item_count} {ord.item_count === 1 ? 'item' : 'items'}</span>
                          </div>
                          <div className="order-card__status">
                            <span className={`badge badge--status badge--${ord.status}`}>
                              {ord.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <span className="order-card__total">{formatPrice(ord.total)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in dashboard-tab-panel">
              <h2>Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} className="auth-form">
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" className="input" value={user?.email || ''} disabled />
                  <span className="input-hint">Email cannot be changed</span>
                </div>

                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input
                    type="text"
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input
                    type="text"
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn--primary" disabled={updatingProfile}>
                  {updatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PASSWORD */}
          {activeTab === 'password' && (
            <div className="animate-fade-in dashboard-tab-panel">
              <h2>Change Password</h2>
              <form onSubmit={handleChangePassword} className="auth-form">
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <input
                    type="password"
                    className="input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn--primary" disabled={changingPassword}>
                  {changingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
