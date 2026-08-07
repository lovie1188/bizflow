import React from 'react';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal, gstTotal, grandTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="container flex-center" style={{ padding: '60px 24px', flexDirection: 'column', minHeight: '60vh' }}>
        <ShoppingCart size={64} color="var(--glass-border)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Browse our wholesale catalog and add items to your cart.</p>
        <Link to="/shop/catalog">
          <button className="btn-primary" style={{ padding: '12px 24px', fontSize: '16px' }}>
            Go to Catalog
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '32px' }}>Shopping Cart</h1>

      <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Cart Items List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <span>Product</span>
            <div style={{ display: 'flex', gap: '64px', width: '350px', justifyContent: 'flex-end' }}>
              <span>Quantity</span>
              <span>Total (ex GST)</span>
            </div>
          </div>

          {cartItems.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Link to={`/shop/product/${item.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.img ? (
                    <img src={item.img} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--bg-alt)', border: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={20} color="var(--text-muted)" />
                    </div>
                  )}
                </Link>
                <div>
                  <Link to={`/shop/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{item.name}</h3>
                  </Link>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    ₹{Number(item.price || 0).toFixed(2)} / {item.unit} &middot; <span style={{ color: item.gstRate === 0 ? '#10B981' : 'inherit' }}>{item.gstRate}% GST</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '64px', alignItems: 'center', width: '350px', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => updateQuantity(item.id, item.qty - 1)} style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-base)', background: 'var(--bg-alt)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                  <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</span>
                  <button onClick={() => updateQuantity(item.id, item.qty + 1)} style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-base)', background: 'var(--bg-alt)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '120px', justifyContent: 'flex-end' }}>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>₹{(item.price * item.qty).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                  <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={20}/></button>
                </div>
              </div>
            </div>
          ))}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
            <Link to="/shop/catalog" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              &larr; Continue Shopping
            </Link>
            <button onClick={clearCart} style={{ background: 'transparent', color: 'var(--color-danger)', border: 'none', cursor: 'pointer' }}>Clear Cart</button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--color-primary)" /> Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal (Ex. GST)</span>
              <span>₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            
            {gstTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST Estimated</span>
                <span>₹{gstTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
              <span>Delivery</span>
              <span>Free</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 500 }}>Total Amount</span>
              <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>Final GST calculated at checkout</div>
          </div>

          <Link to="/shop/checkout" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              Proceed to Checkout <ArrowRight size={20} />
            </button>
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <ShieldCheck size={14} color="#10B981"/> Secure B2B Transaction
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
