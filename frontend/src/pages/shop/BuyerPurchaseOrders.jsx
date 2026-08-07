import React, { useState, useEffect } from 'react';
import { FileDown, FileText, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchApi, API_BASE_URL } from '../../utils/api';

const BuyerPurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusColor = (status) => {
    const map = {
      delivered: '#10B981',
      dispatched: '#3B82F6',
      approved: '#8B5CF6',
      rejected: '#EF4444',
      cancelled: '#EF4444',
    };
    return map[status] || '#F59E0B';
  };

  const sidebarLink = (to, label, active) => ({
    display: 'block',
    padding: '12px 24px',
    color: active ? 'var(--color-primary)' : 'var(--text-main)',
    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
    borderRight: active ? '2px solid var(--color-primary)' : '2px solid transparent',
    fontWeight: active ? 500 : 400,
    textDecoration: 'none',
  });

  return (
    <div className="container-fluid" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: '32px' }}>

        {/* Sidebar Nav */}
        <aside style={{ width: '250px', flexShrink: 0 }}>
          <div className="glass-panel" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
            <Link to="/shop/orders"     style={sidebarLink('/shop/orders', 'My Orders', false)}>My Orders</Link>
            <Link to="/shop/purchase-orders" style={sidebarLink('/shop/purchase-orders', 'Purchase Orders', true)}>Purchase Orders</Link>
            <Link to="/shop/invoices"   style={sidebarLink('/shop/invoices', 'My Invoices', false)}>My Invoices</Link>
            <Link to="/shop/profile"    style={sidebarLink('/shop/profile', 'Business Profile', false)}>Business Profile</Link>
          </div>
        </aside>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Purchase Orders</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Download the Purchase Order PDF for every order you have placed.
          </p>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading purchase orders...</p>
          ) : orders.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
              <Package size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>No purchase orders yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Place your first order to generate a PO.</p>
              <Link to="/shop/catalog">
                <button className="btn-primary">Browse Catalog</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {orders.map(o => (
                <div
                  key={o.id}
                  className="glass-panel"
                  style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}
                >
                  {/* Left: order info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'var(--color-primary)' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '2px' }}>{o.order_number}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        &nbsp;·&nbsp;{o.items_count} item{o.items_count !== 1 ? 's' : ''}
                        &nbsp;·&nbsp;₹{Number(o.grand_total).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Right: status + download */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      background: `${getStatusColor(o.status)}22`,
                      color: getStatusColor(o.status),
                    }}>
                      {o.status}
                    </span>
                    {o.po_url ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`${API_BASE_URL}/orders/${o.id}/po-html?token=${localStorage.getItem('bizflow_token')}`, '_blank');
                        }}
                        style={{ textDecoration: 'none' }}
                      >
                        <button
                          className="btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
                        >
                          <FileDown size={16} /> Download PO
                        </button>
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>PO pending</span>
                    )}

                    <Link to={`/shop/orders/${o.id}`} state={{ order: o }}>
                      <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                        Details
                      </button>
                    </Link>
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

export default BuyerPurchaseOrders;
