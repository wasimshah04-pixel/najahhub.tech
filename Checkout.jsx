import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast/Toast';
import { api, formatPrice } from '../../utils/api';
import './Checkout.css';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { getSetting } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();

  // Build enabled payment methods from settings
  const ALL_PAYMENTS = [
    { id: 'cod', name: 'Cash on Delivery (COD)', desc: 'Pay with cash upon delivery' },
    { id: 'razorpay', name: 'Razorpay', desc: 'UPI, Cards, Netbanking, Wallets' },
    { id: 'cashfree', name: 'Cashfree Payments', desc: 'Pay via Cashfree PG Gateway' },
    { id: 'phonepe', name: 'PhonePe', desc: 'Pay instantly via PhonePe UPI' },
  ];

  const enabledMethods = ALL_PAYMENTS.filter((p) => {
    if (p.id === 'cod') return getSetting('payment', 'cod_enabled', '1') === '1';
    if (p.id === 'razorpay') return getSetting('payment', 'razorpay_enabled', '0') === '1';
    if (p.id === 'cashfree') return getSetting('payment', 'cashfree_enabled', '0') === '1';
    if (p.id === 'phonepe') return getSetting('payment', 'phonepe_enabled', '0') === '1';
    return false;
  });

  // Contact info
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [guestPassword, setGuestPassword] = useState('');

  // Shipping Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  // Payment & Coupon
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set default to first enabled method
  useEffect(() => {
    if (enabledMethods.length > 0 && !enabledMethods.find((m) => m.id === paymentMethod)) {
      setPaymentMethod(enabledMethods[0].id);
    }
  }, [enabledMethods]);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop');
    }
  }, [items, navigate]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      if (user.first_name) {
        setName(`${user.first_name} ${user.last_name || ''}`.trim());
      }
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Shipping logic: free above ₹2000 or ₹99
  const shippingCost = subtotal >= 2000 ? 0 : 99;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, subtotal + shippingCost - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      const data = await api.post('/coupons/apply', { code: couponCode.trim(), subtotal });
      setAppliedCoupon(data);
      toast.success(`Coupon ${data.code} applied! Saved ₹${data.discount}`);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !name || !phone) {
      setError('Please fill in all contact information');
      return;
    }

    if (!addressLine1 || !city || !postalCode) {
      setError('Please fill in complete shipping address');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create order
      const orderPayload = {
        customer: { email, name, phone, password: guestPassword },
        shippingAddress: {
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          postal_code: postalCode,
          country,
        },
        items,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        discount: discountAmount,
      };

      const orderRes = await api.post('/orders', orderPayload);
      const { orderNumber } = orderRes;

      // 2. Process Payment Gateway
      const payRes = await api.post('/payments/process', {
        orderNumber,
        gateway: paymentMethod,
      });

      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${orderNumber}`);
      } else {
        // Mock Gateway verification flow
        await api.post('/payments/verify', {
          orderNumber,
          paymentId: `PAY_MOCK_${Date.now()}`,
          status: 'success',
        });
        clearCart();
        toast.success('Payment verified & order confirmed!');
        navigate(`/order-confirmation/${orderNumber}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page container">
      {/* Header */}
      <div className="checkout-header">
        <Link to="/" className="checkout-logo">SANHI</Link>
        <span className="checkout-badge">Secure 256-bit Encrypted Checkout</span>
      </div>

      {error && <div className="auth-error animate-fade-down">{error}</div>}

      <form onSubmit={handleSubmitOrder} className="checkout-layout">
        {/* Left Column: Information Forms */}
        <div className="checkout-form-column">
          {/* Section 1: Customer Contact */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">1. Contact Information</h2>
            {!user && (
              <p className="checkout-login-hint">
                Already have an account? <Link to="/login">Sign in</Link> for faster checkout.
              </p>
            )}

            <div className="checkout-form-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="checkout-email">Email Address *</label>
                <input
                  id="checkout-email"
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="checkout-name">Full Name *</label>
                <input
                  id="checkout-name"
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="checkout-phone">Phone Number *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  className="input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {!user && (
                <div className="input-group">
                  <label className="input-label" htmlFor="checkout-password">Account Password (Optional)</label>
                  <input
                    id="checkout-password"
                    type="password"
                    className="input"
                    placeholder="Set a password to create an account"
                    value={guestPassword}
                    onChange={(e) => setGuestPassword(e.target.value)}
                  />
                  <span className="input-hint">An account will be automatically created with zero OTP.</span>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Shipping Address */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">2. Shipping Address</h2>
            <div className="checkout-form-grid">
              <div className="input-group full-width">
                <label className="input-label" htmlFor="chk-addr1">Address Line 1 *</label>
                <input
                  id="chk-addr1"
                  type="text"
                  className="input"
                  placeholder="House/Flat No., Building Name, Street"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                />
              </div>

              <div className="input-group full-width">
                <label className="input-label" htmlFor="chk-addr2">Address Line 2 (Optional)</label>
                <input
                  id="chk-addr2"
                  type="text"
                  className="input"
                  placeholder="Landmark, Area"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="chk-city">City *</label>
                <input
                  id="chk-city"
                  type="text"
                  className="input"
                  placeholder="Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="chk-state">State *</label>
                <input
                  id="chk-state"
                  type="text"
                  className="input"
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="chk-pincode">PIN Code *</label>
                <input
                  id="chk-pincode"
                  type="text"
                  className="input"
                  placeholder="400001"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="chk-country">Country</label>
                <input id="chk-country" type="text" className="input" value={country} disabled />
              </div>
            </div>
          </section>

          {/* Section 3: Payment Method */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">3. Payment Method</h2>
            <div className="payment-options">
              {enabledMethods.map((p) => (
                <label key={p.id} className={`payment-option ${paymentMethod === p.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value={p.id}
                    checked={paymentMethod === p.id}
                    onChange={() => setPaymentMethod(p.id)}
                  />
                  <div className="payment-option__info">
                    <span className="payment-option__name">{p.name}</span>
                    <span className="payment-option__desc">{p.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <button
            type="submit"
            className="btn btn--primary btn--lg btn--full submit-order-btn"
            disabled={submitting}
          >
            {submitting ? 'Placing Order...' : `Complete Order — ${formatPrice(grandTotal)}`}
          </button>
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="checkout-summary-column">
          <div className="checkout-summary-card">
            <h3 className="summary-title">Order Summary ({items.length} items)</h3>

            {/* Items list */}
            <div className="summary-items">
              {items.map((item, idx) => (
                <div key={idx} className="summary-item">
                  <div className="summary-item__img-wrap">
                    <img src={item.image} alt={item.title} className="summary-item__img" />
                    <span className="summary-item__qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item__info">
                    <span className="summary-item__title">{item.title}</span>
                    {item.variantLabel && <span className="summary-item__variant">{item.variantLabel}</span>}
                  </div>
                  <span className="summary-item__price">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="divider" />

            {/* Coupon Code Input */}
            <div className="coupon-box">
              <input
                type="text"
                className="input input--sm"
                placeholder="Discount code (e.g. WELCOME10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon}
              >
                Apply
              </button>
            </div>

            {appliedCoupon && (
              <div className="applied-coupon-tag">
                <span>Code {appliedCoupon.code} applied (-₹{appliedCoupon.discount})</span>
                <button type="button" onClick={() => setAppliedCoupon(null)}>✕</button>
              </div>
            )}

            <div className="divider" />

            {/* Totals */}
            <div className="summary-lines">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-line">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? <strong className="text-success">FREE</strong> : formatPrice(shippingCost)}</span>
              </div>
              {appliedCoupon && (
                <div className="summary-line discount">
                  <span>Discount</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="divider" />
              <div className="summary-line total-line">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
