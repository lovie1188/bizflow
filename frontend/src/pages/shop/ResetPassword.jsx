import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../../utils/api';

/**
 * ResetPassword page — validates token from URL, lets user set a new password.
 * Route: /reset-password?token=<hex> (public, no auth required)
 */
const ResetPassword = () => {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const token           = params.get('token');

  const [password, setPassword]         = useState('');
  const [confirmPwd, setConfirmPwd]     = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    if (!token) setError('Missing reset token. Please use the link from your email.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPwd) { setError('Passwords do not match.'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      } else {
        setError(data.error || 'Failed to reset password. The link may have expired.');
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
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <CheckCircle size={30} color="#10B981" />
              </div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>Password Updated!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Your password has been reset successfully. Redirecting to login…
              </p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'var(--color-brand-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Lock size={26} color="var(--color-brand)" />
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Set New Password</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Choose a strong password of at least 8 characters.
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.07)', color: 'var(--color-danger)',
                  border: '1px solid rgba(239,68,68,0.2)', padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)', marginBottom: '18px',
                  fontSize: '0.85rem', fontWeight: 500,
                  display: 'flex', alignItems: 'flex-start', gap: '8px'
                }}>
                  <AlertCircle size={15} style={{ marginTop: '2px', flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* New Password */}
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', pointerEvents: 'none'
                  }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="New Password (min. 8 chars)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    autoComplete="new-password"
                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'
                    }}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', pointerEvents: 'none'
                  }} />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    placeholder="Confirm New Password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    className="form-input"
                    autoComplete="new-password"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: '6px' }}
                >
                  {loading ? <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Updating…</> : 'Update Password'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
