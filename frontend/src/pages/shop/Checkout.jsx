import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, ArrowRight, Building, MapPin, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { fetchApi } from '../../utils/api';
import CheckoutTerms from './CheckoutTerms';

const Checkout = () => {
  const [step, setStep] = useState(1);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  
  const { cartItems, grandTotal, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Basic auth check
    const userStr = localStorage.getItem('bizflow_user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setBuyerInfo({
        name: user.name,
        email: user.email,
        address: 'Delivery address will be mapped to your registered location.',
        availableCredit: 100000,
        usedCredit: 0
      });
    } catch (e) {}
  }, [navigate]);

  const handlePlaceOrderClick = () => {
    setShowTerms(true);
  };

  const handlePlaceOrder = async (signature) => {
    setShowTerms(false);
    setLoading(true);
    setError(null);
    try {
      const tokenStr = localStorage.getItem('bizflow_token');
      let buyerEntityId = 1; // fallback
      if (tokenStr) {
        const payload = JSON.parse(atob(tokenStr.split('.')[1]));
        if (payload.buyerEntityId) buyerEntityId = payload.buyerEntityId;
      }

      const items = cartItems.map(item => ({
        productId: item.id,
        qty: item.qty,
        unitPrice: item.price,
        gstRate: item.gstRate || 0,
        hsnCode: item.hsnCode || '0000',
        name: item.name
      }));

      const orderData = {
        buyerId: buyerEntityId,
        items,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryAddress: buyerInfo?.address || 'Default Address',
        notes: 'Placed via Storefront',
        tcSignature: signature
      };

      const result = await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      clearCart();
      setPlaced(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!buyerInfo) return null;

  if (placed) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
          <CheckCircle size={64} color="#10B981" />
        </div>
        <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>Order Placed Successfully!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Your order has been submitted for approval. You will receive an invoice upon dispatch.
        </p>
        <Link to="/shop/orders">
          <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>View My Orders</button>
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container flex-center" style={{ padding: '60px 24px' }}>
        <h2>Your cart is empty.</h2>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '32px' }}>Secure Checkout</h1>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <strong>Error placing order:</strong> {error}
        </div>
      )}

      <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Checkout Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Step 1: Billing & Delivery Info */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>1</div>
              Billing & Delivery Details
            </h2>
            
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--color-primary)' }}>
                  <Building size={18}/> <h3 style={{ fontSize: '16px', margin: 0 }}>Business Info</h3>
                </div>
                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>{buyerInfo.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px', lineHeight: 1.5 }}>
                  {buyerInfo.email}
                </div>
              </div>
              
              <div style={{ flex: 1, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--color-secondary)' }}>
                  <Truck size={18}/> <h3 style={{ fontSize: '16px', margin: 0 }}>Delivery Address</h3>
                </div>
                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>{buyerInfo.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px', lineHeight: 1.5 }}>
                  {buyerInfo.address}
                </div>
              </div>
            </div>

            {step === 1 && (
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button className="btn-primary" onClick={() => setStep(2)}>Continue to Payment Options</button>
              </div>
            )}
          </div>

          {/* Step 2: Payment Terms */}
          <div className="glass-panel" style={{ padding: '32px', opacity: step === 2 ? 1 : 0.5, transition: 'opacity 0.3s' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step === 2 ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>2</div>
              Payment Terms & Credit
            </h2>

            {step === 2 && (
              <>
                <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 600 }}>
                      <ShieldCheck size={20}/> 15-Day B2B Credit Available
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>MSME Compliant</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                    Your order will be processed on credit. Payment is due 15 days from the date of invoice. No upfront payment required.
                  </p>
                </div>

                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Credit Limit Check</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Approved Limit</span>
                    <span>₹{buyerInfo.availableCredit.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>This Order</span>
                    <span style={{ color: 'var(--color-primary)' }}>+ ₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 600 }}>
                    <span>Remaining Credit After Order</span>
                    <span style={{ color: '#10B981' }}>₹{(buyerInfo.availableCredit - grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar: Place Order */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Checkout Summary</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>{cartItems.length} Items</span>
            <span>₹{(grandTotal - (cartItems.reduce((acc, item) => acc + (item.price * item.qty * (item.gstRate || 0) / 100), 0))).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>GST</span>
            <span>Included in item details</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '24px', color: '#10B981' }}>
            <span>Delivery</span>
            <span>Free</span>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <span style={{ fontSize: '16px', fontWeight: 500 }}>Total Amount</span>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)' }}>₹{grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>

          <button 
            className="btn-primary" 
            disabled={step !== 2 || loading}
            onClick={handlePlaceOrderClick}
            style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (step !== 2 || loading) ? 0.5 : 1, cursor: (step !== 2 || loading) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Processing...' : 'Review & Place Order'} <ArrowRight size={20} />
          </button>
          
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: 1.5 }}>
            By placing this order, you agree to the 15-day payment terms as per MSME regulations.
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
