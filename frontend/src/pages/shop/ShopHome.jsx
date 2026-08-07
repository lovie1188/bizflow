import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Search, ShieldCheck, Truck, Clock, RefreshCw,
  ArrowRight, ShoppingCart, LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi, API_URL } from '../../utils/api';
import { useCart } from '../../context/CartContext';

/* ── Category data ── */
const CATEGORIES = [
  { label: 'Ice Cream',  emoji: '🍦', color: '#FFF0F5', border: '#FFB3CC', slug: 'Ice Cream' },
  { label: 'Frozen Veg', emoji: '🥦', color: '#F0FFF4', border: '#86EFAC', slug: 'Frozen' },
  { label: 'Dairy',      emoji: '🧀', color: '#FFFBEB', border: '#FCD34D', slug: 'Dairy' },
  { label: 'Bakery',     emoji: '🍞', color: '#FFF7ED', border: '#FDBA74', slug: 'Bakery' },
  { label: 'FMCG',       emoji: '🛒', color: '#F0F9FF', border: '#7DD3FC', slug: 'FMCG' },
  { label: 'Beverages',  emoji: '🧃', color: '#F5F3FF', border: '#C4B5FD', slug: 'Beverages' },
  { label: 'Snacks',     emoji: '🍿', color: '#FEF9C3', border: '#FDE047', slug: 'Snacks' },
  { label: 'Spreads',    emoji: '🫙', color: '#FFF0F5', border: '#FECDD3', slug: 'Spreads' },
];

/* ── Bundle cards data ── */
const BUNDLES = [
  { title: 'Ice Cream & Desserts',    desc: 'Bulk packs for HoReCa',    bg: '#FFEED6', emoji: '🍨', slug: 'Ice Cream' },
  { title: 'Fresh Frozen Vegetables', desc: 'Peas, Corn, Sweet Potato', bg: '#D9ECD2', emoji: '🥕', slug: 'Frozen' },
  { title: 'Dairy & Cheese',          desc: 'Mozzarella, Slices, Cream', bg: '#DBE5EF', emoji: '🧀', slug: 'Dairy' },
  { title: 'Bakery Essentials',       desc: 'Chocochips & Condiments',  bg: '#EFD8D4', emoji: '🥐', slug: 'Bakery' },
];

/* ── Trust badges ── */
const TRUST = [
  { icon: ShieldCheck, label: '100% Genuine',   desc: 'Direct from brands',      color: '#E6F7F4' },
  { icon: Truck,       label: 'Fast Delivery',  desc: 'Next-day dispatch',        color: '#EFF6FF' },
  { icon: Clock,       label: '15-Day Credit',  desc: 'Interest-free payments',   color: '#FFF7ED' },
  { icon: RefreshCw,   label: 'Easy Returns',   desc: 'Hassle-free process',      color: '#F5F3FF' },
];

