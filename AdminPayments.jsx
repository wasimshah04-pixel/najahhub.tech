import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/Toast/Toast';
import { api } from '../../utils/api';
import './AdminPayments.css';

export default function AdminPayments() {
  const { getSetting } = useTheme();
  const toast = useToast();

  // Razorpay State
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [razorpayMode, setRazorpayMode] = useState('test'); // test | live
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');

  // Cashfree State
  const [cashfreeEnabled, setCashfreeEnabled] = useState(false);
  const [cashfreeEnv, setCashfreeEnv] = useState('sandbox'); // sandbox | production
  const [cashfreeAppId, setCashfreeAppId] = useState('');
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState('');

  // PhonePe State
  const [phonepeEnabled, setPhonepeEnabled] = useState(false);
  const [phonepeEnv, setPhonepeEnv] = useState('uat'); // uat | production
  const [phonepeMerchantId, setPhonepeMerchantId] = useState('');
  const [phonepeSaltKey, setPhonepeSaltKey] = useState('');
  const [phonepeSaltIndex, setPhonepeSaltIndex] = useState('1');

  // COD State
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMinOrder, setCodMinOrder] = useState('0');
  const [codMaxOrder, setCodMaxOrder] = useState('10000');
  const [codCharge, setCodCharge] = useState('0');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Populate settings
    setRazorpayEnabled(getSetting('payment', 'razorpay_enabled', '0') === '1');
    setRazorpayMode(getSetting('payment', 'razorpay_mode', 'test'));
    setRazorpayKeyId(getSetting('payment', 'razorpay_key_id', ''));
    setRazorpayKeySecret(getSetting('payment', 'razorpay_key_secret', ''));
    setRazorpayWebhookSecret(getSetting('payment', 'razorpay_webhook_secret', ''));

    setCashfreeEnabled(getSetting('payment', 'cashfree_enabled', '0') === '1');
    setCashfreeEnv(getSetting('payment', 'cashfree_env', 'sandbox'));
    setCashfreeAppId(getSetting('payment', 'cashfree_app_id', ''));
    setCashfreeSecretKey(getSetting('payment', 'cashfree_secret_key', ''));

    setPhonepeEnabled(getSetting('payment', 'phonepe_enabled', '0') === '1');
    setPhonepeEnv(getSetting('payment', 'phonepe_env', 'uat'));
    setPhonepeMerchantId(getSetting('payment', 'phonepe_merchant_id', ''));
    setPhonepeSaltKey(getSetting('payment', 'phonepe_salt_key', ''));
    setPhonepeSaltIndex(getSetting('payment', 'phonepe_salt_index', '1'));

    setCodEnabled(getSetting('payment', 'cod_enabled', '1') === '1');
    setCodMinOrder(getSetting('payment', 'cod_min_order', '0'));
    setCodMaxOrder(getSetting('payment', 'cod_max_order', '10000'));
    setCodCharge(getSetting('payment', 'cod_charge', '0'));
  }, [getSetting]);

  const handleSaveGateways = async (e) => {
    e.preventDefault();

    // Enforce API Credential entry when a gateway is enabled
    if (razorpayEnabled) {
      if (!razorpayKeyId.trim() || !razorpayKeySecret.trim()) {
        toast.error('Razorpay Key ID and Key Secret are required when Razorpay is enabled.');
        return;
      }
    }

    if (cashfreeEnabled) {
      if (!cashfreeAppId.trim() || !cashfreeSecretKey.trim()) {
        toast.error('Cashfree App ID and Secret Key are required when Cashfree is enabled.');
        return;
      }
    }

    if (phonepeEnabled) {
      if (!phonepeMerchantId.trim() || !phonepeSaltKey.trim()) {
        toast.error('PhonePe Merchant ID and Salt Key are required when PhonePe is enabled.');
        return;
      }
    }

    setSaving(true);
    try {
      const settingsPayload = [
        // Razorpay
        { key: 'razorpay_enabled', value: razorpayEnabled ? '1' : '0', group_name: 'payment' },
        { key: 'razorpay_mode', value: razorpayMode, group_name: 'payment' },
        { key: 'razorpay_key_id', value: razorpayKeyId.trim(), group_name: 'payment' },
        { key: 'razorpay_key_secret', value: razorpayKeySecret.trim(), group_name: 'payment' },
        { key: 'razorpay_webhook_secret', value: razorpayWebhookSecret.trim(), group_name: 'payment' },

        // Cashfree
        { key: 'cashfree_enabled', value: cashfreeEnabled ? '1' : '0', group_name: 'payment' },
        { key: 'cashfree_env', value: cashfreeEnv, group_name: 'payment' },
        { key: 'cashfree_app_id', value: cashfreeAppId.trim(), group_name: 'payment' },
        { key: 'cashfree_secret_key', value: cashfreeSecretKey.trim(), group_name: 'payment' },

        // PhonePe
        { key: 'phonepe_enabled', value: phonepeEnabled ? '1' : '0', group_name: 'payment' },
        { key: 'phonepe_env', value: phonepeEnv, group_name: 'payment' },
        { key: 'phonepe_merchant_id', value: phonepeMerchantId.trim(), group_name: 'payment' },
        { key: 'phonepe_salt_key', value: phonepeSaltKey.trim(), group_name: 'payment' },
        { key: 'phonepe_salt_index', value: phonepeSaltIndex.trim(), group_name: 'payment' },

        // COD
        { key: 'cod_enabled', value: codEnabled ? '1' : '0', group_name: 'payment' },
        { key: 'cod_min_order', value: codMinOrder, group_name: 'payment' },
        { key: 'cod_max_order', value: codMaxOrder, group_name: 'payment' },
        { key: 'cod_charge', value: codCharge, group_name: 'payment' },
      ];

      await api.post('/admin/settings', { settings: settingsPayload });
      toast.success('Payment Gateway API configurations updated!');
    } catch (err) {
      toast.error('Failed to save gateway configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-payments animate-fade-in">
      <div className="admin-page-header">
        <h1 className="text-h1">Payment Gateway Management</h1>
        <p className="text-secondary">
          Enable or disable gateways. Entering API credentials is required for any enabled payment provider.
        </p>
      </div>

      <form onSubmit={handleSaveGateways} className="gateway-config-form">
        {/* 1. Razorpay Gateway */}
        <div className={`gateway-card ${razorpayEnabled ? 'gateway-card--enabled' : ''}`}>
          <div className="gateway-card__header">
            <div className="gateway-card__title-wrap">
              <span className="gateway-icon">⚡</span>
              <div>
                <h3>Razorpay Payment Gateway</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                  Accept UPI, Credit/Debit Cards, Netbanking & Wallets via Razorpay Checkout SDK.
                </p>
              </div>
            </div>

            <label className="gateway-toggle">
              <input
                type="checkbox"
                checked={razorpayEnabled}
                onChange={(e) => setRazorpayEnabled(e.target.checked)}
              />
              <span className="toggle-label">{razorpayEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </label>
          </div>

          {razorpayEnabled && (
            <div className="gateway-card__body animate-fade-down">
              <div className="admin-form-grid-2">
                <div className="input-group">
                  <label className="input-label">Environment Mode *</label>
                  <select
                    className="input"
                    value={razorpayMode}
                    onChange={(e) => setRazorpayMode(e.target.value)}
                  >
                    <option value="test">Test Mode (Sandbox)</option>
                    <option value="live">Live Mode (Production)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Razorpay Key ID *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="rzp_test_... or rzp_live_..."
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    required={razorpayEnabled}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Razorpay Key Secret *</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter Key Secret"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    required={razorpayEnabled}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Webhook Secret (Optional)</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter Webhook Secret"
                    value={razorpayWebhookSecret}
                    onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Cashfree Gateway */}
        <div className={`gateway-card ${cashfreeEnabled ? 'gateway-card--enabled' : ''}`}>
          <div className="gateway-card__header">
            <div className="gateway-card__title-wrap">
              <span className="gateway-icon">💸</span>
              <div>
                <h3>Cashfree Payments</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                  Seamless payment sessions & instant refunds via Cashfree Payment Gateway.
                </p>
              </div>
            </div>

            <label className="gateway-toggle">
              <input
                type="checkbox"
                checked={cashfreeEnabled}
                onChange={(e) => setCashfreeEnabled(e.target.checked)}
              />
              <span className="toggle-label">{cashfreeEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </label>
          </div>

          {cashfreeEnabled && (
            <div className="gateway-card__body animate-fade-down">
              <div className="admin-form-grid-2">
                <div className="input-group">
                  <label className="input-label">Environment *</label>
                  <select
                    className="input"
                    value={cashfreeEnv}
                    onChange={(e) => setCashfreeEnv(e.target.value)}
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Cashfree App ID *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 104829375..."
                    value={cashfreeAppId}
                    onChange={(e) => setCashfreeAppId(e.target.value)}
                    required={cashfreeEnabled}
                  />
                </div>

                <div className="input-group full-width">
                  <label className="input-label">Cashfree Secret Key *</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter Secret Key"
                    value={cashfreeSecretKey}
                    onChange={(e) => setCashfreeSecretKey(e.target.value)}
                    required={cashfreeEnabled}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. PhonePe Gateway */}
        <div className={`gateway-card ${phonepeEnabled ? 'gateway-card--enabled' : ''}`}>
          <div className="gateway-card__header">
            <div className="gateway-card__title-wrap">
              <span className="gateway-icon">📱</span>
              <div>
                <h3>PhonePe Standard Checkout</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                  Accept instant UPI & QR payments using PhonePe v2 Payment API.
                </p>
              </div>
            </div>

            <label className="gateway-toggle">
              <input
                type="checkbox"
                checked={phonepeEnabled}
                onChange={(e) => setPhonepeEnabled(e.target.checked)}
              />
              <span className="toggle-label">{phonepeEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </label>
          </div>

          {phonepeEnabled && (
            <div className="gateway-card__body animate-fade-down">
              <div className="admin-form-grid-3">
                <div className="input-group">
                  <label className="input-label">Environment *</label>
                  <select
                    className="input"
                    value={phonepeEnv}
                    onChange={(e) => setPhonepeEnv(e.target.value)}
                  >
                    <option value="uat">UAT (Staging Test)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Merchant ID *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. M123456789"
                    value={phonepeMerchantId}
                    onChange={(e) => setPhonepeMerchantId(e.target.value)}
                    required={phonepeEnabled}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Salt Index *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Default: 1"
                    value={phonepeSaltIndex}
                    onChange={(e) => setPhonepeSaltIndex(e.target.value)}
                    required={phonepeEnabled}
                  />
                </div>

                <div className="input-group full-width">
                  <label className="input-label">Salt Key *</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter Salt Key"
                    value={phonepeSaltKey}
                    onChange={(e) => setPhonepeSaltKey(e.target.value)}
                    required={phonepeEnabled}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Cash on Delivery (COD) */}
        <div className={`gateway-card ${codEnabled ? 'gateway-card--enabled' : ''}`}>
          <div className="gateway-card__header">
            <div className="gateway-card__title-wrap">
              <span className="gateway-icon">💵</span>
              <div>
                <h3>Cash on Delivery (COD)</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                  Allow customers to pay with cash upon doorstep delivery.
                </p>
              </div>
            </div>

            <label className="gateway-toggle">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
              />
              <span className="toggle-label">{codEnabled ? 'ENABLED' : 'DISABLED'}</span>
            </label>
          </div>

          {codEnabled && (
            <div className="gateway-card__body animate-fade-down">
              <div className="admin-form-grid-3">
                <div className="input-group">
                  <label className="input-label">Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    className="input"
                    value={codMinOrder}
                    onChange={(e) => setCodMinOrder(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Maximum Order Value (₹)</label>
                  <input
                    type="number"
                    className="input"
                    value={codMaxOrder}
                    onChange={(e) => setCodMaxOrder(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Extra COD Handling Charge (₹)</label>
                  <input
                    type="number"
                    className="input"
                    value={codCharge}
                    onChange={(e) => setCodCharge(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--lg"
          disabled={saving}
          style={{ marginTop: 'var(--space-md)' }}
        >
          {saving ? 'Saving Gateway Settings...' : 'Save Payment Gateway Configuration'}
        </button>
      </form>
    </div>
  );
}
