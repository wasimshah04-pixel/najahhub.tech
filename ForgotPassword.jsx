import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import '../Login/Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container container--narrow">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          Enter your registered email address and we'll send you a link to reset your password.
        </p>

        {error && <div className="auth-error animate-fade-down">{error}</div>}

        {submitted ? (
          <div className="animate-fade-up forgot-password-success">
            <p className="forgot-password-success__title">
              Check your email!
            </p>
            <p className="forgot-password-success__desc">
              If an account exists for <strong>{email}</strong>, you will receive password reset instructions shortly.
            </p>
            <Link to="/login" className="btn btn--outline btn--full">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
                type="email"
                className="input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary btn--lg btn--full"
              disabled={loading}
            >
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </button>

            <div className="forgot-password-back">
              <Link to="/login" className="auth-forgot-link">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
