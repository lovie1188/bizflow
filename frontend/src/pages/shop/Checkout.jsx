import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, ArrowRight, Building, CheckCircle, Edit3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { fetchApi } from '../../utils/api';
import CheckoutTerms from './CheckoutTerms';

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [placed, setPlaced] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);

  const { cartItems, grandTotal, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('bizflow_user');
    if (!userStr) { navigate('/shop/login'); return; }
    try {
      const user = JSON.parse(userStr);
      setBuyerInfo(user);

      // Load buyer profile for real credit limit & registered address
      fetchApi('/buyers/me').then(profile => {
        if (profile) {
          setBuyerProfile(profile);
          const addr = [profile.address, profile.city, profile.state, profile.pincode]
            .filter(Boolean).join(', ');
          setDeliveryAddress(addr || '');
        }
      }).catch(() => {
        // silently ignore if /buyers/me not available yet
      });
    } catch (e) {}
  }, [navigate]);

  const handlePlaceOrderClick = () => {
    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address before proceeding.');
      return;
    }
    setError(null);
    setShowTerms(true);
  };

  const handlePlaceOrder = async (signature) => {
    setShowTerms(false);
    setLoading(true);
    setError(null);
    try {
      const tokenStr = localStorage.getItem('bizflow_token');
      let buyerEntityId = 1;
      if (tokenStr) {
        try {
          const payload = JSON.parse(atob(tokenStr.split('.')[1]));
          if (payload.buyerEntityId) buyerEntityId = payload.buyerEntityId;
        } catch (_) {}
      }

      const items = cartItems.map(item => ({
        productId: item.id,
        qty: item.qty,
        unitPrice: Number(item.price),
        gstRate: Number(item.gstRate) || 0,
        hsnCode: item.hsnCode || '0000',
        name: item.name
      }));

      const orderData = {
        buyerId: buyerEntityId,
        items,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryAddress: deliveryAddress.trim(),
        notes: 'Placed via Storefront',
        tcSignature: signature,
        saveAddressToProfile
      };

      // fetchApi already JSON.stringifies objects — do NOT double-wrap with JSON.stringify
      const result = await fetchApi('/orders', {
        method: 'POST',
        body: orderData
      });

      clearCart();
      setPlacedOrder(result);
      setPlaced(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const creditLimit     = Number(buyerProfile?.credit_limit ?? 100000);
  const usedCredit      = Number(buyerProfile?.used_credit  ?? 0);
  const availableCredit = creditLimit - usedCredit;
  const subtotal        = cartItems.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const totalGst        = cartItems.reduce((s, i) => s + Number(i.price) * i.qty * (Number(i.gstRate) || 0) / 100, 0);
  const creditAfter     = availableCredit - grandTotal;

  if (!buyerInfo) return null;

  if (placed) {
    return (
      <div className="container-fluid" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
          <CheckCircle size={64} color="#10B981" />
        </div>
        <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Order Placed Successfully!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '500px', margin: '0 auto 16px' }}>
          Your order has been submitted for approval. You will receive a Purchase Order &amp; Invoice via email.
        </p>
        {placedOrder && (
          <p style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '32px' }}>
            Order ID: {placedOrder.order_number}
          </p>
        )}
        <Link to="/shop/orders">
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>View My Orders</button>
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container flex-center" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h2>Your cart is empty.</h2>
        <Link to="/shop/catalog"><button className="btn-primary" style={{ marginTop: '16px' }}>Browse Catalog</button></Link>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '28px' }}>Secure Checkout</h1>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '14px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', alignItems: 'start' }}>

        {/* ── Left: Steps ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Step 1: Billing & Delivery */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>1</div>
              Billing &amp; Delivery Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              {/* Business Card */}
              <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-primary)' }}>
                  <Building size={16}/><strong style={{ fontSize: '13px' }}>Business Info</strong>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{buyerInfo.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{buyerInfo.email}</div>
                {buyerProfile?.gstin && <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>GSTIN: {buyerProfile.gstin}</div>}
              </div>

              {/* Delivery Address Card */}
              <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: editingAddress ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)' }}>
                    <Truck size={16}/><strong style={{ fontSize: '13px' }}>Delivery Address</strong>
                  </div>
                  <button onClick={() => setEditingAddress(!editingAddress)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: 0 }}>
                    <Edit3 size={12}/> {editingAddress ? 'Done' : 'Edit'}
                  </button>
                </div>
                {editingAddress ? (
                  <>
                    <textarea
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Enter full delivery address including city, state, pincode…"
                      rows={4}
                      style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', padding: '8px', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none', marginBottom: '8px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={saveAddressToProfile} 
                        onChange={(e) => setSaveAddressToProfile(e.target.checked)} 
                      />
                      Save this address to my profile for future orders
                    </label>
                  </>
                ) : (
                  <div style={{ color: deliveryAddress ? 'var(--text-main)' : 'var(--color-danger)', fontSize: '12px', lineHeight: 1.6 }}>
                    {deliveryAddress || '⚠ No address set. Click Edit to add one.'}
                  </div>
                )}
              </div>
            </div>

            {step === 1 && (
              <div style={{ textAlign: 'right' }}>
                <button className="btn-primary" onClick={() => setStep(2)}
                  disabled={!deliveryAddress.trim()}
                  style={{ opacity: !deliveryAddress.trim() ? 0.5 : 1, cursor: !deliveryAddress.trim() ? 'not-allowed' : 'pointer' }}>
                  Continue to Payment Options
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Payment Terms */}
          <div className="glass-panel" style={{ padding: '28px', opacity: step === 2 ? 1 : 0.55, transition: 'opacity 0.3s' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: step === 2 ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>2</div>
              Payment Terms &amp; Credit
            </h2>

            {step === 2 && (
              <>
                <div style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 600, fontSize: '14px' }}>
                      <ShieldCheck size={18}/> 15-Day B2B Credit Available
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '10px' }}>MSME Compliant</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
                    Payment is due 15 days from the invoice date. No upfront payment required.
                  </p>
                </div>

                <div style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '14px' }}>Credit Limit Check</h3>
                  {[
                    ['Total Credit Limit', `₹${creditLimit.toLocaleString('en-IN')}`, null],
                    ['Currently Used',     `₹${usedCredit.toLocaleString('en-IN')}`, '#F59E0B'],
                    ['This Order',         `+ ₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`, 'var(--color-primary)']
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                      <span style={color ? { color } : {}}>{val}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
                    <span>Remaining After Order</span>
                    <span style={{ color: creditAfter >= 0 ? '#10B981' : 'var(--color-danger)' }}>
                      ₹{creditAfter.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </span>
                  </div>
                  {creditAfter < 0 && (
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', color: 'var(--color-danger)', fontSize: '12px' }}>
                      ⚠ This order exceeds your available credit. Contact your supplier to increase the limit.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Summary Sidebar ── */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Order Summary</h2>

          <div style={{ marginBottom: '12px' }}>
            {cartItems.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: 'var(--text-muted)' }}>
                <span style={{ flex: 1, marginRight: '8px' }}>{item.name} × {item.qty}</span>
                <span>₹{(Number(item.price) * item.qty).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>GST</span>
              <span>₹{totalGst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#10B981' }}>
              <span>Delivery</span><span>Free</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Total</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)' }}>
              ₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}
            </span>
          </div>

          <button
            className="btn-primary"
            disabled={step !== 2 || loading || !deliveryAddress.trim()}
            onClick={handlePlaceOrderClick}
            style={{
              width: '100%', padding: '13px', fontSize: '14px',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              opacity: (step !== 2 || loading || !deliveryAddress.trim()) ? 0.5 : 1,
              cursor: (step !== 2 || loading || !deliveryAddress.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <><span style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Processing…</>
            ) : (
              <>Review &amp; Place Order <ArrowRight size={16} /></>
            )}
          </button>

          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.5 }}>
            By placing this order, you agree to 15-day payment terms as per MSME regulations.
          </div>
        </div>
      </div>

      <CheckoutTerms
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={handlePlaceOrder}
      />
    </div>
  );
};

export default Checkout;