const ShopHome = () => {
  const navigate = useNavigate();
  // Detect Custom Domain mapping
  const hostname = window.location.hostname;
  const isCustomDomain = hostname !== 'localhost' && !hostname.includes('bizflow.in');

  // storeName present → public mode via platform domain (/store/:storeName)
  const { storeName } = useParams();
  const isPublic = Boolean(storeName) || isCustomDomain;

  const { company } = useAuth() || {};
  
  const [publicCompany, setPublicCompany] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [qtys, setQtys] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    // Fetch company info for public mode
    if (isCustomDomain) {
      fetch(`${API_URL}/api/public/domain/${hostname}`)
        .then(r => r.json())
        .then(data => { if (data.success) setPublicCompany(data.company); })
        .catch(() => {});
    } else if (storeName) {
      fetch(`${API_URL}/api/public/store/${encodeURIComponent(storeName)}`)
        .then(r => r.json())
        .then(data => { if (data.success) setPublicCompany(data.company); })
        .catch(() => {});
    }
  }, [isCustomDomain, hostname, storeName]);

  const companyName = isPublic 
    ? (publicCompany?.name || (storeName ? decodeURIComponent(storeName) : hostname)) 
    : (company?.name || 'BizFlow');

  useEffect(() => {
    if (isCustomDomain) {
      fetch(`${API_URL}/api/public/domain/${hostname}/products?limit=8`)
        .then(r => r.json())
        .then(data => setProducts(data.data || []))
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    } else if (storeName) {
      // Public mode — use unauthenticated public API
      fetch(`${API_URL}/api/public/store/${encodeURIComponent(storeName)}/products?limit=8`)
        .then(r => r.json())
        .then(data => setProducts(data.data || []))
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    } else {
      // Authenticated buyer mode — use normal API
      fetchApi('/products')
        .then(data => setProducts((data.data || []).slice(0, 8)))
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    }
  }, [isCustomDomain, hostname, storeName]);

  const setQty = (id, val) =>
    setQtys(prev => ({ ...prev, [id]: Math.max(1, val) }));

  const handleAddToCart = (p) => {
    if (isPublic) { navigate('/login'); return; }
    const formattedProduct = {
      id: p.id,
      name: p.name,
      price: Number(p.trade_price),
      gstRate: Number(p.gst_rate),
      unit: p.unit,
      img: p.image_url ? `${API_URL}${p.image_url}` : null
    };
    addToCart(formattedProduct, qtys[p.id] || p.min_order_qty || 1);
  };

  const getImgUrl = (img) => {
    if (!img) return null;
    return img.startsWith('http') ? img : `${API_URL}${img}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (isPublic) {
      navigate('/login', { state: { message: 'Please login to search and order products.' } });
    } else {
      navigate(`/shop/catalog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Build links based on mode
  const catLink = (slug) => isPublic ? '/login' : `/shop/catalog?category=${slug}`;
  const catalogLink = isPublic ? '/login' : '/shop/catalog';

  return (
    <div>

      {/* ══════════ HERO BANNER ══════════ */}
      <section
        className="hero-banner"
        style={{ backgroundImage: "url('/hero-banner.png')" }}
      >
        <div className="container-fluid">
          <div className="hero-content">
            <div style={{
              display: 'inline-block', background: 'var(--color-brand-light)',
              color: 'var(--color-brand)', padding: '5px 14px', borderRadius: '20px',
              fontSize: '0.78rem', fontWeight: 700, marginBottom: '14px',
              letterSpacing: '0.02em'
            }}>
              Welcome to {companyName}
            </div>

            <h1>
              Fresh &amp; Quality<br />
              <span style={{ color: 'var(--color-brand)' }}>Products</span> For Your Business
            </h1>

            <p>
              Premium FMCG, Dairy &amp; Frozen supplies for MSMEs.
              Fast delivery, 15-day payment terms, 100% genuine.
            </p>

            <form className="hero-search-form" onSubmit={handleSearch}>
              <input
                className="hero-search-input"
                type="text"
                placeholder="What are you looking for…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="hero-search-btn">
                <Search size={16} /> Search
              </button>
            </form>

            {/* Public mode: show Login button prominently */}
            {isPublic && (
              <div style={{ marginTop: '20px' }}>
                <Link to="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'var(--color-brand)', color: '#fff',
                  padding: '12px 28px', borderRadius: 'var(--radius-sm)',
                  fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none'
                }}>
                  <LogIn size={18} /> Login to Place Order
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ TRUST BADGES ══════════ */}
      <div className="trust-strip">
        <div className="container-fluid">
          <div className="trust-grid">
            {TRUST.map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="trust-item">
                <div className="trust-icon" style={{ background: color }}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4>{label}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ BUNDLE CARDS ══════════ */}
      <section style={{ padding: '40px 0' }}>
        <div className="container-fluid">
          <div className="bundle-grid">
            {BUNDLES.map((b) => (
              <Link
                key={b.slug}
                to={catLink(b.slug)}
                className="bundle-card"
                style={{ background: b.bg }}
              >
                <div className="bundle-card-img">
                  <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{b.emoji}</span>
                </div>
                <div className="bundle-card-body">
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CATEGORIES ══════════ */}
      <section style={{ padding: '40px 0', background: 'var(--bg-white)' }}>
        <div className="container-fluid">
          <div className="section-header">
            <h2>What do you want to order?</h2>
            <p>Browse our product categories</p>
            <div className="section-divider" />
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={catLink(cat.slug)}
                className="category-card"
              >
                <div
                  className="category-circle"
                  style={{ background: cat.color, borderColor: cat.border }}
                >
                  <span style={{ fontSize: '2.5rem' }}>{cat.emoji}</span>
                </div>
                <span className="category-card-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURED PRODUCTS ══════════ */}
      <section style={{ padding: '40px 0' }}>
        <div className="container-fluid">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>Featured Products</h2>
              <p style={{ margin: 0 }}>Top picks for your business</p>
            </div>
            <Link to={catalogLink} className="btn-outline-brand" style={{ whiteSpace: 'nowrap' }}>
              View All <ArrowRight size={15} />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card" style={{ height: '280px' }}>
                  <div className="skeleton" style={{ height: '180px', borderRadius: '0' }} />
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <ShoppingCart size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p>No products available yet.</p>
              <Link to={catalogLink} className="btn-primary" style={{ marginTop: '12px', display: 'inline-flex' }}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => {
                const imgUrl = getImgUrl(p.image_url);
                const qty = qtys[p.id] || p.min_order_qty || 1;
                return (
                  <div key={p.id} className="product-card">
                    <div className="product-card-img">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.name} loading="lazy" />
                      ) : (
                        <span style={{ fontSize: '3rem', opacity: 0.25 }}>📦</span>
                      )}
                      <div className="product-card-overlay">
                        {isPublic ? (
                          <Link to="/login" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                            Login to Buy
                          </Link>
                        ) : (
                          <Link
                            to={`/shop/product/${p.id}`}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                            onClick={e => e.stopPropagation()}
                          >
                            Details
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="product-card-body">
                      <span className="product-card-name">{p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="product-card-price">Rs.{Number(p.trade_price).toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>per {p.unit} &middot; {p.gst_rate > 0 ? `+${p.gst_rate}% GST` : 'GST Exempt'}</div>
                    </div>

                    <div className="product-card-footer">
                      {isPublic ? (
                        <Link to="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <LogIn size={13} /> Login to Order
                        </Link>
                      ) : (
                        <>
                          <div className="qty-stepper">
                            <button onClick={() => setQty(p.id, qty - 1)}>-</button>
                            <span>{qty}</span>
                            <button onClick={() => setQty(p.id, qty + 1)}>+</button>
                          </div>
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            onClick={() => handleAddToCart(p)}
                          >
                            <ShoppingCart size={13} /> Add
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section style={{ padding: '48px 0', background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))' }}>
        <div className="container-fluid" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', marginBottom: '10px' }}>
            Ready to streamline your procurement?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '24px', fontSize: '1rem' }}>
            Join hundreds of MSMEs ordering smarter with {companyName}.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              background: '#fff', color: 'var(--color-brand)',
              padding: '12px 28px', borderRadius: 'var(--radius-sm)',
              fontWeight: 700, fontSize: '0.9rem',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              {isPublic ? 'Login to Order' : 'Sign In'} <ArrowRight size={16} />
            </Link>
            {isPublic ? (
              <Link to={isCustomDomain ? "/register" : `/store/${encodeURIComponent(storeName)}/register`} style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px 28px', borderRadius: 'var(--radius-sm)',
                fontWeight: 600, fontSize: '0.9rem',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                Register as Buyer
              </Link>
            ) : (
              <Link to="/shop/catalog" style={{
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px 28px', borderRadius: 'var(--radius-sm)',
                fontWeight: 600, fontSize: '0.9rem',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}>
                View Catalog
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default ShopHome;
