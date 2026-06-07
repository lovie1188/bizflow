import React, { useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    if (result.success) {
      const role = result.user?.role;
      if (role === 'staff' || role === 'delivery') {
        navigate('/delivery');
      } else if (role === 'admin' || role === 'supplier') {
        navigate('/admin');
      } else {
        navigate('/shop/catalog');
      }
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="container flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '440px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', marginBottom: '16px' }}>
            <Lock size={32} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Sign In</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Supplier, Buyer or Delivery Staff — one login for all
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              required
              placeholder="Email Address" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              required
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '16px', outline: 'none' }}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            New Buyer? <Link to="/shop/register" style={{ color: 'var(--color-primary)' }}>Register your business</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
