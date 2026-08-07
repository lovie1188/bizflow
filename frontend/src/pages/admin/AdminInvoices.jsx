import React, { useState, useEffect } from 'react';
import { Download, CheckSquare, Clock, AlertTriangle, FilePlus, Scale, Volume2 } from 'lucide-react';
import { fetchApi, API_BASE_URL } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { playVoiceAlert } from '../../utils/voiceNotifier';

const AdminInvoices = () => {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchInvoices = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetchApi(`/invoices?page=${pageNum}&limit=20`);
      const newInvoices = (response?.data || []).map(inv => {
        const due = new Date(inv.due_date);
        const today = new Date();
        const diffTime = today - due; // positive if overdue
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        let status = 'unpaid';
        if (inv.paid) status = 'paid';
        else if (diffDays > 0) status = 'overdue';

        return {
          ...inv,
          calculatedDays: diffDays > 0 ? diffDays : Math.abs(diffDays),
          calculatedStatus: status
        };
      });

      if (pageNum === 1) {
        setInvoices(newInvoices);
      } else {
        setInvoices(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newInvoices.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
      }
      setHasMore(response?.pagination?.hasNext || false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchInvoices(nextPage);
  };

  const handleMarkPaid = async (id) => {
    if (window.confirm('Are you sure you want to mark this invoice as paid?')) {
      try {
        await fetchApi(`/invoices/${id}/mark-paid`, { method: 'POST' });
        showToast('Invoice marked as paid successfully');
        fetchInvoices(1);
      } catch (e) {
        showToast(e.message, 'error');
      }
    }
  };

  const filtered = activeTab === 'all' ? invoices : invoices.filter(i => i.calculatedStatus === activeTab);

  const totalOutstanding = invoices.filter(i => !i.paid).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.calculatedStatus === 'overdue').reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.paid).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

  const statusStyle = {
    paid:    { bg:'rgba(16,185,129,0.1)',  color:'#10B981',          label:'✓ Paid' },
    unpaid:  { bg:'rgba(59,130,246,0.1)',  color:'var(--color-primary)', label:'⏳ Pending' },
    overdue: { bg:'rgba(236,72,153,0.1)', color:'var(--color-danger)', label:'⚠ Overdue' },
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'28px', marginBottom:'8px' }}>Invoices</h1>
          <p style={{ color:'var(--text-muted)' }}>Generate, track and manage GST-compliant tax invoices.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'16px', marginBottom:'32px' }}>
        {[
          { icon:<Clock size={22} color="var(--color-primary)"/>,  label:'Outstanding', value:`₹${totalOutstanding.toLocaleString('en-IN')}`, bg:'rgba(59,130,246,0.08)' },
          { icon:<AlertTriangle size={22} color="#F59E0B"/>,        label:'Overdue',     value:`₹${totalOverdue.toLocaleString('en-IN')}`,   bg:'rgba(245,158,11,0.08)', action: 'voice' },
          { icon:<CheckSquare size={22} color="#10B981"/>,          label:'Paid MTD',    value:`₹${totalPaid.toLocaleString('en-IN')}`,   bg:'rgba(16,185,129,0.08)' },
        ].map((c,i) => (
          <div key={i} className="glass-panel" style={{ padding:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ padding:'12px', borderRadius:'12px', background:c.bg }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight:700, fontSize:'20px' }}>{c.value}</div>
              <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>{c.label}</div>
            </div>
            {c.action === 'voice' && totalOverdue > 0 && (
              <button 
                title="Play Audio Warning"
                onClick={() => playVoiceAlert(`Warning. You have ${totalOverdue.toLocaleString('en-IN')} rupees in overdue payments. Compound interest is accruing. Samadhaan filing is advised.`)}
                style={{ background:'rgba(245,158,11,0.1)', color:'#F59E0B', border:'none', padding:'8px', borderRadius:'50%', cursor:'pointer' }}
              >
                <Volume2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'24px' }}>
        {['all','unpaid','overdue','paid'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:'8px 20px', borderRadius:'20px', fontFamily:'inherit', fontWeight:500, fontSize:'14px', cursor:'pointer',
              background: activeTab===t ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'rgba(255,255,255,0.05)',
              color: activeTab===t ? 'white' : 'var(--text-muted)', border: activeTab===t ? 'none' : '1px solid var(--glass-border)' }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding:'24px', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'800px' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--glass-border)', color:'var(--text-muted)', fontSize:'13px', textAlign:'left' }}>
              <th style={{ padding:'12px 16px' }}>Invoice No.</th>
              <th style={{ padding:'12px 16px' }}>Buyer</th>
              <th style={{ padding:'12px 16px' }}>Taxable Amt</th>
              <th style={{ padding:'12px 16px' }}>GST</th>
              <th style={{ padding:'12px 16px' }}>Total</th>
              <th style={{ padding:'12px 16px' }}>Due Date</th>
              <th style={{ padding:'12px 16px' }}>Days</th>
              <th style={{ padding:'12px 16px' }}>Status</th>
              <th style={{ padding:'12px 16px', textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding:'16px', textAlign:'center', color:'var(--text-muted)' }}>Loading invoices...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" style={{ padding:'16px', textAlign:'center', color:'var(--text-muted)' }}>No invoices found.</td></tr>
            ) : filtered.map(inv => {
              const s = statusStyle[inv.calculatedStatus];
              return (
                <tr key={inv.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'16px', fontWeight:600, color:'var(--color-primary)', fontSize:'14px' }}>{inv.invoice_number}</td>
                  <td style={{ padding:'16px' }}>{inv.buyer_name || `Buyer #${inv.buyer_entity_id}`}</td>
                  <td style={{ padding:'16px' }}>₹{parseFloat(inv.taxable_amount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'16px', color:'var(--text-muted)' }}>₹{parseFloat(inv.gst_amount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'16px', fontWeight:700 }}>
                    ₹{parseFloat(inv.amount || 0).toLocaleString('en-IN')}
                    {inv.calculatedStatus === 'overdue' && inv.calculatedDays > 45 && (
                      <div style={{ fontSize:'11px', color:'#EF4444', marginTop:'4px', fontWeight:600 }}>
                        + ₹{((parseFloat(inv.amount || 0) * 19.5 * inv.calculatedDays) / 36500).toLocaleString('en-IN', {maximumFractionDigits:0})} (19.5% p.a.)
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'16px', fontSize:'14px', color: inv.calculatedStatus==='overdue' ? 'var(--color-danger)' : 'var(--text-muted)' }}>{new Date(inv.due_date).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding:'16px', color: inv.calculatedDays>30 ? 'var(--color-danger)' : inv.calculatedDays>15 ? '#F59E0B' : 'var(--text-muted)', fontWeight: inv.calculatedDays>30 ? 700 : 400 }}>
                    {inv.calculatedDays}d
                  </td>
                  <td style={{ padding:'16px' }}>
                    <span style={{ fontSize:'12px', padding:'4px 10px', borderRadius:'4px', background:s.bg, color:s.color, fontWeight:500 }}>{s.label}</span>
                  </td>
                  <td style={{ padding:'16px' }}>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
                      <button 
                        onClick={() => {
                          const token = localStorage.getItem('bizflow_token');
                          window.open(`${API_BASE_URL}/invoices/${inv.id}/pdf?token=${token}`, '_blank');
                        }}
                        title="Download PDF" 
                        style={{ background:'rgba(59,130,246,0.1)', border:'none', color:'var(--color-primary)', padding:'8px', borderRadius:'8px', cursor:'pointer' }}>
                        <Download size={16}/>
                      </button>
                      {inv.calculatedStatus !== 'paid' && (
                        <button onClick={() => handleMarkPaid(inv.id)} style={{ background:'rgba(16,185,129,0.1)', border:'none', color:'#10B981', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:500 }}>Mark Paid</button>
                      )}
                      {inv.calculatedStatus === 'overdue' && inv.calculatedDays > 45 && (
                        <button 
                          onClick={() => window.open('https://samadhaan.msme.gov.in/MyMsme/MSEFC/MSEFC_Welcome.aspx', '_blank')}
                          title="File MSME Samadhaan Complaint"
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#EF4444', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', fontSize:'12px', fontWeight:600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Scale size={14}/> Samadhaan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  );
};

export default AdminInvoices;
