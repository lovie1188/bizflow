import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchApi, API_BASE_URL } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadOrders = (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    fetchApi(`/orders?page=${pageNum}&limit=20`)
      .then(res => {
        const newOrders = res?.data || [];
        if (pageNum === 1) {
          setOrders(newOrders);
        } else {
          setOrders(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = newOrders.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        }
        setHasMore(res?.pagination?.hasNext || false);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => { loadOrders(1); }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadOrders(nextPage);
  };

  const getStatusIcon = (status) => {
    if (status === 'delivered') return <CheckCircle size={28} />;
    if (status === 'dispatched') return <Truck size={28} />;
    return <Package size={28} />;
  };

  const getStatusColor = (status) => {
    if (status === 'delivered') return '#10B981';
    if (status === 'dispatched') return '#3B82F6';
    return '#F59E0B';
  };

  return (
    <div className="container-fluid" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* Sidebar Nav */}
        <aside style={{ width: '250px' }}>
          <div className="glass-panel" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
            <Link to="/shop/orders" style={{ padding: '12px 24px', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', borderRight: '2px solid var(--color-primary)', fontWeight: 500 }}>My Orders</Link>
            <Link to="/shop/purchase-orders" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>Purchase Orders</Link>
            <Link to="/shop/invoices" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>My Invoices</Link>
            <Link to="/shop/profile" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>Business Profile</Link>
          </div>
        </aside>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>My Orders</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Track your wholesale orders and shipments.</p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div className="spinner spinner-lg" />
              <span>Loading your orders…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
              <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)' }}>No orders found</h3>
              <p style={{ margin: 0 }}>You have not placed any wholesale orders yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map(o => (
                <div key={o.id} className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: getStatusColor(o.status) }}>
                      {getStatusIcon(o.status)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', marginBottom: '4px', color: 'var(--color-primary)' }}>{o.order_number}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Ordered on {new Date(o.created_at).toLocaleDateString()} &middot; {o.items_count} items</div>
                      <div style={{ color: getStatusColor(o.status), fontSize: '14px', fontWeight: 500, marginTop: '8px', textTransform: 'capitalize' }}>{o.status}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>₹{Number(o.grand_total).toLocaleString('en-IN')}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <Link to={`/shop/orders/${o.id}`} state={{ order: o }}>
                        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>View Details</button>
                      </Link>
                      {o.po_url && (
                        <button onClick={() => window.open(`${API_BASE_URL}/orders/${o.id}/po-html?token=${localStorage.getItem('bizflow_token')}`, '_blank')} title="View PO"
                          style={{ background:'transparent', border:'1px solid var(--glass-border)', color:'var(--text-muted)', padding:'6px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
                          PO
                        </button>
                      )}
                      {o.status !== 'pending' && o.status !== 'rejected' && (
                        <button onClick={() => window.open(`${API_BASE_URL}/orders/${o.id}/invoice-html?token=${localStorage.getItem('bizflow_token')}`, '_blank')} title="View Invoice"
                          style={{ background:'transparent', border:'1px solid var(--glass-border)', color:'var(--text-muted)', padding:'6px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
                          Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button 
                className="btn-secondary" 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                style={{ padding: '10px 24px' }}
              >
                {loadingMore ? 'Loading...' : 'Load More Orders'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyerOrders;
