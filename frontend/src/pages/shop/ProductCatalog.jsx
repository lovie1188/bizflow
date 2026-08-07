import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ShoppingCart, Info, X } from 'lucide-react';
import { fetchApi, API_URL } from '../../utils/api';
import { useCart } from '../../context/CartContext';

const GST_RATES   = ['0', '5', '12', '18']; // stored as numbers in DB

const ProductCatalog = () => {
  const [products, setProducts]               = useState([]);
  const [page, setPage]                       = useState(1);
  const [hasMore, setHasMore]                 = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [error, setError]                     = useState(null);
  const [isFilterOpen, setIsFilterOpen]       = useState(false);
  const [viewMode, setViewMode]               = useState('grid');
  const [qtys, setQtys]                       = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]); // [] means "All"
  const [selectedGst, setSelectedGst]         = useState([]);       // [] means "All"
  const [selectedBrands, setSelectedBrands]   = useState([]);       // [] means "All"
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const { addToCart } = useCart();

  const loadProducts = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const data = await fetchApi(`/products?page=${pageNum}&limit=20`);
      
      if (pageNum === 1) {
        setProducts(data.data || []);
      } else {
        setProducts(prev => {
          const newProducts = data.data || [];
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewProducts];
        });
      }
      
      if (data.pagination?.allBrands) {
        setAvailableBrands(data.pagination.allBrands);
      }
      if (data.pagination?.allCategories) {
        setAvailableCategories(data.pagination.allCategories);
      }
      
      setHasMore(data.pagination?.hasNext || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage);
  };

  const toggleFilter = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const clearFilters = () => { setSelectedCategories([]); setSelectedGst([]); setSelectedBrands([]); };

  // Apply filters client-side
  const filteredProducts = products.filter(p => {
    const catOk = selectedCategories.length === 0 || selectedCategories.includes(p.category);
    const gstOk = selectedGst.length === 0 || selectedGst.includes(String(p.gst_rate));
    const brandOk = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
    return catOk && gstOk && brandOk;
  });

  const activeFilterCount = selectedCategories.length + selectedGst.length + selectedBrands.length;

  return (
    <div className="container-fluid" style={{ padding: '16px 24px' }}>
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
          className={`catalog-sidebar ${isFilterOpen ? 'mobile-open' : ''}`}
          style={{ 
            flexShrink: 0,
            position: 'sticky',
            top: '84px',
            alignSelf: 'flex-start',
            height: 'max-content',
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-base)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="var(--color-brand)" />
              <h3 style={{ margin: 0, fontSize: '16px' }}>Filters</h3>
            </div>
            {isFilterOpen && (
              <button className="show-on-mobile" onClick={() => setIsFilterOpen(false)} style={{ background: 'transparent', color: 'var(--text-main)' }}>
                <X size={20} />
              </button>
            )}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>Category</h4>
            </div>
            {availableCategories.map(cat => (
              <label key={cat} className="catalog-filter-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleFilter(selectedCategories, setSelectedCategories, cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
            {availableCategories.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No categories available</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '10px' }}>GST Rate</h4>
            {[{label:'0% (Exempt)',val:'0'},{label:'5%',val:'5'},{label:'12%',val:'12'},{label:'18%',val:'18'}].map(({label,val}) => (
              <label key={val} className="catalog-filter-item">
                <input
                  type="checkbox"
                  checked={selectedGst.includes(val)}
                  onChange={() => toggleFilter(selectedGst, setSelectedGst, val)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>Brand</h4>
            </div>
            {availableBrands.map(brand => (
              <label key={brand} className="catalog-filter-item">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleFilter(selectedBrands, setSelectedBrands, brand)}
                />
                <span>{brand}</span>
              </label>
            ))}
            {availableBrands.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No brands available</span>}
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-danger"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}>
              Clear {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
        </aside>

      {/* Main Grid / List Container */}
        <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Wholesale Catalog</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Showing {filteredProducts.length}{filteredProducts.length !== products.length ? ` of ${products.length}` : ''} products
              {activeFilterCount > 0 && <span style={{ color: 'var(--color-primary)', marginLeft: '6px' }}>({activeFilterCount} filter{activeFilterCount>1?'s':''} active)</span>}
            </span>
          </div>
          
          {/* List / Grid Toggle Layout Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
            >
              Grid View
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
            >
              List View
            </button>
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="btn-secondary show-on-mobile" 
              style={{ alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
            >
              <Filter size={14} /> Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div className="spinner spinner-lg" />
            Loading products…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-danger)' }}>{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No products match your filters. <button onClick={clearFilters} style={{ background:'transparent', border:'none', color:'var(--color-primary)', cursor:'pointer', fontFamily:'inherit', fontSize:'14px', textDecoration:'underline' }}>Clear filters</button>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? 'product-grid' : 'product-list'}>
              {filteredProducts.map((p) => {
                const currentQty = qtys[p.id] || p.min_order_qty || 1;
                const handleQtyChange = (val) => {
                  const min = p.min_order_qty || 1;
                  setQtys(prev => ({ ...prev, [p.id]: Math.max(min, val) }));
                };

                if (viewMode === 'list') {
                  return (
                    <div key={p.id} className="product-list-card">
                        <Link to={`/shop/product/${p.id}`} className="product-card-image" style={{ background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        {p.image_url ? (
                          <img src={`${API_URL}${p.image_url}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>[No Image]</span>
                        )}
                          {p.category && (
                            <span className="badge badge-info" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.6rem' }}>
                              {p.category}
                            </span>
                          )}
                        </Link>

                        <div className="product-card-content">
                          <div className="product-info-block">
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-brand)', fontWeight: 600 }}>SKU: {p.sku}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>HSN: {p.hsn_code}</span>
                            </div>
                            <Link to={`/shop/product/${p.id}`} style={{ textDecoration: 'none', color: 'var(--text-main)' }}>
                              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{p.name}</h3>
                            </Link>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>MOQ: {p.min_order_qty || 1} &middot; Stock: {p.stock > 0 ? p.stock : 'None'}</span>
                          </div>

                          <div className="product-price-block">
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand)' }}>₹{p.trade_price}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>per {p.unit} &middot; {p.gst_rate > 0 ? `+${p.gst_rate}% GST` : 'GST Exempt'}</div>
                          </div>

                          <div className="product-action-block">
                            <div className="qty-stepper">
                              <button onClick={() => handleQtyChange(currentQty - 1)}>−</button>
                              <span>{currentQty}</span>
                              <button onClick={() => handleQtyChange(currentQty + 1)}>+</button>
                            </div>

                            <button 
                              onClick={() => addToCart({ id: p.id, name: p.name, price: Number(p.trade_price), gstRate: Number(p.gst_rate), unit: p.unit, img: p.image_url ? `${API_URL}${p.image_url}` : null }, currentQty)}
                              className="btn-primary" 
                              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                            >
                              <ShoppingCart size={14} /> Add
                            </button>
                          </div>
                        </div>
                    </div>
                  );
                }

                // Grid View Layout (Default)
                return (
                  <div key={p.id} className="product-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Link to={`/shop/product/${p.id}`} className="product-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', textDecoration: 'none' }}>
                      {p.image_url ? (
                        <img src={`${API_URL}${p.image_url}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>[No Image]</span>
                      )}
                      {p.category && (
                        <span className="badge badge-info" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '0.6rem' }}>
                          {p.category}
                        </span>
                      )}
                    </Link>
                    <div className="product-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-brand)', fontWeight: 600 }}>SKU: {p.sku}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }} title="HSN Code"><Info size={11}/> {p.hsn_code}</span>
                      </div>
                      <Link to={`/shop/product/${p.id}`} style={{ textDecoration: 'none' }}>
                        <span className="product-card-name">{p.name}</span>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="product-card-price">₹{p.trade_price}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>per {p.unit} &middot; {p.gst_rate > 0 ? `+${p.gst_rate}% GST` : 'GST Exempt'}</div>
                    </div>
                    <div className="product-card-footer">
                      <div className="qty-stepper">
                        <button onClick={() => handleQtyChange(currentQty - 1)}>−</button>
                        <span>{currentQty}</span>
                        <button onClick={() => handleQtyChange(currentQty + 1)}>+</button>
                      </div>
                      <button 
                        onClick={() => addToCart({ id: p.id, name: p.name, price: Number(p.trade_price), gstRate: Number(p.gst_rate), unit: p.unit, img: p.image_url ? `${API_URL}${p.image_url}` : null }, currentQty)}
                        className="btn-primary" 
                        style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px' }}>
                <button 
                  onClick={handleLoadMore} 
                  disabled={loadingMore}
                  className="btn-secondary" 
                  style={{ padding: '10px 24px', fontSize: '14px', borderRadius: 'var(--radius-sm)' }}
                >
                  {loadingMore ? 'Loading...' : 'Load More Products'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default ProductCatalog;
