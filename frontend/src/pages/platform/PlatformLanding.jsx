import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Store, ShoppingBag, Zap, Shield,
  TrendingUp, Users, Package, ChevronRight, Star
} from 'lucide-react';
import { API_URL } from '../../utils/api';

/* ── Static content ── */
const FOR_SUPPLIERS = [
  { icon: Store,      title: 'Your Own Store',   desc: 'Get a dedicated storefront at bizflow.in/store/yourname — live in minutes.' },
  { icon: Package,    title: 'List Products',    desc: 'Upload your catalogue with GST rates, HSN codes and bulk pricing.' },
  { icon: TrendingUp, title: 'Grow Orders',      desc: 'Buyers discover you on our marketplace and place orders directly.' },
  { icon: Shield,     title: 'GST Invoicing',    desc: 'Automated GST-compliant invoices generated on every order.' },
];

const FOR_BUYERS = [
  { icon: ShoppingBag, title: 'Browse All Suppliers', desc: 'One marketplace — discover verified B2B suppliers across categories.' },
  { icon: Zap,         title: 'No Login to Browse',   desc: 'Explore products freely. Login only when you are ready to order.' },
  { icon: Users,       title: '15-Day Credit Terms',  desc: 'Order on credit with interest-free 15-day payment terms.' },
  { icon: Star,        title: 'Bulk Ordering',         desc: 'Minimum order quantities, trade pricing, and easy reordering.' },
];

const CATEGORIES = [
  { emoji: '🍦', label: 'Ice Cream & Desserts' },
  { emoji: '🥦', label: 'Frozen Vegetables' },
  { emoji: '🧀', label: 'Dairy & Cheese' },
  { emoji: '🍞', label: 'Bakery Supplies' },
  { emoji: '🛒', label: 'FMCG Products' },
  { emoji: '🧃', label: 'Beverages' },
  { emoji: '🍿', label: 'Snacks' },
  { emoji: '📦', label: 'Packaging' },
];

const PlatformLanding = () => {
  const [supplierCount, setSupplierCount] = useState(null);
  const [productCount, setProductCount]   = useState(null);

  // Fetch live stats for social proof
  useEffect(() => {
    fetch(`${API_URL}/api/public/suppliers`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSupplierCount(data.data.length);
          setProductCount(data.data.reduce((sum, s) => sum + (s.product_count || 0), 0));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: 'var(--bg-alt)', minHeight: '100vh' }}>

      {/* ── Minimal top nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-base)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
            borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)' }}>
            Biz<span style={{ color: 'var(--color-brand)' }}>Flow</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/marketplace" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 12px' }}>
            Browse Marketplace
          </Link>
          <Link to="/login" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-brand)', textDecoration: 'none', padding: '6px 14px', border: '1.5px solid var(--color-brand)', borderRadius: '8px' }}>
            Sign In
          </Link>
          <Link to="/supplier-register" className="btn-primary" style={{ fontSize: '0.88rem', padding: '7px 16px' }}>
            Register as Supplier
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #EFF6FF 0%, var(--bg-alt) 100%)',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--color-brand-light)', color: 'var(--color-brand)',
            borderRadius: '20px', padding: '5px 14px', fontSize: '0.8rem', fontWeight: 600,
            marginBottom: '20px', letterSpacing: '0.02em'
          }}>
            <Zap size={13} /> India's B2B Wholesale Platform
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '18px' }}>
            Connect Suppliers with<br />
            <span style={{ color: 'var(--color-brand)' }}>Buyers & Retailers</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto 32px' }}>
            Suppliers list their products. Buyers discover and order — with GST invoicing,
            15-day credit terms, and dedicated storefronts.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/supplier-register" className="btn-primary" style={{ padding: '13px 28px', fontSize: '0.95rem' }}>
              Start Selling <ArrowRight size={17} style={{ marginLeft: 4 }} />
            </Link>
            <Link to="/marketplace" className="btn-secondary" style={{ padding: '13px 28px', fontSize: '0.95rem' }}>
              Browse Products
            </Link>
          </div>

          {/* Live stats */}
          {(supplierCount !== null || productCount !== null) && (
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '40px' }}>
              {supplierCount !== null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-brand)' }}>{supplierCount}+</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suppliers</div>
                </div>
              )}
              {productCount !== null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-brand)' }}>{productCount}+</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</div>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-brand)' }}>15</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day Credit</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Category pills ── */}
      <section style={{ padding: '32px 24px', background: 'var(--bg-white)', borderTop: '1px solid var(--border-base)', borderBottom: '1px solid var(--border-base)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.label}
                to={`/marketplace?category=${encodeURIComponent(cat.label)}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 16px', borderRadius: '999px',
                  background: 'var(--bg-alt)', border: '1px solid var(--border-base)',
                  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)',
                  textDecoration: 'none', transition: 'border-color 0.15s'
                }}
              >
                {cat.emoji} {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Suppliers ── */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '8px' }}>
              For <span style={{ color: 'var(--color-brand)' }}>Suppliers</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Set up your store in minutes. Reach verified B2B buyers across India.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {FOR_SUPPLIERS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: 'var(--color-brand-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '14px'
                }}>
                  <Icon size={20} color="var(--color-brand)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>{title}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <Link to="/supplier-register" className="btn-primary" style={{ padding: '12px 28px' }}>
              Register as Supplier <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── For Buyers ── */}
      <section style={{ padding: '64px 24px', background: 'var(--bg-white)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '8px' }}>
              For <span style={{ color: 'var(--color-brand)' }}>Buyers & Retailers</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Browse freely. Order smarter. Pay on credit.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {FOR_BUYERS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  background: '#F0FFF4', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '14px'
                }}>
                  <Icon size={20} color="#16a34a" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>{title}</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <Link to="/marketplace" className="btn-secondary" style={{ padding: '12px 28px' }}>
              Browse Marketplace <ChevronRight size={16} />
            </Link>
            <Link to="/buyer-register" style={{ marginLeft: '12px', fontSize: '0.9rem', color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}>
              Register as Buyer →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '32px 24px', textAlign: 'center',
        borderTop: '1px solid var(--border-base)',
        color: 'var(--text-muted)', fontSize: '0.82rem'
      }}>
        <p>© {new Date().getFullYear()} BizFlow Platform · <a href="mailto:support@bizflow.in" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>support@bizflow.in</a></p>
        <div style={{ marginTop: '8px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/marketplace" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Marketplace</Link>
          <Link to="/supplier-register" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Supplier Registration</Link>
        </div>
      </footer>
    </div>
  );
};

export default PlatformLanding;
