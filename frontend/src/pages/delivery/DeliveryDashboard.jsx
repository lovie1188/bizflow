import React, { useState, useEffect } from 'react';
import { Package, MapPin, CheckCircle, Navigation, Truck, LogOut, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isDelivery, user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState({ open: false, orderId: null, note: 'Handed directly to receiver' });

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const loadOrders = async () => {
    try {
      setError(null);
      const res = await fetchApi('/orders?limit=50');
      const deliveryOrders = (res.data || []).filter(o => ['approved', 'packed', 'dispatched'].includes(o.status));
      setOrders(deliveryOrders);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) loadOrders();
  }, [isLoggedIn]);

  const updateDeliveryStatus = async (id, status, note) => {
    setActionId(id);
    setError(null);
    try {
      await fetchApi(`/orders/${id}/delivery`, {
        method: 'PUT',
        body: JSON.stringify({ delivery_status: status, tracking_note: note })
      });


      await loadOrders();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionId(null);
    }
  };

  const initials = (user?.name || 'S').charAt(0).toUpperCase();

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Loading assigned deliveries...
    </div>
  );

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0 }}>My Deliveries</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '14px' }}>{orders.length} active tasks</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
            {initials}
          </div>
          <button onClick={logout} title="Logout" style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
          <AlertCircle size={16}/> {error}
        </div>
      )}

      {/* Delivery Note Modal */}
      {deliveryNote.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Add Delivery Note</h3>
            <textarea
              value={deliveryNote.note}
              onChange={e => setDeliveryNote(p => ({ ...p, note: e.target.value }))}
              style={{ width: '100%', minHeight: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', padding: '12px', fontSize: '14px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                updateDeliveryStatus(deliveryNote.orderId, 'delivered', deliveryNote.note || 'Delivered successfully');
                setDeliveryNote({ open: false, orderId: null, note: 'Handed directly to receiver' });
              }}>Confirm Delivery</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeliveryNote({ open: false, orderId: null, note: 'Handed directly to receiver' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
            <p>You have no active deliveries right now.</p>
          </div>
        ) : orders.map(o => (
          <div key={o.id} className="glass-panel" style={{ padding: '16px', borderLeft: `4px solid ${o.status === 'dispatched' ? '#F59E0B' : 'var(--color-primary)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.order_number}</span>
                <h3 style={{ margin: '4px 0', fontSize: '18px' }}>{o.buyer_name || `Buyer #${o.buyer_entity_id}`}</h3>
              </div>
              <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontWeight: 500 }}>
                {o.items_count} items
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{o.delivery_address || 'Address not provided'}</span>
            </div>

            {o.status === 'dispatched' && (
              <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#F59E0B', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Truck size={16} /> Currently Out for Delivery
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(o.delivery_address || '')}`, '_blank')}
                style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Navigation size={16} /> Navigate
              </button>

              {o.status !== 'dispatched' ? (
                <button
                  onClick={() => updateDeliveryStatus(o.id, 'dispatched', 'Package picked up by delivery staff and out for delivery')}
                  disabled={actionId === o.id}
                  style={{ flex: 1, padding: '12px', background: 'var(--color-primary)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: actionId === o.id ? 'not-allowed' : 'pointer', opacity: actionId === o.id ? 0.7 : 1 }}
                >
                  <Truck size={16} /> {actionId === o.id ? 'Updating...' : 'Start Delivery'}
                </button>
              ) : (
                <button
                  onClick={() => setDeliveryNote({ open: true, orderId: o.id, note: 'Handed directly to receiver' })}
                  disabled={actionId === o.id}
                  style={{ flex: 1, padding: '12px', background: '#10B981', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: actionId === o.id ? 'not-allowed' : 'pointer', opacity: actionId === o.id ? 0.7 : 1 }}
                >
                  <CheckCircle size={16} /> {actionId === o.id ? 'Updating...' : 'Mark Delivered'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
