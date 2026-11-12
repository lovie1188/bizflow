import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Store, Package, Filter, X, ChevronLeft, ChevronRight, LogIn } from 'lucide-react';
import { API_URL } from '../../utils/api';

const CATEGORIES = [
  'Ice Cream', 'Frozen Vegetables', 'Dairy', 'Bakery', 'FMCG',
  'Beverages', 'Snacks', 'Spreads', 'Packaging',
];

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]         = useState([]);
  const [suppliers, setSuppliers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pagination, setPagination]     = useState({});
  const [activeTab, setActiveTab]       = useState('products'); // 'products' | 'suppliers'

  const search      = searchParams.get('search')      || '';
  const category    = searchParams.get('category')    || '';
  const supplierId  = searchParams.get('supplier_id') || '';
  const page        = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(search);

  // Fetch marketplace products
  const fetchProducts = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 24 });
    if (search)     q.set('search', search);
    if (category)   q.set('category', category);
    if (supplierId) q.set('supplier_id', supplierId);

    fetch(`${API_URL}/api/public/marketplace/products?${q}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.data || []);
        setPagination(data.pagination || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, category, supplierId]);

  // Fetch supplier directory
  useEffect(() => {
    fetch(`${API_URL}/api/public/suppliers`)
      .then(r => r.json())
      .then(data => setSuppliers(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const applySearch = (e) => {
    e.preventDefault();
    const p = new URLSearchParams(searchParams);
    if (searchInput) p.set('search', searchInput); else p.delete('search');
    p.delete('page');
    setSearchParams(p);
  };

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasFilters = search || category || supplierId;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-alt)' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
        padding: '32px 24px 24px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', textDecoration: 'none' }}>← BizFlow</Link>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, margin: '4px 0 4px' }}>Marketplace</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', margin: 0 }}>
                Browse products from {suppliers.length} verified B2B suppliers
              </p>
            </div>
            <Link to="/login" className="btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '0.85rem', padding: '8px 18px' }}>
              <LogIn size={15} /> Sign In to Order
            </Link>
          </div>

          {/* Search bar */}
          <form onSubmit={applySearch} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search products, brands, categories..."
                style={{
                  width: '100%', padding: '11px 12px 11px 38px',
                  border: 'none', borderRadius: '10px',
                  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '11px 20px', whiteSpace: 'nowrap' }}>Search</button>
          </form>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 24px' }}>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-white)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-base)', width: 'fit-content' }}>
          {[{ key: 'products', label: '📦 Products', count: pagination.total }, { key: 'suppliers', label: '🏪 Suppliers', count: suppliers.length }].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.88rem',
                background: activeTab === tab.key ? 'var(--color-brand)' : 'transparent',
                color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                transition: 'all 0.15s'
              }}
            >
              {tab.label} {tab.count != null && <span style={{ opacity: 0.75, fontSize: '0.8rem' }}>({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* ── Products Tab ── */}
        {activeTab === 'products' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', alignItems: 'start' }}>

            {/* Filter sidebar */}
            <div className="glass-panel" style={{ padding: '18px', borderRadius: 'var(--radius-lg)', position: 'sticky', top: '80px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} /> Filters
                </span>
                {hasFilters && (
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--color-brand)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              {/* Category filter */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Category</div>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter('category', category === cat ? '' : cat)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '6px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                      fontSize: '0.83rem', marginBottom: '2px',
                      background: category === cat ? 'var(--color-brand-light)' : 'transparent',
                      color: category === cat ? 'var(--color-brand)' : 'var(--text-main)',
                      fontWeight: category === cat ? 600 : 400,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Supplier filter */}
              {suppliers.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Supplier</div>
                  <button
                    onClick={() => setFilter('supplier_id', '')}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '6px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                      fontSize: '0.83rem', marginBottom: '2px',
                      background: !supplierId ? 'var(--color-brand-light)' : 'transparent',
                      color: !supplierId ? 'var(--color-brand)' : 'var(--text-main)',
                      fontWeight: !supplierId ? 600 : 400,
                    }}
                  >
                    All Suppliers
                  </button>
                  {suppliers.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFilter('supplier_id', supplierId === String(s.id) ? '' : String(s.id))}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '6px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        fontSize: '0.83rem', marginBottom: '2px',
                        background: supplierId === String(s.id) ? 'var(--color-brand-light)' : 'transparent',
                        color: supplierId === String(s.id) ? 'var(--color-brand)' : 'var(--text-main)',
                        fontWeight: supplierId === String(s.id) ? 600 : 400,
                      }}
                    >
                      {s.name}
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>({s.product_count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product grid */}
            <div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <span className="spinner" /> Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', borderRadius: 'var(--radius-lg)' }}>
                  <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>No products found. {hasFilters && <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--color-brand)', cursor: 'pointer', fontWeight: 600 }}>Clear filters</button>}</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
                    {products.map(product => (
                      <div key={product.id} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Product image */}
                        <div style={{ height: '140px', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Package size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                          )}
                        </div>

                        <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {product.category && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-brand)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {product.category}
                            </span>
                          )}
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3, color: 'var(--text-main)' }}>
                            {product.name}
                          </div>

                          {/* Supplier badge — Amazon-style */}
                          <Link
                            to={`/store/${product.supplier_slug || product.supplier_id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginTop: 'auto' }}
                          >
                            <Store size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-brand)', fontWeight: 600 }}>
                              {product.supplier_name}
                            </span>
                          </Link>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                              ₹{Number(product.trade_price).toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{product.unit}</span>
                          </div>
                          {product.gst_rate && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{product.gst_rate}% GST</span>
                          )}

                          <Link
                            to="/login"
                            state={{ from: `/store/${product.supplier_slug || product.supplier_id}` }}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.8rem', marginTop: '6px', textAlign: 'center', display: 'block' }}
                          >
                            Login to Order
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '28px' }}>
                      <button
                        onClick={() => setFilter('page', page > 1 ? page - 1 : 1)}
                        disabled={page <= 1}
                        className="btn-secondary"
                        style={{ padding: '7px 14px', opacity: page <= 1 ? 0.4 : 1 }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Page {page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setFilter('page', page + 1)}
                        disabled={!pagination.hasNext}
                        className="btn-secondary"
                        style={{ padding: '7px 14px', opacity: !pagination.hasNext ? 0.4 : 1 }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Suppliers Tab ── */}
        {activeTab === 'suppliers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {suppliers.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', borderRadius: 'var(--radius-lg)', gridColumn: '1 / -1' }}>
                <Store size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No suppliers registered yet.</p>
              </div>
            ) : suppliers.map(supplier => (
              <Link
                key={supplier.id}
                to={`/store/${supplier.store_slug || supplier.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--color-brand-light), var(--color-brand))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '12px', color: 'white', fontWeight: 800, fontSize: '1.1rem'
                  }}>
                    {supplier.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-main)' }}>
                    {supplier.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    bizflow.in/store/{supplier.store_slug || supplier.id}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', background: 'var(--color-brand-light)', color: 'var(--color-brand)', padding: '3px 10px', borderRadius: '999px', fontWeight: 600 }}>
                      {supplier.product_count} products
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-brand)', fontWeight: 600 }}>
                      Visit Store →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
