import React, { useState, useEffect } from 'react';
import { Filter, ShoppingCart, Info, X } from 'lucide-react';
import { fetchApi, API_URL } from '../../utils/api';
import { useCart } from '../../context/CartContext';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchApi('/products');
        setProducts(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      {/* Mobile Filter Toggle Button */}
      <div className="show-on-mobile" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px' }}
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Mobile Overlay */}
      {isFilterOpen && (
        <div 
          className="show-on-mobile"
          onClick={() => setIsFilterOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1040, backdropFilter: 'blur(4px)' }} 
        />
      )}

      <div className="catalog-layout" style={{ display: 'flex', gap: '32px' }}>
        
        {/* Sidebar Filters */}
        <aside 
          className="sidebar-mobile-drawer"
          style={{ 
            width: '250px', 
            flexShrink: 0,
            transform: window.innerWidth <= 768 ? (isFilterOpen ? 'translateX(0)' : 'translateX(-120%)') : 'none'
          }}
        >
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={20} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '18px' }}>Filters</h3>
            </div>
            {isFilterOpen && (
              <button className="show-on-mobile" onClick={() => setIsFilterOpen(false)} style={{ background: 'transparent', color: 'var(--text-main)' }}>
                <X size={20} />
              </button>
            )}
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>Category</h4>
            {['All', 'Ice Cream', 'Frozen', 'Dairy', 'Bakery'].map(cat => (
              <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '14px' }}>{cat}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>GST Rate</h4>
            {['0% (Exempt)', '5%', '12%', '18%'].map(rate => (
              <label key={rate} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ fontSize: '14px' }}>{rate}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px' }}>Wholesale Catalog</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Showing {products.length} products</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading products...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-danger)' }}>{error}</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No products found.</div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="glass-panel product-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="product-card-image" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '160px' }}>
                  {p.image_url ? (
                    <img src={`${API_URL}${p.image_url}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>[No Image]</span>
                  )}
                  {p.category && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--color-accent)', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="product-card-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-secondary)', fontWeight: 500 }}>SKU: {p.sku}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }} title="HSN Code"><Info size={12}/> {p.hsn_code}</span>
                  </div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>{p.name}</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px', marginTop: 'auto' }}>
                    <div>
                      <div className="price-text" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)' }}>₹{p.trade_price}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>per {p.unit} &middot; {p.gst_rate > 0 ? `+${p.gst_rate}% GST` : 'GST Exempt'}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => addToCart({ id: p.id, name: p.name, price: Number(p.trade_price), gstRate: Number(p.gst_rate), unit: p.unit, img: p.image_url ? `${API_URL}${p.image_url}` : null })}
                    className="btn-primary" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ProductCatalog;
