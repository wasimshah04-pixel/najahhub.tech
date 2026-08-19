import { useState, useEffect } from 'react';
import { api, formatPrice, formatDate } from '../../utils/api';
import { useToast } from '../../components/Toast/Toast';
import Skeleton from '../../components/Skeleton/Skeleton';
import './AdminOrders.css';

const STATUSES = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
  'refunded',
];

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail & Edit Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form Fields for Editing Order
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const toast = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.orders || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  const handleOpenOrderDetail = async (orderId) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/orders/${orderId}`);
      const ord = res.order;
      setSelectedOrder(ord);

      // Populate form state
      setEditStatus(ord.status || 'pending');
      setEditPaymentStatus(ord.payment_status || 'pending');
      setEditTracking(ord.courier_tracking || '');
      setEditName(ord.shipping_name || '');
      setEditEmail(ord.shipping_email || '');
      setEditPhone(ord.shipping_phone || '');
      setEditAddress(ord.shipping_address || '');
      setEditCity(ord.shipping_city || '');
      setEditState(ord.shipping_state || '');
      setEditPostalCode(ord.shipping_postal_code || '');
      setEditNotes(ord.notes || '');
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSaving(true);
    try {
      await api.put(`/admin/orders/${selectedOrder.id}`, {
        status: editStatus,
        payment_status: editPaymentStatus,
        courier_tracking: editTracking,
        shipping_name: editName,
        shipping_email: editEmail,
        shipping_phone: editPhone,
        shipping_address: editAddress,
        shipping_city: editCity,
        shipping_state: editState,
        shipping_postal_code: editPostalCode,
        notes: editNotes,
      });

      toast.success('Order details updated successfully!');
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      toast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  // Ultra-Detailed Printable Invoice Generator
  const handlePrintUltraInvoice = (ord) => {
    const printWindow = window.open('', '_blank');
    const items = ord.items || [];

    const itemsRows = items.map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; display: flex; align-items: center; gap: 12px;">
          <img src="${item.image}" alt="${item.title}" style="width: 48px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;" />
          <div>
            <strong style="display: block; font-size: 14px;">${item.title}</strong>
            ${item.variant_info ? `<span style="font-size: 12px; color: #666;">Variant: ${item.variant_info}</span>` : ''}
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right;">₹${item.price}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E5E5; text-align: right; font-weight: 600;">₹${item.total}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${ord.order_number} — SANHI</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Poppins', sans-serif; padding: 40px; color: #111; background: #FFF; }
            .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #111; margin-bottom: 24px; }
            .logo { font-size: 28px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; }
            .inv-title { font-size: 24px; font-weight: 600; text-align: right; color: #333; }
            .inv-meta { text-align: right; font-size: 13px; color: #666; margin-top: 4px; }
            .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; font-size: 14px; }
            .address-box h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 8px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            .items-table th { background: #FAFAFA; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; text-align: left; border-bottom: 2px solid #DDD; }
            .totals-table { width: 320px; margin-left: auto; font-size: 14px; }
            .totals-table td { padding: 6px 0; }
            .grand-total { font-size: 18px; font-weight: 700; border-top: 2px solid #111; padding-top: 10px !important; margin-top: 6px; }
            .invoice-footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #DDD; text-align: center; font-size: 12px; color: #777; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div className="invoice-header">
            <div>
              <div className="logo">SANHI</div>
              <p style="font-size: 13px; color: #555; margin-top: 4px;">Premium Clothing & Lifestyle</p>
              <p style="font-size: 12px; color: #777;">GSTIN: YOUR_GSTIN_HERE</p>
            </div>
            <div>
              <div className="inv-title">TAX INVOICE</div>
              <div className="inv-meta">
                <p>Invoice #: <strong>${ord.order_number}</strong></p>
                <p>Date: ${formatDate(ord.created_at)}</p>
                <p>Status: <strong style="text-transform: uppercase;">${ord.status}</strong></p>
              </div>
            </div>
          </div>

          <div className="address-grid">
            <div className="address-box">
              <h3>Billed & Shipped To</h3>
              <p style="font-weight: 600;">${ord.shipping_name}</p>
              <p>${ord.shipping_address}</p>
              <p>${ord.shipping_city}, ${ord.shipping_state} - ${ord.shipping_postal_code}</p>
              <p>Email: ${ord.shipping_email}</p>
              <p>Phone: ${ord.shipping_phone}</p>
            </div>
            <div className="address-box">
              <h3>Payment & Courier Info</h3>
              <p>Method: <strong>${ord.payment_method.toUpperCase()}</strong></p>
              <p>Payment Status: <strong style="text-transform: uppercase;">${ord.payment_status}</strong></p>
              ${ord.courier_tracking ? `<p>AWB Tracking #: <strong>${ord.courier_tracking}</strong></p>` : ''}
              ${ord.payment_id ? `<p>Payment Txn ID: <code>${ord.payment_id}</code></p>` : ''}
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <table className="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">₹${ord.subtotal}</td>
            </tr>
            <tr>
              <td>Shipping Fee:</td>
              <td style="text-align: right;">${ord.shipping_cost === 0 ? 'FREE' : `₹${ord.shipping_cost}`}</td>
            </tr>
            ${ord.discount > 0 ? `
              <tr style="color: #065F46;">
                <td>Discount (${ord.coupon_code || 'Applied'}):</td>
                <td style="text-align: right;">-₹${ord.discount}</td>
              </tr>
            ` : ''}
            <tr className="grand-total">
              <td>Grand Total:</td>
              <td style="text-align: right;">₹${ord.total}</td>
            </tr>
          </table>

          <div className="invoice-footer">
            <p>Thank you for shopping with us! For customer support, email support@example.com</p>
            <p style="margin-top: 4px;">This is a computer-generated invoice and requires no physical signature.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="admin-orders animate-fade-in">
      <div className="admin-page-header">
        <h1 className="text-h1">Order Management</h1>
        <p className="text-secondary">
          Click on any order row to view complete details, edit customer information, update status, or download ultra-detailed tax invoices.
        </p>
      </div>

      {loading ? (
        <Skeleton variant="page" />
      ) : (
        <div className="admin-card">
          <table className="admin-table admin-table--interactive">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Tracking</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => handleOpenOrderDetail(ord.id)}
                  title="Click to view & edit order details"
                >
                  <td><strong>#{ord.order_number}</strong></td>
                  <td>
                    <div>
                      <span>{ord.shipping_name}</span>
                      <br />
                      <small className="text-secondary">{ord.shipping_phone}</small>
                    </div>
                  </td>
                  <td>{formatDate(ord.created_at)}</td>
                  <td><strong>{formatPrice(ord.total)}</strong></td>
                  <td>
                    <span className="badge badge--new">
                      {ord.payment_method.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <code>{ord.courier_tracking || 'No Tracking'}</code>
                  </td>
                  <td>
                    <span className={`badge badge--status badge--${ord.status}`}>
                      {ord.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => handleOpenOrderDetail(ord.id)}
                    >
                      View / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ULTRA-DETAILED VIEW & EDIT ORDER MODAL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content modal-content--lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Order #{selectedOrder.order_number} Details</h2>
                <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                  Placed on {formatDate(selectedOrder.created_at)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => handlePrintUltraInvoice(selectedOrder)}
                >
                  📄 Download Ultra Invoice
                </button>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {loadingDetail ? (
              <Skeleton variant="page" />
            ) : (
              <form onSubmit={handleSaveChanges} className="order-edit-form">
                {/* 1. Status & Tracking Bar */}
                <div className="admin-form-card">
                  <h3>Order & Payment Status</h3>
                  <div className="admin-form-grid-3">
                    <div className="input-group">
                      <label className="input-label">Order Timeline Status</label>
                      <select
                        className="input"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st.replace(/_/g, ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Payment Status</label>
                      <select
                        className="input"
                        value={editPaymentStatus}
                        onChange={(e) => setEditPaymentStatus(e.target.value)}
                      >
                        {PAYMENT_STATUSES.map((pst) => (
                          <option key={pst} value={pst}>
                            {pst.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Courier Tracking / AWB #</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. AWB987654321"
                        value={editTracking}
                        onChange={(e) => setEditTracking(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Customer Contact & Address Info (Editable) */}
                <div className="admin-form-card">
                  <h3>Customer & Shipping Information</h3>
                  <div className="admin-form-grid-2">
                    <div className="input-group">
                      <label className="input-label">Customer Name</label>
                      <input
                        type="text"
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Customer Email</label>
                      <input
                        type="email"
                        className="input"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Customer Phone</label>
                      <input
                        type="tel"
                        className="input"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">PIN Code</label>
                      <input
                        type="text"
                        className="input"
                        value={editPostalCode}
                        onChange={(e) => setEditPostalCode(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group full-width">
                      <label className="input-label">Shipping Address Line</label>
                      <input
                        type="text"
                        className="input"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">City</label>
                      <input
                        type="text"
                        className="input"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">State</label>
                      <input
                        type="text"
                        className="input"
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Ordered Products Table */}
                <div className="admin-form-card">
                  <h3>Purchased Products ({selectedOrder.items?.length || 0} items)</h3>
                  <div className="admin-order-items-list">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="admin-order-item-row">
                        <img src={item.image} alt={item.title} className="admin-order-item-img" />
                        <div className="admin-order-item-info">
                          <strong style={{ fontSize: 'var(--text-small)' }}>{item.title}</strong>
                          {item.variant_info && (
                            <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                              Variant: {item.variant_info}
                            </span>
                          )}
                          <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                            Unit Price: {formatPrice(item.price)} | Qty: {item.quantity}
                          </span>
                        </div>
                        <span className="admin-order-item-total">{formatPrice(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Financial Breakdown */}
                <div className="admin-form-card admin-financials-summary">
                  <div className="financial-row">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="financial-row">
                    <span>Shipping Fee:</span>
                    <span>{selectedOrder.shipping_cost === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_cost)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="financial-row text-success">
                      <span>Discount ({selectedOrder.coupon_code || 'Coupon'}):</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="divider" style={{ margin: 'var(--space-xs) 0' }} />
                  <div className="financial-row total-row">
                    <span>Grand Total:</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setSelectedOrder(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving Changes...' : 'Save Order Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
