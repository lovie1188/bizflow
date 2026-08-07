import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    if (result.success) {
      const role = result.user?.role;
      // True RBAC: navigate to the role's canonical home
      const destination = ROLE_HOME[role] || '/shop/catalog';
      navigate(destination, { replace: true });
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };


  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      background: 'var(--bg-alt)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Card */}
        <div style={{
          background: 'var(--bg-white)',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-md)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'var(--color-brand-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Lock size={26} color="var(--color-brand)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Welcome Back</h2>
            <p style={{ fontSize: '0.875rem' }}>
              Supplier, Buyer or Delivery Staff — one login for all
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.07)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(239,68,68,0.2)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px',
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email */}
            <div className="form-input-icon">
              <Mail size={16} className="icon" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                id="login-email"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none'
              }} />
              <input
                type={showPwd ? 'text' : 'password'}
                required
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                id="login-password"
                autoComplete="current-password"
                style={{ paddingLeft: '38px', paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  padding: '4px', display: 'flex', alignItems: 'center'
                }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: '6px' }}
            >
              {loading ? (
                <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            textAlign: 'center', marginTop: '24px', paddingTop: '20px',
            borderTop: '1px solid var(--border-base)'
          }}>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              New Buyer?{' '}
              <Link to="/shop/register" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>
                Register your business
              </Link>
            </p>
          </div>
        </div>

        {/* Below card note */}
        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-light)' }}>
          By signing in, you agree to our terms & privacy policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
