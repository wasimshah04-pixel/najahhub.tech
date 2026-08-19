import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatPrice, formatDate } from '../../utils/api';
import Skeleton from '../../components/Skeleton/Skeleton';
import './OrderConfirmation.css';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await api.get(`/orders/${orderNumber}`);
        setOrder(data.order);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="container page-padding">
        <Skeleton variant="page" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page-padding text-center">
        <h2>Order Not Found</h2>
        <Link to="/shop" className="btn btn--primary mt-md">
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="confirmation-page container container--narrow">
      <div className="confirmation-card animate-scale-in">
        {/* Success Icon */}
        <div className="confirmation-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className="confirmation-title">Thank You For Your Order!</h1>
        <p className="confirmation-sub">
          Order <strong>#{order.order_number}</strong> has been confirmed. We'll send shipping updates to <strong>{order.shipping_email}</strong>.
        </p>

        {/* Timeline */}
        <div className="order-timeline mt-xl">
          <h3 className="timeline-title">Order Status</h3>
          <div className="timeline-steps">
            {order.timeline?.map((step, idx) => (
              <div
                key={step.status}
                className={`timeline-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
              >
                <div className="timeline-dot" />
                {idx < order.timeline.length - 1 && (
                  <div className={`timeline-line ${step.completed ? 'completed' : ''}`} />
                )}
                <span className="timeline-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="confirmation-items">
          <h3>Items Ordered</h3>
          {order.items?.map((item) => (
            <div key={item.id} className="summary-item">
              <img src={item.image} alt={item.title} className="summary-item__img" />
              <div className="summary-item__info">
                <span className="summary-item__title">{item.title}</span>
                {item.variant_info && <span className="summary-item__variant">{item.variant_info}</span>}
                <span className="summary-item__variant">Qty: {item.quantity}</span>
              </div>
              <span className="summary-item__price">{formatPrice(item.total)}</span>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="confirmation-total-line">
          <span>Total Paid</span>
          <span>{formatPrice(order.total)}</span>
        </div>

        <div className="confirmation-actions">
          <Link to="/account" className="btn btn--primary">
            Track Order in Account
          </Link>
          <Link to="/shop" className="btn btn--outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
