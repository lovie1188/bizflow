import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Truck, Eye, Search, RefreshCw } from 'lucide-react';
import { fetchApi } from '../../utils/api';

const statusConfig = {
  'pending':    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   label: 'Pending Approval' },
  'approved':   { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',   label: 'Approved' },
  'dispatched': { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',   label: 'Dispatched' },
  'delivered':  { color: '#10B981', bg: 'rgba(16,185,129,0.1)',   label: 'Delivered' },
  'rejected':   { color: '#EC4899', bg: 'rgba(236,72,153,0.1)',   label: 'Rejected' },
};

const AdminOrders = () => {
  const [orders, setOrders]         = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState(null); // tracks which row is being updated

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/orders?limit=100');
      setOrders(res?.data || []);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (id, status) => {
    setActionId(id);
    try {
      if (status === 'dispatched' || status === 'delivered') {
        // Use the delivery endpoint for these statuses to ensure tracking is logged
        await fetchApi(`/orders/${id}/delivery`, { 
          method: 'PUT', 
          body: { 
            delivery_status: status,
            tracking_note: `Order marked as ${status} by Supplier` 
          } 
        });
      } else {
        // For other statuses (approved, rejected) use the basic status endpoint
        await fetchApi(`/orders/${id}/status`, { 
          method: 'PUT', 
          body: { status } 
        });
      }
      await loadOrders();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  // Filter by tab + search
  const filtered = orders
    .filter(o => activeFilter === 'all' || o.status === activeFilter)
    .filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.buyer_name   || '').toLowerCase().includes(q)
      );
    });

  const countFor = (status) => orders.filter(o => o.status === status).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'28px', marginBottom:'8px' }}>Order Management</h1>
          <p style={{ color:'var(--text-muted)' }}>Approve, dispatch and track all buyer orders.</p>
        </div>
        <button onClick={loadOrders} className="btn-secondary"
          style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'14px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Quick Filter Tabs */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        {['all','pending','approved','dispatched','delivered','rejected'].map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            style={{
              padding:'8px 18px', borderRadius:'20px', fontFamily:'inherit',
              fontWeight:500, fontSize:'13px', cursor:'pointer',
              background: activeFilter === f
                ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                : 'rgba(255,255,255,0.05)',
              color: activeFilter === f ? 'white' : 'var(--text-muted)',
              border: activeFilter === f ? 'none' : '1px solid var(--glass-border)',
              display:'flex', alignItems:'center', gap:'6px'
            }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && countFor(f) > 0 && (
              <span style={{ background:'rgba(255,255,255,0.25)', padding:'1px 7px', borderRadius:'10px', fontSize:'11px' }}>
                {countFor(f)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:'20px', maxWidth:'400px' }}>
        <Search size={18} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by Order ID or Buyer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'11px 16px 11px 44px', borderRadius:'var(--radius-md)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}
        />
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding:'0', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'800px' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--glass-border)', color:'var(--text-muted)', fontSize:'13px', textAlign:'left', background:'rgba(0,0,0,0.15)' }}>
              <th style={{ padding:'14px 16px' }}>Order ID</th>
              <th style={{ padding:'14px 16px' }}>Buyer</th>
              <th style={{ padding:'14px 16px' }}>Items</th>
              <th style={{ padding:'14px 16px' }}>Amount</th>
              <th style={{ padding:'14px 16px' }}>Due Date</th>
              <th style={{ padding:'14px 16px' }}>Date</th>
              <th style={{ padding:'14px 16px' }}>Status</th>
              <th style={{ padding:'14px 16px', textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:'48px', textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'32px', height:'32px', border:'3px solid var(--glass-border)', borderTopColor:'var(--color-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                  Loading orders…
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:'48px', textAlign:'center', color:'var(--text-muted)' }}>
                No orders found.
              </td></tr>
            ) : filtered.map(o => {
              const s = statusConfig[o.status] || statusConfig['pending'];
              const isActioning = actionId === o.id;
              return (
                <tr key={o.id}
                  style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', opacity: isActioning ? 0.6 : 1, transition:'opacity 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={e  => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding:'14px 16px', fontWeight:600, color:'var(--color-primary)', fontSize:'14px' }}>
                    {o.order_number}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    {o.buyer_name || `Buyer #${o.buyer_entity_id || o.buyer_id}`}
                  </td>
                  <td style={{ padding:'14px 16px', color:'var(--text-muted)' }}>
                    {o.items_count || '—'} items
                  </td>
                  <td style={{ padding:'14px 16px', fontWeight:600 }}>
                    ₹{parseFloat(o.grand_total || o.total_amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding:'14px 16px', color:'var(--text-muted)', fontSize:'14px' }}>
                    {o.due_date ? new Date(o.due_date).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ padding:'14px 16px', color:'var(--text-muted)', fontSize:'13px' }}>
                    {new Date(o.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{ fontSize:'12px', padding:'4px 10px', borderRadius:'4px', background:s.bg, color:s.color, fontWeight:500 }}>
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
                      {isActioning ? (
                        <span style={{ color:'var(--text-muted)', fontSize:'13px' }}>Saving…</span>
                      ) : (
                        <>
                          {o.po_url && (
                            <button onClick={() => window.open(`http://localhost:5000${o.po_url}`, '_blank')} title="View PO"
                              style={{ background:'transparent', border:'1px solid var(--glass-border)', color:'var(--text-muted)', padding:'6px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
                              PO
                            </button>
                          )}
                          {o.invoice_url && (
                            <button onClick={() => window.open(`http://localhost:5000${o.invoice_url}`, '_blank')} title="View Invoice"
                              style={{ background:'transparent', border:'1px solid var(--glass-border)', color:'var(--text-muted)', padding:'6px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px' }}>
                              INV
                            </button>
                          )}
                          {o.status === 'pending' && <>
                            <button
                              onClick={() => updateStatus(o.id, 'approved')}
                              title="Approve"
                              style={{ background:'rgba(16,185,129,0.1)', border:'none', color:'#10B981', padding:'8px', borderRadius:'8px', cursor:'pointer' }}>
                              <CheckCircle size={16}/>
                            </button>
                            <button
                              onClick={() => updateStatus(o.id, 'rejected')}
                              title="Reject"
                              style={{ background:'rgba(236,72,153,0.1)', border:'none', color:'var(--color-danger)', padding:'8px', borderRadius:'8px', cursor:'pointer' }}>
                              <XCircle size={16}/>
                            </button>
                          </>}
                          {o.status === 'approved' && (
                            <button
                              onClick={() => updateStatus(o.id, 'dispatched')}
                              title="Mark Dispatched"
                              style={{ background:'rgba(139,92,246,0.1)', border:'none', color:'var(--color-accent)', padding:'8px', borderRadius:'8px', cursor:'pointer' }}>
                              <Truck size={16}/>
                            </button>
                          )}
                          {o.status === 'dispatched' && (
                            <button
                              onClick={() => updateStatus(o.id, 'delivered')}
                              title="Mark Delivered"
                              style={{ background:'rgba(16,185,129,0.1)', border:'none', color:'#10B981', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:500 }}>
                              Delivered
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && (
          <div style={{ padding:'14px 20px', borderTop:'1px solid var(--glass-border)', color:'var(--text-muted)', fontSize:'13px' }}>
            Showing {filtered.length} of {orders.length} orders
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
