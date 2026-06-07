import { useState, useEffect } from 'react';

// ============================================================
// COMPLETE BIZFLOW SAAS APP - FRONTEND + BACKEND INTEGRATED
// ============================================================

const API_URL = 'http://localhost:5000/api';

// ============================================================
// UTILITIES
// ============================================================
const api = {
  async request(method, endpoint, data = null) {
    const token = localStorage.getItem('token');
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };
    if (data) options.body = JSON.stringify(data);

    try {
      const res = await fetch(`${API_URL}${endpoint}`, options);
      if (!res.ok && res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/';
      }
      return await res.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },
  get: (ep) => api.request('GET', ep),
  post: (ep, d) => api.request('POST', ep, d),
  put: (ep, d) => api.request('PUT', ep, d),
};

const Colors = {
  bg: '#0A0E27', surface: '#151B3A', card: '#1F2859',
  border: '#3D4B7A', brand: '#4F46E5', success: '#10B981',
  error: '#EF4444', text: '#F8FAFC', textMuted: '#94A3B8',
};

const fmtD = n => new Intl.NumberFormat('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(n);
const cur = n => 'Rs ' + fmtD(n);
const today = () => new Date().toISOString().slice(0, 10);

// ============================================================
// MAIN APP
// ============================================================
export default function BizFlowApp() {
  const [auth, setAuth] = useState({
    isAuthenticated: !!localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
  });

  if (!auth.isAuthenticated) {
    return <AuthPage onSuccess={(user, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuth({ isAuthenticated: true, user, token });
    }} />;
  }

  return <MainApp user={auth.user} onLogout={() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth({ isAuthenticated: false, user: null, token: null });
  }} />;
}

// ============================================================
// AUTH PAGE
// ============================================================
function AuthPage({ onSuccess }) {
  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ companyName: '', gstin: '', email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', loginForm);
      onSuccess(res.user, res.token);
    } catch (err) {
      alert('Login failed: ' + (err.message || 'Check credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', registerForm);
      onSuccess(res.user, res.token);
    } catch (err) {
      alert('Registration failed: ' + (err.message || 'Try another email'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${Colors.bg}, ${Colors.surface})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 8, background: `linear-gradient(135deg, ${Colors.brand}, ${Colors.success})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BizFlow
          </div>
          <div style={{ fontSize: 13, color: Colors.textMuted }}>B2B Payment Platform for India</div>
        </div>

        <div style={{ background: Colors.card, border: `1px solid ${Colors.border}`, borderRadius: 16, padding: 32 }}>
          {page === 'login' ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: Colors.text, margin: '0 0 24px' }}>Sign In</h1>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm(f => ({...f, email: e.target.value}))} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.text, fontSize: 14, outline: 'none' }} required />
                <input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(f => ({...f, password: e.target.value}))} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.text, fontSize: 14, outline: 'none' }} required />
                <button type="submit" disabled={loading} style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: Colors.brand, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <span style={{ color: Colors.textMuted, fontSize: 13 }}>No account? </span>
                <button onClick={() => setPage('register')} style={{ background: 'none', border: 'none', color: Colors.brand, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Register
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: Colors.text, margin: '0 0 24px' }}>Register Company</h1>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input type="text" placeholder="Company Name" value={registerForm.companyName} onChange={e => setRegisterForm(f => ({...f, companyName: e.target.value}))} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.text, fontSize: 14, outline: 'none' }} required />
                <input type="text" placeholder="GSTIN" value={registerForm.gstin} onChange={e => setRegisterForm(f => ({...f, gstin: e.target.value}))} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.text, fontSize: 14, outline: 'none' }} required />
                <input type="email" placeholder="Email" value={registerForm.email} onChange={e => setRegisterForm(f => ({...f, email: e.target.value}))} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.text, fontSize: 14, outline: 'none' }} required />
                <input type="password" placeholder="Password" value={registerForm.password} onChange={e => setRegisterForm(f => ({...f, password: e.target.value}))} style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.text, fontSize: 14, outline: 'none' }} required />
                <button type="submit" disabled={loading} style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: Colors.brand, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <span style={{ color: Colors.textMuted, fontSize: 13 }}>Already registered? </span>
                <button onClick={() => setPage('login')} style={{ background: 'none', border: 'none', color: Colors.brand, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
function MainApp({ user, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState({ orders: [], invoices: [], totalOutstanding: 0, products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dash = await api.get('/dashboard');
      const orders = await api.get('/orders');
      const invoices = await api.get('/invoices');
      const products = await api.get('/products');
      
      setData({
        ...dash,
        orders: orders || [],
        invoices: invoices || [],
        products: products || [],
      });
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: Colors.bg, fontFamily: 'system-ui' }}>
      {/* SIDEBAR */}
      <div style={{ width: 240, background: Colors.surface, borderRight: `1px solid ${Colors.border}`, padding: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: Colors.text }}>BizFlow</div>
          <div style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>SaaS v1.0</div>
        </div>

        <nav style={{ flex: 1 }}>
          {['dashboard', 'products', 'orders', 'invoices', 'collections'].map(p => (
            <button key={p} onClick={() => setPage(p)} style={{width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', background: page === p ? Colors.brand : 'transparent', color: page === p ? '#fff' : Colors.textMuted, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: page === p ? 600 : 400, marginBottom: 4, fontFamily: 'inherit'}}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </nav>

        <button onClick={onLogout} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: `1px solid ${Colors.border}`, background: 'transparent', color: Colors.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {page === 'dashboard' && <Dashboard data={data} loading={loading} onRefresh={fetchData} />}
        {page === 'orders' && <Orders data={data} />}
        {page === 'invoices' && <Invoices data={data} />}
        {page === 'products' && <Products data={data} onRefresh={fetchData} />}
        {page === 'collections' && <Collections data={data} />}
      </div>
    </div>
  );
}

// ============================================================
// PAGE COMPONENTS
// ============================================================
function Dashboard({ data, loading, onRefresh }) {
  if (loading) return <div style={{ color: Colors.textMuted }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: Colors.text, margin: 0 }}>Dashboard</h1>
      <p style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32 }}>Overview of your business</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Outstanding', value: cur(data.totalOutstanding || 0), icon: '💸' },
          { label: 'Unpaid Invoices', value: data.unpaidCount || 0, icon: '📋' },
          { label: 'Total Orders', value: data.orders?.length || 0, icon: '🛒' },
          { label: 'Products', value: data.products?.length || 0, icon: '📦' },
        ].map((stat, i) => (
          <div key={i} style={{ background: Colors.card, border: `1px solid ${Colors.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: Colors.text }}>{stat.value}</div>
            <div style={{ fontSize: 20, marginTop: 8 }}>{stat.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ background: Colors.card, border: `1px solid ${Colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${Colors.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: Colors.text, margin: 0 }}>Recent Orders</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: Colors.raised }}>
                {['Order ID', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.orders || []).slice(0, 5).map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${Colors.border}` }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: Colors.brand, fontFamily: 'monospace', fontWeight: 700 }}>{o.order_number}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: Colors.text, fontWeight: 700 }}>{cur(o.total_amount || 0)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: Colors.success, fontWeight: 700 }}>{o.status?.toUpperCase()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: Colors.textMuted }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Orders({ data }) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: Colors.text, margin: 0 }}>Orders</h1>
      <p style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32 }}>All your orders</p>
      <div style={{ background: Colors.card, border: `1px solid ${Colors.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: Colors.textMuted }}>
        {data.orders?.length || 0} orders
      </div>
    </div>
  );
}

function Invoices({ data }) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: Colors.text, margin: 0 }}>Invoices</h1>
      <p style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32 }}>Track invoices</p>
      <div style={{ background: Colors.card, border: `1px solid ${Colors.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: Colors.textMuted }}>
        {data.invoices?.length || 0} invoices
      </div>
    </div>
  );
}

