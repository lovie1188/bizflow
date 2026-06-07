import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, FileText, Download, AlertTriangle, ArrowLeft } from 'lucide-react';
import { fetchApi, API_URL } from '../../utils/api';

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (!order) {
      // In a real app, you'd fetch the specific order by ID
      // For now, we fetch all and find it
      fetchApi('/orders')
        .then(res => {
          const found = res.data?.find(o => o.id.toString() === id);
          if (found) setOrder(found);
          else navigate('/shop/orders');
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, order, navigate]);

  if (loading) return <div className="container flex-center">Loading order details...</div>;
  if (!order) return <div className="container flex-center">Order not found.</div>;

  // Delivery & Return Logic
  const isDelivered = order.status === 'delivered';
  const deliveredAt = order.delivered_at ? new Date(order.delivered_at) : null;
  const now = new Date();
  
  let hoursSinceDelivery = 0;
  if (isDelivered && deliveredAt) {
    hoursSinceDelivery = (now - deliveredAt) / (1000 * 60 * 60);
  }

  const canReportDamage = isDelivered && hoursSinceDelivery <= 12;
  const canReturn = isDelivered && hoursSinceDelivery <= 24;
  const isExpired = isDelivered && hoursSinceDelivery > 72;

  let returnMessage = "";
  if (isDelivered) {
    if (canReportDamage) returnMessage = "You have up to 12h to report damage, and 24h for general returns.";
    else if (canReturn) returnMessage = "You can request a return for another " + Math.floor(24 - hoursSinceDelivery) + " hours.";
    else if (!isExpired) returnMessage = "Standard return window closed. No returns after 72 hours.";
    else returnMessage = "Return period has strictly expired (72h limit passed).";
  }

  // Tracking History
  let tracking = [];
  try {
    tracking = typeof order.delivery_tracking === 'string' ? JSON.parse(order.delivery_tracking) : (order.delivery_tracking || []);
  } catch(e){}

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <Link to="/shop/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '24px' }}>
        <ArrowLeft size={18} /> Back to Orders
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Order {order.order_number}</h1>
          <div style={{ color: 'var(--text-muted)' }}>Placed on {new Date(order.created_at).toLocaleString()}</div>
        </div>
        <div style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', borderRadius: '8px', fontWeight: 600, textTransform: 'capitalize' }}>
          {order.status}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Timeline & Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20}/> Delivery Tracking
            </h2>
            
            {tracking.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Awaiting dispatch...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--glass-border)', marginLeft: '10px', paddingLeft: '20px' }}>
                {tracking.map((t, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-29px', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: t.status === 'delivered' ? '#10B981' : 'var(--color-primary)' }}></div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{t.status}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(t.timestamp).toLocaleString()}</div>
                    {t.note && <div style={{ fontSize: '14px', marginTop: '4px' }}>{t.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isDelivered && (
            <div className="glass-panel" style={{ padding: '24px', border: canReturn || canReportDamage ? '1px solid #10B981' : '1px solid #EF4444' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color={canReturn ? "#10B981" : "#EF4444"}/> Returns & Replacements
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{returnMessage}</p>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="btn-secondary" disabled={!canReportDamage} style={{ opacity: canReportDamage ? 1 : 0.5, cursor: canReportDamage ? 'pointer' : 'not-allowed' }}>
                  Report Damaged Goods (12h)
                </button>
                <button className="btn-secondary" disabled={!canReturn} style={{ opacity: canReturn ? 1 : 0.5, cursor: canReturn ? 'pointer' : 'not-allowed' }}>
                  Request Return (24h)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Docs & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20}/> Documents
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.po_url ? (
                <a href={`${API_URL.replace('/api', '')}${order.po_url}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18}/> Purchase Order</div>
                  <Download size={18}/>
                </a>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>PO not generated</div>
              )}

              {order.invoice_url ? (
                <a href={`${API_URL.replace('/api', '')}${order.invoice_url}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18}/> Tax Invoice</div>
                  <Download size={18}/>
                </a>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>Invoice not generated</div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>₹{Number(order.subtotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>GST Total</span>
              <span>₹{Number(order.gst_amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            
            <div style={{ borderTop: '1px solid var(--glass-border)', margin: '16px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 600 }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--color-primary)' }}>₹{Number(order.grand_total).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
