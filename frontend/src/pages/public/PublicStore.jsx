import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, ShieldCheck, Truck, Clock, RefreshCw, ShoppingCart, LogIn, Store } from 'lucide-react';
import { API_URL } from '../../utils/api';

/* ── Trust badges ── */
const TRUST = [
  { icon: ShieldCheck, label: '100% Genuine',   desc: 'Direct from brands',      color: '#E6F7F4' },
  { icon: Truck,       label: 'Fast Delivery',  desc: 'Next-day dispatch',        color: '#EFF6FF' },
  { icon: Clock,       label: '15-Day Credit',  desc: 'Interest-free payments',   color: '#FFF7ED' },
  { icon: RefreshCw,   label: 'Easy Returns',   desc: 'Hassle-free process',      color: '#F5F3FF' },
];

const PublicStore = () => {
  const { storeName } = useParams();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        // Fetch company details
        const compRes = await fetch(`${API_URL}/api/public/store/${encodeURIComponent(storeName)}`);
        const compData = await compRes.json();
        if (!compData.success) throw new Error('Store not found');
        setCompany(compData.company);

        // Fetch products
        const prodRes = await fetch(`${API_URL}/api/public/store/${encodeURIComponent(storeName)}/products?limit=20`);
        const prodData = await prodRes.json();
        if (prodData.success) {
          setProducts(prodData.data);
        }
      } catch (err) {
        setError('Store not found or unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeName]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert('Search feature is available after logging in!');
    }
  };

  const getImgUrl = (img) => {
    if (!img) return null;
    return img.startsWith('http') ? img : `${API_URL}${img}`;
  };

  const handleLoginToOrder = () => {
    navigate('/login', { state: { message: `Please login to place an order with ${company?.name}` } });
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (error || !company) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
      <Store size={64} style={{ color: '#cbd5e1', marginBottom: '20px' }} />
      <h2 style={{ fontSize: '24px', color: 'var(--text-main)', marginBottom: '8px' }}>Store Not Found</h2>
      <p style={{ color: 'var(--text-muted)' }}>The store you are looking for does not exist or has been removed.</p>
    </div>
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* ── Navbar ── */}
      <nav style={{ background: 'white', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-base)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 'bold', fontSize: '18px' }}>
            {company.name.charAt(0)}
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{company.name}</h1>
        </div>
        <div>
          <button onClick={handleLoginToOrder} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
            <LogIn size={18} /> Login to Order
          </button>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <section style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white', padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.02em' }}>
            Welcome to {company.name}'s Catalog
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '32px' }}>
            Premium products directly from the supplier. Fast delivery, reliable stock, and best wholesale prices.
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '400px', padding: '14px 20px', borderRadius: '12px', border: 'none', outline: 'none', fontSize: '16px' }}
            />
            <button type="submit" style={{ padding: '14px 24px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} /> Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <div style={{ maxWidth: '1200px', margin: '-30px auto 40px', background: 'white', borderRadius: '16px', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'relative' }}>
        {TRUST.map(({ icon: Icon, label, desc, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: color, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <Icon size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px', color: 'var(--text-main)' }}>{label}</h4>
              <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-muted)' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Product Catalog ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: 'var(--text-main)' }}>Our Products</h2>
        
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: '16px', border: '1px solid var(--border-base)' }}>
            <ShoppingCart size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: '0 0 8px' }}>No products available</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>This store hasn't added any products yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {products.map(p => (
              <div key={p.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-base)', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: '200px', background: p.image_url ? `url(${getImgUrl(p.image_url)}) center/cover no-repeat` : '#f1f5f9', position: 'relative' }}>
                  {(!p.stock || p.stock < 1) && (
                    <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: 'white', padding: '4px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '4px' }}>OUT OF STOCK</span>
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '6px' }}>{p.category}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>MOQ: {p.min_order_qty} {p.unit}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>₹{Number(p.trade_price).toLocaleString('en-IN')}</div>
                    <button onClick={handleLoginToOrder} style={{ background: 'var(--bg-app)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-app)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default PublicStore;
