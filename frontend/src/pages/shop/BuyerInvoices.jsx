import React, { useState, useEffect } from 'react';
import { FileText, Download, CreditCard, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi, API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const BuyerInvoices = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // razorpay feature status: globally enabled AND company subscribed
  const [razorpayActive, setRazorpayActive] = useState(false);
  const showToast = useToast();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await fetchApi(`/invoices?page=${pageNum}&limit=20`);
      const newInvoices = res?.data || res || [];
      
      if (pageNum === 1) {
        setInvoices(newInvoices);
      } else {
        setInvoices(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newInvoices.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }
      setHasMore(res?.pagination?.hasNext || false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    // Fetch company-level feature status (global flag + subscription check in one call)
    const fetchFeatures = async () => {
      try {
        const data = await fetchApi('/settings/company-features');
        // active = globally_enabled AND subscribed
        setRazorpayActive(data?.razorpay?.active === true);
      } catch (err) {
        console.error('Failed to load feature settings:', err);
        setRazorpayActive(false);
      }
    };
    fetchFeatures();
    load(1);
  }, [isLoggedIn, navigate]);


  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage);
  };

  const handlePayment = async (inv) => {
    try {
      // 1. Create Razorpay order on backend
      const res = await fetchApi('/payments/create-order', {
        method: 'POST',
        body: { invoiceId: inv.id } // M-6: fetchApi handles JSON.stringify internally
      });

      if (!res.orderId) {
        throw new Error('Failed to create Razorpay order');
      }

      // 2. Configure Razorpay options
      const options = {
        key: res.key,
        amount: res.amount,
        currency: res.currency,
        name: "BizFlow",
        description: `Payment for Invoice ${inv.invoice_number || inv.id}`,
        order_id: res.orderId,
        handler: function (response) {
          // 3. Callback on success - the webhook handles DB update, but we can optimistically reload
          showToast(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          load(1); // Reload to reflect paid status
        },
        prefill: {
          name: "Buyer",
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        showToast(`Payment failed: ${response.error.description}`, 'error');
      });
      rzp.open();
    } catch (err) {
      showToast(`Error initiating payment: ${err.message}`, 'error');
    }
  };

  const statusColor = (status) => {
    if (!status) return 'var(--text-muted)';
    const s = status.toLowerCase();
    if (s === 'paid') return '#10B981';
    if (s === 'overdue') return '#EF4444';
    return '#F59E0B';
  };

  if (loading) return (
    <div className="container flex-center" style={{ minHeight: '50vh' }}>
      <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} color="var(--color-primary)" />
    </div>
  );

  return (
    <div className="container-fluid" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* Sidebar Nav */}
        <aside style={{ width: '220px', flexShrink: 0 }}>
          <div className="glass-panel" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
            <Link to="/shop/orders" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>My Orders</Link>
            <Link to="/shop/purchase-orders" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>Purchase Orders</Link>
            <Link to="/shop/invoices" style={{ padding: '12px 24px', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', borderRight: '2px solid var(--color-primary)', fontWeight: 500 }}>My Invoices</Link>
            <Link to="/shop/profile" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>Business Profile</Link>
          </div>
        </aside>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>My Invoices</h1>
              <p style={{ color: 'var(--text-muted)' }}>View and pay your pending wholesale invoices.</p>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>
          )}

          <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
            {invoices.length === 0 && !loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>No invoices found.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'left', background: 'rgba(0,0,0,0.15)' }}>
                    <th style={{ padding: '16px 24px' }}>Invoice No.</th>
                    <th style={{ padding: '16px 24px' }}>Order Ref</th>
                    <th style={{ padding: '16px 24px' }}>Total Amount</th>
                    <th style={{ padding: '16px 24px' }}>Due Date</th>
                    <th style={{ padding: '16px 24px' }}>Status</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const color = statusColor(inv.status);
                    const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                    
                    const due = new Date(inv.due_date);
                    const diffTime = new Date() - due;
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const isOverdue = inv.status === 'overdue' && diffDays > 45;
                    const principal = parseFloat(inv.grand_total || inv.total_amount || 0);

                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                            <FileText size={16}/> {inv.invoice_number || inv.id}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{inv.order_number || '—'}</td>
                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                          ₹{principal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          {isOverdue && (
                            <div style={{ fontSize:'11px', color:'#EF4444', marginTop:'4px', fontWeight:600 }}>
                              + ₹{((principal * 19.5 * diffDays) / 36500).toLocaleString('en-IN', {maximumFractionDigits:0})} (19.5% p.a.)
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{dueDate}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: `${color}22`, color, fontWeight: 500 }}>
                            {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => {
                                const token = localStorage.getItem('bizflow_token');
                                window.open(`${API_BASE_URL}/invoices/${inv.id}/pdf?token=${token}`, '_blank');
                              }}
                              title="Download PDF"
                              style={{ background: 'rgba(59,130,246,0.1)', border: 'none', color: 'var(--color-primary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Download size={16}/>
                            </button>
                            {razorpayActive && (inv.status === 'unpaid' || inv.status === 'overdue') ? (
                              <button
                                className="btn-primary"
                                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => handlePayment(inv)}
                              >
                                <CreditCard size={14}/> Pay Now
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button 
                className="btn-secondary" 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                style={{ padding: '10px 24px' }}
              >
                {loadingMore ? 'Loading...' : 'Load More Invoices'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyerInvoices;
