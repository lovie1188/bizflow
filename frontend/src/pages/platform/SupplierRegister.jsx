import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, FileText, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { API_URL } from '../../utils/api';

const SupplierRegister = () => {
  const navigate = useNavigate();
  const [step, setStep]         = useState(1); // 1 = form, 2 = success
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [showPwd, setShowPwd]   = useState(false);
  const [form, setForm]         = useState({
    companyName: '',
    gstin: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          gstin: form.gstin.trim().toUpperCase(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
      } else {
        setStep(2); // Show success
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success Screen ── */
  if (step === 2) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{
            width: '70px', height: '70px', borderRadius: '50%',
            background: '#F0FFF4', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle size={36} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>You're registered!</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
            Your supplier account for <strong>{form.companyName}</strong> has been created.
            Sign in to access your dashboard and start listing products.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ padding: '12px 24px' }}
            >
              Sign In to Dashboard <ArrowRight size={16} />
            </button>
          </div>
          <p style={{ marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Your store URL: <strong>bizflow.in/store/{form.companyName.toLowerCase().replace(/\s+/g, '-')}</strong>
          </p>
        </div>
      </div>
    );
  }

  /* ── Registration Form ── */
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: 'var(--bg-alt)' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Back to landing */}
        <div style={{ marginBottom: '16px' }}>
          <Link to="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to BizFlow</Link>
        </div>

        <div className="glass-panel" style={{ padding: '36px 32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={26} color="white" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>Register as Supplier</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              Create your company store on BizFlow
            </p>
          </div>

          {/* Error */}
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

            {/* Company Name */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Company / Store Name</label>
              <div className="form-input-icon">
                <Building2 size={15} className="icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Charu Marketing"
                  value={form.companyName}
                  onChange={set('companyName')}
                  className="form-input"
                  autoComplete="organization"
                />
              </div>
            </div>

            {/* GSTIN */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>GSTIN</label>
              <div className="form-input-icon">
                <FileText size={15} className="icon" />
                <input
                  type="text"
                  required
                  placeholder="29ABCDE1234F1Z5"
                  value={form.gstin}
                  onChange={set('gstin')}
                  className="form-input"
                  maxLength={15}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '4px 0 0 2px' }}>
                15-character GST Identification Number
              </p>
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Admin Email</label>
              <div className="form-input-icon">
                <Mail size={15} className="icon" />
                <input
                  type="email"
                  required
                  placeholder="admin@yourcompany.com"
                  value={form.email}
                  onChange={set('email')}
                  className="form-input"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '42px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
              <div className="form-input-icon">
                <Lock size={15} className="icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className="form-input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: '4px' }}
            >
              {loading ? (
                <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff' }} /> Creating account…</>
              ) : (
                <>Create Supplier Account <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-base)' }}>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </Link>
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
              Looking to buy?{' '}
              <Link to="/buyer-register" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>
                Register as Buyer
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
          By registering, you agree to BizFlow's terms & privacy policy.
        </p>
      </div>
    </div>
  );
};

export default SupplierRegister;
