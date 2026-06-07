import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, UserPlus, Phone, Building2, Search, RefreshCw, FileText } from 'lucide-react';
import { fetchApi } from '../../utils/api';

const AdminBuyers = () => {
  const [buyers, setBuyers]         = useState([]);
  const [activeTab, setActiveTab]   = useState('all');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState(null);

  // Approval modal state
  const [showModal, setShowModal]     = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [gracePeriod, setGracePeriod] = useState(7);
  const [agreementFile, setAgreementFile] = useState(null);
  const [saving, setSaving]           = useState(false);

  // Edit credit state
  const [editCreditBuyer, setEditCreditBuyer] = useState(null);
  const [newCreditLimit, setNewCreditLimit] = useState('');

  const loadBuyers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/buyers');
      setBuyers(Array.isArray(res) ? res : (res?.data || []));
    } catch (e) {
      console.error('Failed to load buyers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBuyers(); }, [loadBuyers]);

  const filtered = buyers
    .filter(b => activeTab === 'all' || b.status === activeTab)
    .filter(b => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (b.name   || '').toLowerCase().includes(q) ||
        (b.gstin  || '').toLowerCase().includes(q) ||
        (b.phone  || '').includes(q)
      );
    });

  const countFor = s => buyers.filter(b => b.status === s).length;
  const creditPct = b => Math.min(100, Math.round(((b.used_credit || 0) / (b.credit_limit || 1)) * 100));

  // Open approval modal
  const openApproveModal = b => {
    setSelectedBuyer(b);
    setGracePeriod(7);
    setAgreementFile(null);
    setShowModal(true);
  };

  // Quick reject (no modal needed)
  const handleReject = async (id) => {
    if (!window.confirm('Reject this buyer?')) return;
    setActionId(id);
    try {
      await fetchApi(`/buyers/${id}/approve`, {
        method: 'PUT',
        body: { status: 'rejected' }
      });
      await loadBuyers();
    } catch (e) { alert(e.message); }
    finally { setActionId(null); }
  };

  // Confirm approval (with or without agreement upload)
  const confirmApproval = async () => {
    setSaving(true);
    try {
      if (agreementFile) {
        // Upload agreement file first
        const fd = new FormData();
        fd.append('agreement', agreementFile);
        await fetch(`http://localhost:5000/api/buyers/${selectedBuyer.id}/agreement`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: fd
        });
      }

      // Approve with grace period
      await fetchApi(`/buyers/${selectedBuyer.id}/approve`, {
        method: 'PUT',
        body: { status: 'approved', gracePeriodDays: agreementFile ? 0 : Number(gracePeriod) }
      });

      setShowModal(false);
      await loadBuyers();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCreditSave = async () => {
    if (!newCreditLimit || isNaN(newCreditLimit)) return alert('Enter a valid amount');
    setSaving(true);
    try {
      await fetchApi(`/buyers/${editCreditBuyer.id}/credit`, {
        method: 'PUT',
        body: { creditLimit: Number(newCreditLimit) }
      });
      setEditCreditBuyer(null);
      await loadBuyers();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const tabStyle = (active) => ({
    padding: '8px 18px', borderRadius: '20px', fontFamily: 'inherit',
    fontWeight: 500, fontSize: '13px', cursor: 'pointer',
    background: active ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'rgba(255,255,255,0.05)',
    color: active ? 'white' : 'var(--text-muted)',
    border: active ? 'none' : '1px solid var(--glass-border)',
    display: 'flex', alignItems: 'center', gap: '6px'
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'28px', marginBottom:'8px' }}>Buyer Management</h1>
          <p style={{ color:'var(--text-muted)' }}>Approve registrations, set credit limits, manage agreements.</p>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={loadBuyers} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'14px' }}>
            <RefreshCw size={16}/> Refresh
          </button>
          <button className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <UserPlus size={18}/> Add Buyer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        {['all','pending','approved','rejected'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(activeTab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t !== 'all' && countFor(t) > 0 && (
              <span style={{ background:'rgba(255,255,255,0.25)', padding:'1px 7px', borderRadius:'10px', fontSize:'11px' }}>
                {countFor(t)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:'relative', marginBottom:'24px', maxWidth:'400px' }}>
        <Search size={18} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input type="text" placeholder="Search by name, GSTIN or phone…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', padding:'11px 16px 11px 44px', borderRadius:'var(--radius-md)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none' }}/>
      </div>

      {/* Buyer Cards */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--text-muted)' }}>
          <div style={{ width:'36px', height:'36px', border:'3px solid var(--glass-border)', borderTopColor:'var(--color-primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
          Loading buyers…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--text-muted)' }}>No buyers found.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:'16px' }}>
          {filtered.map(b => {
            const pct = creditPct(b);
            const isActioning = actionId === b.id;
            const hasAgreement = b.agreement_signed || b.agreement_url;
            const isGraceExpired = b.grace_period_expires_at && new Date() > new Date(b.grace_period_expires_at);

            return (
              <div key={b.id} className="glass-panel" style={{ padding:'20px', opacity: isActioning ? 0.6 : 1, transition:'opacity 0.2s' }}>
                {/* Card Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                  <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'18px', flexShrink:0 }}>
                      {(b.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin:0, fontSize:'15px', marginBottom:'2px' }}>{b.name}</h3>
                      <span style={{ color:'var(--text-muted)', fontSize:'12px' }}>{b.city || 'N/A'}</span>
                      {b.msme_type && <span style={{ marginLeft:'8px', background:'rgba(6,182,212,0.15)', color:'var(--color-secondary)', fontSize:'11px', padding:'2px 6px', borderRadius:'4px' }}>MSME {b.msme_type}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'4px', flexShrink:0,
                    background: b.status==='approved' ? 'rgba(16,185,129,0.1)' : b.status==='rejected' ? 'rgba(236,72,153,0.1)' : 'rgba(245,158,11,0.1)',
                    color: b.status==='approved' ? '#10B981' : b.status==='rejected' ? 'var(--color-danger)' : '#F59E0B',
                    fontWeight:500 }}>
                    {b.status === 'approved' ? '✓ Approved' : b.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                  </span>
                </div>

                {/* Info */}
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'var(--text-muted)', fontSize:'13px' }}>
                    <Building2 size={13}/> GSTIN: <strong style={{ color:'var(--text-main)' }}>{b.gstin || '—'}</strong>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'var(--text-muted)', fontSize:'13px' }}>
                    <Phone size={13}/> {b.phone || '—'}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
                    <FileText size={13}/>
                    {hasAgreement
                      ? <span style={{ color:'#10B981' }}>Agreement ✓</span>
                      : b.grace_period_days > 0
                        ? <span style={{ color: isGraceExpired ? 'var(--color-danger)' : '#F59E0B' }}>
                            {isGraceExpired ? '⚠ Grace Expired' : `Grace: ${b.grace_period_days}d`}
                          </span>
                        : <span style={{ color:'var(--color-danger)' }}>No Agreement</span>
                    }
                    <button onClick={() => window.open(`http://localhost:5000/api/buyers/${b.id}/generate-agreement?token=${localStorage.getItem('bizflow_token')}`, '_blank')}
                      style={{ marginLeft:'auto', padding:'4px 8px', borderRadius:'4px', background:'rgba(255,255,255,0.1)', color:'white', fontSize:'11px', cursor:'pointer' }}>
                      Download PDF
                    </button>
                  </div>
                </div>

                {/* Credit Bar */}
                <div style={{ marginBottom:'16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'12px' }}>
                    <span style={{ color:'var(--text-muted)' }}>Credit Used</span>
                    <span style={{ fontWeight:500 }}>₹{(b.used_credit||0).toLocaleString('en-IN')} / ₹{(b.credit_limit||0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height:'5px', background:'rgba(255,255,255,0.08)', borderRadius:'3px' }}>
                    <div style={{ height:'100%', borderRadius:'3px', width:`${pct}%`,
                      background: pct > 80 ? 'var(--color-danger)' : pct > 50 ? '#F59E0B' : 'var(--color-secondary)', transition:'width 0.4s' }}/>
                  </div>
                  <div style={{ textAlign:'right', fontSize:'11px', color:'var(--text-muted)', marginTop:'3px' }}>{pct}% used</div>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:'8px' }}>
                  {isActioning ? (
                    <span style={{ color:'var(--text-muted)', fontSize:'13px' }}>Processing…</span>
                  ) : b.status === 'pending' ? (
                    <>
                      <button onClick={() => openApproveModal(b)}
                        style={{ flex:1, padding:'8px', borderRadius:'8px', background:'rgba(16,185,129,0.15)', color:'#10B981', border:'1px solid rgba(16,185,129,0.3)', cursor:'pointer', fontFamily:'inherit', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px' }}>
                        <CheckCircle size={14}/> Approve
                      </button>
                      <button onClick={() => handleReject(b.id)}
                        style={{ flex:1, padding:'8px', borderRadius:'8px', background:'rgba(236,72,153,0.1)', color:'var(--color-danger)', border:'1px solid rgba(236,72,153,0.2)', cursor:'pointer', fontFamily:'inherit', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px' }}>
                        <XCircle size={14}/> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => {
                        setEditCreditBuyer(b);
                        setNewCreditLimit(b.credit_limit || '');
                      }} className="btn-secondary" style={{ flex:1, padding:'7px', fontSize:'12px' }}>Edit Credit</button>
                      <button onClick={() => window.location.href = `/admin/orders?buyerId=${b.id}`} className="btn-secondary" style={{ flex:1, padding:'7px', fontSize:'12px' }}>View Orders</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="glass-panel" style={{ padding:'28px', maxWidth:'440px', width:'100%', margin:'16px' }}>
            <h3 style={{ margin:'0 0 8px', fontSize:'20px', color:'var(--color-primary)' }}>Approve Buyer</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'14px', marginBottom:'20px', lineHeight:1.5 }}>
              <strong>{selectedBuyer?.name}</strong> {selectedBuyer?.agreement_url ? 'has' : 'has not'} uploaded the MSME Buyer-Supplier Agreement.
            </p>

            {/* Upload Agreement */}
            <div style={{ marginBottom:'16px', padding:'14px', background:'rgba(255,255,255,0.04)', borderRadius:'8px', border:'1px solid var(--glass-border)' }}>
              <label style={{ display:'block', marginBottom:'8px', fontSize:'13px', fontWeight:500 }}>
                Upload Agreement on Behalf of Buyer (Optional):
              </label>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => setAgreementFile(e.target.files[0] || null)}
                style={{ width:'100%', fontSize:'12px', color:'var(--text-muted)' }}/>
              {agreementFile && <div style={{ fontSize:'12px', color:'#10B981', marginTop:'6px' }}>✓ {agreementFile.name}</div>}
            </div>

            {/* Grace Period — only shown if no agreement uploaded */}
            {!agreementFile && (
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', marginBottom:'6px', fontSize:'13px', fontWeight:500 }}>Provisional Grace Period:</label>
                <p style={{ fontSize:'12px', color:'var(--color-danger)', marginBottom:'8px' }}>
                  Without an agreement this is a <strong>Provisional Approval</strong>. Buyer will be blocked from ordering after the grace period.
                </p>
                <select value={gracePeriod} onChange={e => setGracePeriod(e.target.value)}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', background:'rgba(15,23,42,0.95)', color:'white', border:'1px solid var(--glass-border)', outline:'none', fontFamily:'inherit' }}>
                  <option value={7}>7 Days</option>
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={0}>No Grace — Restrict Immediately</option>
                </select>
              </div>
            )}

            <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
              <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding:'9px 20px' }} disabled={saving}>Cancel</button>
              <button onClick={confirmApproval} className="btn-primary" style={{ padding:'9px 24px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : agreementFile ? 'Upload & Approve' : 'Confirm Provisional Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Credit Modal */}
      {editCreditBuyer && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="glass-panel" style={{ padding:'28px', maxWidth:'400px', width:'100%', margin:'16px' }}>
            <h3 style={{ margin:'0 0 8px', fontSize:'20px', color:'var(--color-primary)' }}>Edit Credit Limit</h3>
            <p style={{ color:'var(--text-muted)', fontSize:'14px', marginBottom:'20px', lineHeight:1.5 }}>
              Set new credit limit for <strong>{editCreditBuyer.name}</strong>.
            </p>
            
            <label style={{ display:'block', marginBottom:'16px' }}>
              <span style={{ display:'block', marginBottom:'8px', fontSize:'13px', color:'var(--text-muted)' }}>Credit Limit (₹)</span>
              <input type="number" className="form-input" value={newCreditLimit} onChange={e => setNewCreditLimit(e.target.value)} placeholder="e.g. 500000" />
            </label>
            
            <div style={{ display:'flex', gap:'12px', marginTop:'24px' }}>
              <button onClick={() => setEditCreditBuyer(null)} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', color:'var(--text-muted)', border:'1px solid var(--glass-border)', cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleEditCreditSave} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:'8px', background:'var(--color-primary)', color:'white', border:'none', cursor:'pointer', fontWeight:500 }}>
                {saving ? 'Saving...' : 'Save Limit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBuyers;
