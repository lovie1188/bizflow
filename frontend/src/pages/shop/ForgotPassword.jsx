import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { API_URL } from '../../utils/api';

/**
 * ForgotPassword page — sends a reset link to the user's email.
 * Route: /forgot-password (public, no auth required)
 */
const ForgotPassword = () => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      background: 'var(--bg-alt)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{
          background: 'var(--bg-white)',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {sent ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <CheckCircle size={30} color="#10B981" />
              </div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Check Your Email</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                If an account with <strong>{email}</strong> exists, we've sent a password reset link. Check your inbox (and spam folder).
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '12px' }}>
                The link expires in <strong>1 hour</strong>.
              </p>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginTop: '24px', color: 'var(--color-brand)', fontWeight: 600, fontSize: '0.9rem'
              }}>
                <ArrowLeft size={15} /> Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'var(--color-brand-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Mail size={26} color="var(--color-brand)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Forgot Password?</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.07)', color: 'var(--color-danger)',
                  border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '0.85rem', fontWeight: 500
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-input-icon">
                  <Mail size={16} className="icon" />
                  <input
                    type="email"
                    required
                    placeholder="Your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="form-input"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: '6px' }}
                >
                  {loading ? <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Sending…</> : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-base)' }}>
                <Link to="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  color: 'var(--text-muted)', fontSize: '0.875rem'
                }}>
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
