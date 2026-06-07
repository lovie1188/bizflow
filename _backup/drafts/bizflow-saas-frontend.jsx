import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ============================================================
// CONFIGURATION
// ============================================================
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// MAIN APP
// ============================================================
export default function BizFlowSaaS() {
  const [authState, setAuthState] = useState({
    isAuthenticated: !!localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token')
  });

  if (!authState.isAuthenticated) {
    return <AuthFlow onSuccess={(user, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({ isAuthenticated: true, user, token });
    }}/>;
  }

  return <MainApp user={authState.user} onLogout={() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ isAuthenticated: false, user: null, token: null });
  }}/>;
}

// ============================================================
// AUTH FLOW
// ============================================================
function AuthFlow({ onSuccess }) {
  const [page, setPage] = useState('login'); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    companyName: '', 
    gstin: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login', loginForm);
      onSuccess(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/register', {
        companyName: registerForm.companyName,
        gstin: registerForm.gstin,
        email: registerForm.email,
        password: registerForm.password
      });
      onSuccess(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #0A0E27 0%, #151B3A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: 20}}>
      <div style={{width: '100%', maxWidth: 420}}>
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: 40}}>
          <div style={{fontSize: 40, fontWeight: 900, marginBottom: 8, background: 'linear-gradient(135deg, #4F46E5, #10B981)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
            BizFlow
          </div>
          <div style={{fontSize: 13, color: '#94A3B8'}}>SaaS Platform for Indian B2B Payments</div>
        </div>

        {/* Form Card */}
        <div style={{background: '#1F2859', border: '1px solid #3D4B7A', borderRadius: 16, padding: 32}}>
          {page === 'login' ? (
            <>
              <h1 style={{fontSize: 20, fontWeight: 700, color: '#F8FAFC', margin: '0 0 24px'}}>Welcome Back</h1>
              
              {error && (
                <div style={{background: '#EF444422', border: '1px solid #EF4444', color: '#F87171', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13}}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({...f, email: e.target.value}))}
                  style={{padding: '12px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: '#151B3A', color: '#F8FAFC', fontSize: 14, outline: 'none'}}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({...f, password: e.target.value}))}
                  style={{padding: '12px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: '#151B3A', color: '#F8FAFC', fontSize: 14, outline: 'none'}}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{padding: '12px 16px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1}}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div style={{textAlign: 'center', marginTop: 20}}>
                <span style={{color: '#94A3B8', fontSize: 13}}>Don't have an account? </span>
                <button onClick={() => setPage('register')} style={{background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 13, fontWeight: 600}}>
                  Create one
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 style={{fontSize: 20, fontWeight: 700, color: '#F8FAFC', margin: '0 0 24px'}}>Register Your Company</h1>
              
              {error && (
                <div style={{background: '#EF444422', border: '1px solid #EF4444', color: '#F87171', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13}}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                <input
                  type="text"
                  placeholder="Company Name"
                  value={registerForm.companyName}
                  onChange={e => setRegisterForm(f => ({...f, companyName: e.target.value}))}
                  style={{padding: '12px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: '#151B3A', color: '#F8FAFC', fontSize: 14, outline: 'none'}}
                />
                <input
                  type="text"
                  placeholder="GSTIN (15 digits)"
                  value={registerForm.gstin}
                  onChange={e => setRegisterForm(f => ({...f, gstin: e.target.value}))}
                  style={{padding: '12px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: '#151B3A', color: '#F8FAFC', fontSize: 14, outline: 'none'}}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={e => setRegisterForm(f => ({...f, email: e.target.value}))}
                  style={{padding: '12px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: '#151B3A', color: '#F8FAFC', fontSize: 14, outline: 'none'}}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={e => setRegisterForm(f => ({...f, password: e.target.value}))}
                  style={{padding: '12px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: '#151B3A', color: '#F8FAFC', fontSize: 14, outline: 'none'}}
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={registerForm.confirmPassword}
                  onChange={e => setRegisterForm(f => ({...f, confirmPassword: e.target.value}))}
                  style={{padding: '12px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: '#151B3A', color: '#F8FAFC', fontSize: 14, outline: 'none'}}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{padding: '12px 16px', borderRadius: 8, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1}}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>

              <div style={{textAlign: 'center', marginTop: 20}}>
                <span style={{color: '#94A3B8', fontSize: 13}}>Already have an account? </span>
                <button onClick={() => setPage('login')} style={{background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 13, fontWeight: 600}}>
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{textAlign: 'center', marginTop: 24, fontSize: 12, color: '#475569'}}>
          Secure • GST Compliant • MSME Friendly
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP - Admin/Buyer Portal
// ============================================================
function MainApp({ user, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const [data, setData] = useState({ orders: [], invoices: [], products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardRes = await axiosInstance.get('/dashboard');
        const ordersRes = await axiosInstance.get('/orders');
        const productsRes = await axiosInstance.get('/products');
        
        setData({
          ...dashboardRes.data,
          orders: ordersRes.data,
          products: productsRes.data
        });
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: '#0A0E27', fontFamily: 'system-ui'}}>
      {/* SIDEBAR */}
      <div style={{width: 240, background: '#151B3A', borderRight: '1px solid #3D4B7A', padding: 20, display: 'flex', flexDirection: 'column'}}>
        <div style={{marginBottom: 30}}>
          <div style={{fontSize: 18, fontWeight: 900, color: '#F8FAFC'}}>BizFlow</div>
          <div style={{fontSize: 11, color: '#94A3B8', marginTop: 4}}>SaaS v1.0</div>
        </div>

        <nav style={{flex: 1}}>
          {['dashboard', 'products', 'orders', 'invoices', 'subscription'].map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', background: page === p ? '#4F46E5' : 'transparent', color: page === p ? '#fff' : '#94A3B8', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: page === p ? 600 : 400, marginBottom: 4, fontFamily: 'inherit'}}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </nav>

        <div style={{paddingTop: 16, borderTop: '1px solid #3D4B7A'}}>
          <div style={{fontSize: 12, color: '#94A3B8', marginBottom: 8}}>{user?.name}</div>
          <button
            onClick={onLogout}
            style={{width: '100%', padding: '10px 16px', borderRadius: 8, border: '1px solid #3D4B7A', background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit'}}
          >
            Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex: 1, padding: 32, overflowY: 'auto'}}>
        {page === 'dashboard' && <Dashboard data={data} loading={loading}/>}
        {page === 'orders' && <OrdersPage data={data}/>}
        {page === 'invoices' && <InvoicesPage data={data}/>}
        {page === 'products' && <ProductsPage data={data}/>}
        {page === 'subscription' && <SubscriptionPage/>}
      </div>
    </div>
  );
}

// ============================================================
// PAGE COMPONENTS
// ============================================================
function Dashboard({ data, loading }) {
  if (loading) return <div style={{color: '#94A3B8'}}>Loading...</div>;

  return (
    <div>
      <h1 style={{fontSize: 32, fontWeight: 900, color: '#F8FAFC', margin: 0}}>Dashboard</h1>
      <p style={{color: '#94A3B8', fontSize: 14, marginTop: 8, marginBottom: 32}}>Overview of your business</p>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32}}>
        {[
          {label: 'Total Outstanding', value: `Rs ${data.totalOutstanding?.toLocaleString('en-IN')}`, icon: '💸'},
          {label: 'Unpaid Invoices', value: data.unpaidCount || 0, icon: '📋'},
          {label: 'Total Orders', value: data.orders?.length || 0, icon: '🛒'},
        ].map((stat, i) => (
          <div key={i} style={{background: '#1F2859', border: '1px solid #3D4B7A', borderRadius: 12, padding: 20}}>
            <div style={{fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8}}>{stat.label}</div>
            <div style={{fontSize: 28, fontWeight: 800, color: '#F8FAFC'}}>{stat.value}</div>
            <div style={{fontSize: 20, marginTop: 8}}>{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div style={{background: '#1F2859', border: '1px solid #3D4B7A', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{padding: 20, borderBottom: '1px solid #3D4B7A'}}>
          <h2 style={{fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: 0}}>Recent Orders</h2>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#2A3366'}}>
                {['Order ID', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} style={{padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.orders || []).slice(0, 5).map(o => (
                <tr key={o.id} style={{borderBottom: '1px solid #3D4B7A'}}>
                  <td style={{padding: '12px 16px', fontSize: 13, color: '#4F46E5', fontFamily: 'monospace', fontWeight: 700}}>{o.order_number}</td>
                  <td style={{padding: '12px 16px', fontSize: 13, color: '#F8FAFC', fontWeight: 700}}>Rs {o.total_amount?.toLocaleString('en-IN')}</td>
                  <td style={{padding: '12px 16px', fontSize: 12, color: '#10B981', fontWeight: 700}}>{o.status?.toUpperCase()}</td>
                  <td style={{padding: '12px 16px', fontSize: 13, color: '#94A3B8'}}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrdersPage({ data }) {
  return (
    <div>
      <h1 style={{fontSize: 32, fontWeight: 900, color: '#F8FAFC', margin: 0}}>Orders</h1>
      <p style={{color: '#94A3B8', fontSize: 14, marginTop: 8, marginBottom: 32}}>Manage your orders</p>
      <div style={{background: '#1F2859', border: '1px solid #3D4B7A', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94A3B8'}}>
        Total Orders: {data.orders?.length || 0}
      </div>
    </div>
  );
}

function InvoicesPage({ data }) {
  return (
    <div>
      <h1 style={{fontSize: 32, fontWeight: 900, color: '#F8FAFC', margin: 0}}>Invoices</h1>
      <p style={{color: '#94A3B8', fontSize: 14, marginTop: 8, marginBottom: 32}}>Track your invoices</p>
      <div style={{background: '#1F2859', border: '1px solid #3D4B7A', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94A3B8'}}>
        Invoices: {data.invoices?.length || 0}
      </div>
    </div>
  );
}

function ProductsPage({ data }) {
  return (
    <div>
      <h1 style={{fontSize: 32, fontWeight: 900, color: '#F8FAFC', margin: 0}}>Products</h1>
      <p style={{color: '#94A3B8', fontSize: 14, marginTop: 8, marginBottom: 32}}>Manage your product catalog</p>
      <div style={{background: '#1F2859', border: '1px solid #3D4B7A', borderRadius: 12, padding: 32, textAlign: 'center', color: '#94A3B8'}}>
        Products: {data.products?.length || 0}
      </div>
    </div>
  );
}

function SubscriptionPage() {
  const plans = [
    {name: 'Starter', price: '₹999/month', features: ['Upto 5 users', 'Basic invoicing', 'Email support']},
    {name: 'Pro', price: '₹2,999/month', features: ['Upto 25 users', 'Advanced analytics', 'Priority support', 'GST compliance'], popular: true},
    {name: 'Enterprise', price: 'Custom', features: ['Unlimited users', 'API access', 'Dedicated support']},
  ];

  return (
    <div>
      <h1 style={{fontSize: 32, fontWeight: 900, color: '#F8FAFC', margin: 0}}>Subscription Plans</h1>
      <p style={{color: '#94A3B8', fontSize: 14, marginTop: 8, marginBottom: 32}}>Choose the plan that fits your needs</p>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20}}>
        {plans.map((plan, i) => (
          <div key={i} style={{background: '#1F2859', border: plan.popular ? '2px solid #4F46E5' : '1px solid #3D4B7A', borderRadius: 12, padding: 24, position: 'relative'}}>
            {plan.popular && <div style={{position: 'absolute', top: -12, left: 16, background: '#4F46E5', color: '#fff', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 700}}>POPULAR</div>}
            <div style={{fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 8}}>{plan.name}</div>
            <div style={{fontSize: 24, fontWeight: 800, color: '#4F46E5', marginBottom: 20}}>{plan.price}</div>
            <ul style={{listStyle: 'none', padding: 0, marginBottom: 20}}>
              {plan.features.map((f, j) => (
                <li key={j} style={{color: '#94A3B8', fontSize: 14, marginBottom: 8}}>✓ {f}</li>
              ))}
            </ul>
            <button style={{width: '100%', padding: '12px 16px', borderRadius: 8, border: plan.popular ? 'none' : `1px solid #3D4B7A`, background: plan.popular ? '#4F46E5' : 'transparent', color: plan.popular ? '#fff' : '#4F46E5', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit'}}>
              {plan.popular ? 'Get Started' : 'Learn More'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
