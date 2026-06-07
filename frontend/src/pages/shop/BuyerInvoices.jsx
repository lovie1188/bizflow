import React, { useState, useEffect } from 'react';
import { FileText, Download, CreditCard, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const BuyerInvoices = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const load = async () => {
      try {
        const res = await fetchApi('/invoices');
        setInvoices(res.data || res || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isLoggedIn, navigate]);

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
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* Sidebar Nav */}
        <aside style={{ width: '220px', flexShrink: 0 }}>
          <div className="glass-panel" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
            <Link to="/shop/orders" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>My Orders</Link>
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
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                            <FileText size={16}/> {inv.invoice_number || inv.id}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{inv.order_number || '—'}</td>
                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>₹{parseFloat(inv.grand_total || inv.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '14px' }}>{dueDate}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: `${color}22`, color, fontWeight: 500 }}>
                            {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <a
                              href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/invoices/${inv.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              title="Download PDF"
                              style={{ background: 'rgba(59,130,246,0.1)', border: 'none', color: 'var(--color-primary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Download size={16}/>
                            </a>
                            {inv.status === 'unpaid' || inv.status === 'overdue' ? (
                              <button
                                className="btn-primary"
                                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => alert(`Payment gateway coming soon for ${inv.invoice_number || inv.id}`)}
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
        </div>

      </div>
    </div>
  );
};

export default BuyerInvoices;
