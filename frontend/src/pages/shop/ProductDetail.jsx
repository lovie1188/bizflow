import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Edit, Info, ShieldCheck, Truck, Package } from 'lucide-react';
import { fetchApi, API_URL } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const found = await fetchApi(`/products/${id}`);
      
      if (!found) {
        setError('Product not found');
      } else {
        setProduct(found);
        setQty(found.min_order_qty || 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.trade_price,
      image_url: product.image_url,
      min_order_qty: product.min_order_qty,
      gst_rate: product.gst_rate
    }, qty);
    
    // Optional feedback
    const btn = document.getElementById('add-btn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = 'Added to Cart!';
      btn.style.background = 'var(--color-success)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
      }, 1500);
    }
  };

  if (loading) return <Loader center />;
  if (error || !product) return (
    <div className="container-fluid" style={{ padding: 'var(--sp-4)' }}>
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: 'var(--sp-4)' }}>
        <ArrowLeft size={16} /> Back
      </button>
      <EmptyState icon={Info} title="Not Found" message={error || "Product doesn't exist."} />
    </div>
  );

  return (
    <div className="product-detail-page page-enter">
      {/* Top Nav (Mobile mostly) */}
      <div className="detail-header glass-panel" style={{ position: 'sticky', top: 0, zIndex: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', marginBottom: '16px' }}>
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '15px' }}>Product Details</span>
        <div style={{ width: 36 }}>
          {isAdmin && (
            <Link to="/admin/products" className="btn-icon" title="Edit Product in Admin">
              <Edit size={18} />
            </Link>
          )}
        </div>
      </div>

      <div className="container-fluid" style={{ maxWidth: '800px', paddingBottom: '32px' }}>
        <div className="detail-grid">
          
          {/* Image Gallery Area */}
          <div className="detail-image-box glass-panel depth-3d-card">
            {product.image_url ? (
              <img src={`${API_URL}${product.image_url}`} alt={product.name} className="detail-img" />
            ) : (
              <div className="no-img flex-center">
                <Package size={64} style={{ opacity: 0.2 }} />
              </div>
            )}
            {product.stock <= 0 && <span className="badge badge-danger" style={{ position:'absolute', top: 12, right: 12, fontSize: '12px', padding: '6px 12px' }}>Out of Stock</span>}
          </div>

          {/* Info Area */}
          <div className="detail-info">
            <h1 style={{ fontSize: '28px', marginBottom: '8px', lineHeight: 1.2, color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif" }}>{product.name}</h1>
            <p className="text-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>SKU: {product.sku}</p>

            <div className="price-section" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-secondary)', display: 'flex', alignItems: 'baseline', gap: '4px', fontFamily: "'Outfit', sans-serif" }}>
                ₹{Number(product.trade_price).toFixed(2)}
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {product.unit || 'UNIT'}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                + {product.gst_rate}% GST
              </div>
            </div>

            <div className="qty-selector" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Quantity ({product.unit || 'PCS'})</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={qty} 
                  min={product.min_order_qty || 1} 
                  onChange={(e) => setQty(Math.max(product.min_order_qty || 1, parseInt(e.target.value) || 1))}
                  style={{ fontSize: '18px', textAlign: 'center', fontWeight: 600, background: 'var(--bg-input)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '18px' }}>
                <span className="text-muted text-xs">MOQ: {product.min_order_qty || 1}</span>
                <span className="text-muted text-xs">Stock: {product.stock > 0 ? product.stock : 'None'}</span>
              </div>
            </div>

            <button 
              id="add-btn"
              className="btn-primary depth-3d-btn w-full flex-center" 
              style={{ padding: '16px', fontSize: '16px', borderRadius: 'var(--radius-md)', border: 'none' }}
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              <ShoppingCart size={20} />
              Add to Cart
            </button>

            {/* Feature Highlights */}
            <div className="highlights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '32px' }}>
              <div className="highlight-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)' }}>
                <ShieldCheck size={18} color="var(--color-success)" /> Quality Guaranteed
              </div>
              <div className="highlight-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-light)' }}>
                <Truck size={18} color="var(--color-primary)" /> Standard Delivery
              </div>
            </div>

            {/* Specs Table */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>Specifications</h3>
              <table className="data-table" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', width: '40%' }}>Category</td>
                    <td style={{ fontWeight: 500 }}>{product.category || 'Uncategorized'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>HSN Code</td>
                    <td style={{ fontWeight: 500 }}>{product.hsn_code || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>GST Rate</td>
                    <td style={{ fontWeight: 500 }}>{product.gst_rate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