function Products({ data, onRefresh }) {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: Colors.text, margin: 0 }}>Products</h1>
      <p style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32 }}>Manage catalog</p>
      <div style={{ background: Colors.card, border: `1px solid ${Colors.border}`, borderRadius: 12, padding: 32, textAlign: 'center', color: Colors.textMuted }}>
        {data.products?.length || 0} products
      </div>
    </div>
  );
}

function Collections({ data }) {
  const overdue = data.invoices?.filter(i => i.due_date < today() && !i.paid) || [];
  
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: Colors.text, margin: 0 }}>Collections</h1>
      <p style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 32 }}>45-Day Reminder Timeline</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { day: 'Day 0', event: 'Invoice Raised', color: Colors.brand },
          { day: 'Day 7', event: 'Reminder #1', color: Colors.brand },
          { day: 'Day 15', event: 'Reminder #2', color: Colors.brand },
          { day: 'Day 30', event: 'Reminder #3', color: Colors.brand },
          { day: 'Day 44', event: '43B Warning', color: Colors.error },
          { day: 'Day 45+', event: 'CRITICAL', color: Colors.error },
        ].map((t, i) => (
          <div key={i} style={{ background: Colors.card, border: `2px solid ${t.color}`, borderRadius: 8, padding: 12, borderTop: `3px solid ${t.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.day}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: Colors.text, marginTop: 4 }}>{t.event}</div>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div style={{ background: Colors.error + '22', border: `1px solid ${Colors.error}`, borderRadius: 12, padding: 16 }}>
          <div style={{ color: Colors.error, fontWeight: 700, marginBottom: 8 }}>⚠️ {overdue.length} Overdue Invoice(s)</div>
          <div style={{ color: Colors.textMuted, fontSize: 13 }}>Take immediate action to avoid Section 43B(h) implications</div>
        </div>
      )}
    </div>
  );
}
