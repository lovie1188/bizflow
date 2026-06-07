import React, { useState, useEffect } from 'react';
import { Settings, Building2, MapPin, Phone, Mail, CreditCard, Plus, Trash2, FileText } from 'lucide-react';
import { fetchApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const AdminSettings = () => {
  const { updateCompany } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [company, setCompany] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bank Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [newBank, setNewBank] = useState({ account_name: '', bank_name: '', account_no: '', ifsc: '', upi_id: '', owner_name: '', is_default: false });
  const [addingBank, setAddingBank] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchApi('/companies/settings');
        setCompany(res);
        const bankRes = await fetchApi('/companies/banks');
        setBanks(bankRes);
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveCompany = async (e) => {
    if(e) e.preventDefault();
    setSaving(true);
    try {
      const updated = await fetchApi('/companies/settings', {
        method: 'PUT',
        body: company
      });
      setCompany(updated);
      if (updateCompany) updateCompany(updated);
      alert('Settings saved successfully!');
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    setAddingBank(true);
    try {
      await fetchApi('/companies/banks', {
        method: 'POST',
        body: newBank
      });
      const bankRes = await fetchApi('/companies/banks');
      setBanks(bankRes);
      setShowBankModal(false);
      setNewBank({ account_name: '', bank_name: '', account_no: '', ifsc: '', upi_id: '', owner_name: '', is_default: false });
    } catch (e) {
      alert(e.message);
    } finally {
      setAddingBank(false);
    }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;
    try {
      await fetchApi(`/companies/banks/${id}`, { method: 'DELETE' });
      setBanks(banks.filter(b => b.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings...</div>;

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontSize:'28px', marginBottom:'8px' }}>Settings</h1>
        <p style={{ color:'var(--text-muted)' }}>Manage your company profile, bank accounts, and compliance settings.</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'32px', borderBottom:'1px solid var(--glass-border)', paddingBottom:'0', overflowX:'auto' }}>
        {[
          { id:'company', label:'Company Profile' },
          { id:'bank',    label:'Bank Accounts' },
          { id:'gst',     label:'Compliance Settings' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding:'12px 24px', fontFamily:'inherit', fontWeight:500, fontSize:'14px', cursor:'pointer',
              background:'transparent', border:'none', borderBottom: activeTab===t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab===t.id ? 'var(--color-primary)' : 'var(--text-muted)', marginBottom:'-1px', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Company Profile Tab */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="glass-panel" style={{ padding:'32px', maxWidth:'700px' }}>
          <h2 style={{ fontSize:'20px', marginBottom:'28px', display:'flex', alignItems:'center', gap:'12px' }}>
            <Building2 size={22} color="var(--color-primary)"/> Company Details
          </h2>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
            {[
              { key:'name', label:'Company Name', icon:<Building2 size={16}/> },
              { key:'gstin', label:'GSTIN', icon:<Settings size={16}/> },
              { key:'udyam_no', label:'UDYAM No.', icon:<Settings size={16}/> },
              { key:'phone', label:'Phone', icon:<Phone size={16}/> },
              { key:'email', label:'Email', icon:<Mail size={16}/> },
              { key:'invoice_prefix', label:'Invoice Prefix', icon:<FileText size={16}/> },
            ].map((f,i) => (
              <div key={i}>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                  {f.icon} {f.label}
                </label>
                <input value={company?.[f.key] || ''} onChange={e => setCompany({...company, [f.key]: e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none', fontSize:'14px' }}/>
              </div>
            ))}
            <div style={{ gridColumn:'1/-1', display: 'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px' }}>
               <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}><MapPin size={16}/> City</label>
                  <input value={company?.city || ''} onChange={e => setCompany({...company, city: e.target.value})} style={{ width:'100%', padding:'12px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none', fontSize:'14px' }}/>
               </div>
               <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'8px' }}>State</label>
                  <input value={company?.state || ''} onChange={e => setCompany({...company, state: e.target.value})} style={{ width:'100%', padding:'12px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none', fontSize:'14px' }}/>
               </div>
               <div>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'block', marginBottom:'8px' }}>Pincode</label>
                  <input value={company?.pincode || ''} onChange={e => setCompany({...company, pincode: e.target.value})} style={{ width:'100%', padding:'12px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none', fontSize:'14px' }}/>
               </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:'12px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                <MapPin size={16}/> Full Address
              </label>
              <textarea rows={3} value={company?.address || ''} onChange={e => setCompany({...company, address: e.target.value})}
                style={{ width:'100%', padding:'12px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.05)', color:'var(--text-main)', fontFamily:'inherit', outline:'none', fontSize:'14px', resize:'vertical' }}/>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop:'24px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Bank Accounts Tab */}
      {activeTab === 'bank' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'20px', maxWidth:'600px' }}>
            <button onClick={() => setShowBankModal(true)} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'8px' }}><Plus size={18}/>Add Bank Account</button>
          </div>
          
          {banks.length === 0 ? (
            <div className="glass-panel" style={{ padding:'32px', maxWidth:'600px', textAlign:'center', color:'var(--text-muted)' }}>
              No bank accounts added yet.
            </div>
          ) : banks.map((b) => (
            <div key={b.id} className="glass-panel" style={{ padding:'24px', marginBottom:'16px', maxWidth:'600px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
                <div style={{ padding:'14px', background:'rgba(59,130,246,0.1)', borderRadius:'12px', color:'var(--color-primary)' }}>
                  <CreditCard size={24}/>
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                    <h3 style={{ margin:0, fontSize:'16px' }}>{b.account_name}</h3>
                    {b.is_default && <span style={{ fontSize:'11px', background:'rgba(16,185,129,0.15)', color:'#10B981', padding:'2px 8px', borderRadius:'4px' }}>Default</span>}
                  </div>
                  <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>{b.bank_name} · {b.account_no} · {b.ifsc}</div>
                  <div style={{ color:'var(--color-secondary)', fontSize:'13px', marginTop:'4px' }}>UPI: {b.upi_id || 'N/A'}</div>
                </div>
              </div>
              <button onClick={() => handleDeleteBank(b.id)} style={{ background:'rgba(236,72,153,0.1)', border:'none', color:'var(--color-danger)', padding:'10px', borderRadius:'8px', cursor:'pointer' }}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'gst' && (
        <form onSubmit={handleSaveCompany} className="glass-panel" style={{ padding:'32px', maxWidth:'600px' }}>
          <h2 style={{ fontSize:'20px', marginBottom:'28px' }}>GST & Compliance Settings</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {[
              { key:'gst_turnover', label:'GST Turnover (Annual)', desc:'e.g. Below ₹5 Crore — IRP not mandatory' },
              { key:'default_payment_terms', label:'Default Payment Terms', desc:'e.g. 15 Days (No agreement)' },
              { key:'eway_bill_threshold', label:'E-Way Bill Threshold', desc:'e.g. ₹50,000 (Mandatory)' },
              { key:'msme_alert_days', label:'Section 43B(h) Alert', desc:'e.g. 45 Days — MSME Protected' },
            ].map((s,i) => (
              <div key={i}>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'6px', display:'block', fontWeight:500 }}>{s.label}</label>
                <input value={company?.[s.key] || ''} onChange={e => setCompany({...company, [s.key]: e.target.value})}
                  placeholder={s.desc}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'rgba(255,255,255,0.03)', color:'var(--text-main)', fontFamily:'inherit', outline:'none', fontSize:'14px' }}/>
              </div>
            ))}
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop:'24px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Compliance Settings'}
          </button>
        </form>
      )}

      {/* Add Bank Modal */}
      {showBankModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <form onSubmit={handleAddBank} className="glass-panel" style={{ padding:'32px', width:'100%', maxWidth:'400px', background:'#0B1121' }}>
            <h2 style={{ marginBottom:'24px', fontSize:'20px' }}>Add Bank Account</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Account Name</label>
                <input required value={newBank.account_name} onChange={e=>setNewBank({...newBank, account_name:e.target.value})}
                  placeholder="e.g. Charu Marketing Current A/c"
                  style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Bank Name</label>
                <input required value={newBank.bank_name} onChange={e=>setNewBank({...newBank, bank_name:e.target.value})}
                  placeholder="e.g. State Bank of India"
                  style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Account No.</label>
                  <input required value={newBank.account_no} onChange={e=>setNewBank({...newBank, account_no:e.target.value})}
                    style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>IFSC Code</label>
                  <input required value={newBank.ifsc} onChange={e=>setNewBank({...newBank, ifsc:e.target.value})}
                    style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>UPI ID (Optional)</label>
                <input value={newBank.upi_id} onChange={e=>setNewBank({...newBank, upi_id:e.target.value})}
                  style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'8px' }}>
                <input type="checkbox" id="defaultBank" checked={newBank.is_default} onChange={e=>setNewBank({...newBank, is_default:e.target.checked})} />
                <label htmlFor="defaultBank" style={{ fontSize:'13px' }}>Set as default bank account</label>
              </div>
            </div>
            
            <div style={{ display:'flex', gap:'12px', marginTop:'24px' }}>
              <button type="button" onClick={() => setShowBankModal(false)} style={{ flex:1, padding:'12px', background:'transparent', border:'1px solid var(--glass-border)', color:'white', borderRadius:'8px', cursor:'pointer' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={addingBank} style={{ flex:1, padding:'12px' }}>
                {addingBank ? 'Saving...' : 'Save Bank'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
