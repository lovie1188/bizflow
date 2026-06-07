import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Clock, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ShopHome = () => {
  const { company } = useAuth() || {};
  const companyName = company?.name || 'Charu Marketing';

  return (
    <div>
      {/* Hero Section */}
      <section style={{ padding: '80px 0', background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.15), transparent 50%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.15), transparent 50%)' }}>
        <div className="container flex-center" style={{ flexDirection: 'column', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', borderRadius: '20px', fontWeight: 500, marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            Welcome to {companyName}
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 700, marginBottom: '24px', lineHeight: 1.1, maxWidth: '800px' }}>
            Flow <span className="gradient-text">Smarter.</span> Grow <span className="gradient-text">Faster.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '40px', lineHeight: 1.6 }}>
            Premium FMCG, Dairy, and Frozen Food supplies for your business. Fast delivery, 15-day payment terms, and 100% genuine products.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/shop/catalog" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', fontSize: '16px' }}>
              Browse Catalog <ArrowRight size={18} />
            </Link>
            <button className="btn-secondary" style={{ padding: '14px 32px', fontSize: '16px' }}>View Offers</button>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="container flex-between" style={{ flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-secondary)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>100% Genuine</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Direct from brands</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-accent)' }}>
              <Clock size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>15-Day Credit</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Interest-free payments</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--color-danger)' }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Fast Delivery</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Next-day dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container" style={{ padding: '80px 24px' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '40px' }}>Shop by <span className="gradient-text">Category</span></h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {[
            { name: 'Ice Creams & Desserts', desc: 'Vadilal bulk packs', color: 'var(--color-primary)' },
            { name: 'Frozen Vegetables', desc: 'Peas, Sweet Corn, Fries', color: 'var(--color-secondary)' },
            { name: 'Cheese & Dairy', desc: 'Mozzarella, Slices', color: 'var(--color-accent)' },
            { name: 'Bakery Additives', desc: 'Chocochips, Condiments', color: 'var(--color-danger)' },
          ].map((cat, i) => (
            <Link to={`/shop/catalog?category=${cat.name}`} key={i} className="glass-panel" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px', textDecoration: 'none', transition: 'transform 0.3s' }} 
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)`, border: `1px solid ${cat.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} color={cat.color} />
              </div>
              <div>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '4px' }}>{cat.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ShopHome;
