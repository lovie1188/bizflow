import React, { useState, useEffect } from 'react';
import { Settings, Building2, MapPin, Phone, Mail, CreditCard, Plus, Trash2, FileText, Zap, MessageCircle, SmartphoneNfc, Lock, CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { fetchApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminSettings = () => {
  const { updateCompany } = useAuth();
  const [activeTab, setActiveTab] = useState('company');
  const [company, setCompany] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addons, setAddons] = useState(null);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const showToast = useToast();

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
      } catch (err) {
        console.error('Failed to load settings:', err);
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const loadAddons = async () => {
    setAddonsLoading(true);
    try {
      const data = await fetchApi('/subscriptions/my');
      setAddons(data);
    } catch (e) {
      showToast('Failed to load add-on status', 'error');
    } finally {
      setAddonsLoading(false);
    }
  };

  useEffect(() => { if (activeTab === 'addons') loadAddons(); }, [activeTab]);

  const getUpiId = () => addons?.platform?.developer_upi || process.env.REACT_APP_DEVELOPER_UPI || 'dev@icici';

  const buildUpiLink = (feature, price) => {
    const note  = encodeURIComponent(`BizFlow ${feature} subscription activation`);
    const name  = encodeURIComponent('BizFlow Platform');
    return `upi://pay?pa=${getUpiId()}&pn=${name}&am=${price}&cu=INR&tn=${note}`;
  };

  const handleUpiClick = (e, upiId) => {
    if (window.innerWidth > 768) {
      e.preventDefault();
      navigator.clipboard.writeText(upiId);
      showToast(`UPI ID (${upiId}) copied! Please pay using your mobile app.`);
    }
  };

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
      showToast('Settings saved successfully!');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    setAddingBank(true);
    try {
      await fetchApi('/companies/banks', { method: 'POST', body: newBank });
      const bankRes = await fetchApi('/companies/banks');
      setBanks(bankRes);
      setShowBankModal(false);
      setNewBank({ account_name: '', bank_name: '', account_no: '', ifsc: '', upi_id: '', owner_name: '', is_default: false });
      showToast('Bank account added successfully');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAddingBank(false);
    }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;
    try {
      await fetchApi(`/companies/banks/${id}`, { method: 'DELETE' });
      setBanks(banks.filter(b => b.id !== id));
      showToast('Bank account deleted');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    showToast('Copied to clipboard');
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings...</div>;

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '1000px' }}>
      <div style={{ marginBottom:'32px', display:'flex', alignItems:'center', gap:'16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Settings size={24} />
        </div>
        <div>
          <h1 style={{ fontSize:'28px', margin:0 }}>Settings</h1>
          <p style={{ color:'var(--text-muted)', margin:'4px 0 0 0' }}>Manage company profile, banks, and platform preferences.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'32px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
        {[
          { id:'company', label:'Company Profile', icon: <Building2 size={16}/> },
          { id:'bank',    label:'Bank Accounts', icon: <CreditCard size={16}/> },
          { id:'gst',     label:'Compliance', icon: <FileText size={16}/> },
          { id:'addons',  label:'Add-on Services', icon: <Zap size={16}/> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding:'10px 20px', fontFamily:'inherit', fontWeight:500, fontSize:'14px', cursor:'pointer',
              background: activeTab === t.id ? 'var(--color-primary)' : 'transparent', borderRadius: '8px',
              border: 'none', color: activeTab === t.id ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s', whiteSpace:'nowrap' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Company Profile Tab */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>Basic Information</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px' }}>
              <div>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px', display: 'block' }}>Company Name</label>
                <input value={company?.name || ''} onChange={e => setCompany({...company, name: e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
              </div>
              <div>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px', display: 'block' }}>GSTIN</label>
                <input value={company?.gstin || ''} onChange={e => setCompany({...company, gstin: e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
              </div>
              <div>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px', display: 'block' }}>UDYAM Registration No.</label>
                <input value={company?.udyam_no || ''} onChange={e => setCompany({...company, udyam_no: e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
              </div>
              <div>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px', display: 'block' }}>Invoice Prefix</label>
                <input value={company?.invoice_prefix || ''} onChange={e => setCompany({...company, invoice_prefix: e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
              </div>
              <div>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px', display: 'block' }}>Custom Domain Mapping</label>
                <input value={company?.custom_domain || ''} onChange={e => setCompany({...company, custom_domain: e.target.value})}
                  placeholder="e.g. charumarketing.com"
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>Contact & Address</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px', display: 'block' }}>Email Address</label>
                <input value={company?.email || ''} onChange={e => setCompany({...company, email: e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
              </div>
              <div>
                <label style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px', display: 'block' }}>Phone Number</label>
                <input value={company?.phone || ''} onChange={e => setCompany({...company, phone: e.target.value})}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
              </div>
            </div>
            
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'20px', marginBottom: '20px' }}>
               <div>
                  <label style={{ fontSize:'13px', color:'var(--text-muted)', display:'block', marginBottom:'8px' }}>City</label>
                  <input value={company?.city || ''} onChange={e => setCompany({...company, city: e.target.value})} style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
               </div>
               <div>
                  <label style={{ fontSize:'13px', color:'var(--text-muted)', display:'block', marginBottom:'8px' }}>State</label>
                  <input value={company?.state || ''} onChange={e => setCompany({...company, state: e.target.value})} style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
               </div>
               <div>
                  <label style={{ fontSize:'13px', color:'var(--text-muted)', display:'block', marginBottom:'8px' }}>Pincode</label>
                  <input value={company?.pincode || ''} onChange={e => setCompany({...company, pincode: e.target.value})} style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none' }}/>
               </div>
            </div>

            <div>
              <label style={{ fontSize:'13px', color:'var(--text-muted)', display:'block', marginBottom:'8px' }}>Full Address</label>
              <textarea rows={3} value={company?.address || ''} onChange={e => setCompany({...company, address: e.target.value})}
                style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'var(--bg-input)', color:'var(--text-main)', outline:'none', resize:'vertical' }}/>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" style={{ padding: '12px 32px', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Bank Accounts Tab */}
      {activeTab === 'bank' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom:'24px' }}>
            <p style={{ color: 'var(--text-muted)' }}>These details will be printed on your invoices.</p>
            <button onClick={() => setShowBankModal(true)} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'8px' }}><Plus size={18}/>Add Account</button>
          </div>
          
          {banks.length === 0 ? (
            <div className="glass-panel" style={{ padding:'60px 20px', textAlign:'center' }}>
              <CreditCard size={48} style={{ color:'var(--glass-border)', margin:'0 auto 16px', display:'block' }}/>
              <h3 style={{ fontSize:'18px', marginBottom:'8px' }}>No bank accounts</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'14px' }}>Add a bank account to receive payments from buyers.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {banks.map((b) => (
                <div key={b.id} style={{ 
                  background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))', 
                  borderRadius: '16px', padding: '24px', border: b.is_default ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                  position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                  {/* Decorative element */}
                  <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                    <Building2 size={140} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Bank Name</div>
                      <div style={{ fontSize: '18px', fontWeight: 600 }}>{b.bank_name}</div>
                    </div>
                    {b.is_default && <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '10px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>DEFAULT</span>}
                  </div>

                  <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Account Number</div>
                    <div style={{ fontSize: '22px', letterSpacing: '2px', fontFamily: 'monospace' }}>
                      {b.account_no.replace(/(.{4})/g, '$1 ').trim()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Name</div>
                      <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.account_name}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>IFSC Code</div>
                      <div style={{ fontSize: '14px' }}>{b.ifsc}</div>
                    </div>
                  </div>

                  {b.upi_id && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>UPI ID</div>
                      <div style={{ fontSize: '14px', color: 'var(--color-secondary)' }}>{b.upi_id}</div>
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                    <button onClick={() => copyToClipboard(`A/C: ${b.account_no}, IFSC: ${b.ifsc}`, b.id)} 
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Copy Details">
                      {copied === b.id ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => handleDeleteBank(b.id)} 
                      style={{ background: 'rgba(236,72,153,0.1)', border: 'none', color: 'var(--color-danger)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Account">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'gst' && (
        <form onSubmit={handleSaveCompany} className="glass-panel" style={{ padding:'32px' }}>
          <h2 style={{ fontSize:'20px', marginBottom:'28px', borderBottom:'1px solid var(--glass-border)', paddingBottom:'12px' }}>Compliance Rules & Defaults</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'24px' }}>
            {[
              { key:'gst_turnover', label:'GST Turnover (Annual)', desc:'e.g. Below ₹5 Crore — IRP not mandatory', hint: 'Used for e-invoicing compliance logic.' },
              { key:'default_payment_terms', label:'Default Payment Terms', desc:'e.g. 15 Days (No agreement)', hint: 'Applied to invoices automatically.' },
              { key:'eway_bill_threshold', label:'E-Way Bill Threshold', desc:'e.g. ₹50,000 (Mandatory)', hint: 'Alerts if invoice total exceeds this amount.' },
              { key:'msme_alert_days', label:'Section 43B(h) Alert', desc:'e.g. 45 Days — MSME Protected', hint: 'Highlights invoices approaching MSME deadline.' },
            ].map((s,i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ fontSize:'14px', color:'var(--text-main)', marginBottom:'4px', display:'block', fontWeight:500 }}>{s.label}</label>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', marginTop: 0 }}>{s.hint}</p>
                <input value={company?.[s.key] || ''} onChange={e => setCompany({...company, [s.key]: e.target.value})}
                  placeholder={s.desc}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'rgba(0,0,0,0.2)', color:'white', outline:'none', fontSize:'14px' }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button type="submit" className="btn-primary" style={{ padding: '12px 32px', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* ── Add-on Services Tab ── */}
      {activeTab === 'addons' && (
        <div>
          <div style={{ marginBottom: 32, background: 'linear-gradient(90deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: 22, margin: '0 0 8px 0' }}>Supercharge BizFlow</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              Enhance your experience with powerful add-on services. Subscribe by paying via UPI and notify the platform team for activation.
            </p>
          </div>

          {addonsLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Add-ons…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {[
                {
                  key: 'razorpay',
                  icon: <CreditCard size={28} />,
                  name: 'Razorpay Payment Gateway',
                  tagline: 'Accept online payments from buyers',
                  color: '#3B82F6',
                  desc: addons?.razorpay?.description || 'Accept UPI, cards, net banking & wallet payments from buyers directly on invoices.',
                  price: addons?.razorpay?.price_monthly || 999,
                  globally: addons?.razorpay?.globally_enabled,
                  subscribed: addons?.razorpay?.subscribed,
                },
                {
                  key: 'whatsapp',
                  icon: <MessageCircle size={28} />,
                  name: 'WhatsApp Notifications',
                  tagline: 'Automated buyer alerts via WhatsApp',
                  color: '#25D366',
                  desc: addons?.whatsapp?.description || 'Send invoice reminders, payment receipts and due-date alerts to buyers via WhatsApp Business API.',
                  price: addons?.whatsapp?.price_monthly || 499,
                  globally: addons?.whatsapp?.globally_enabled,
                  subscribed: addons?.whatsapp?.subscribed,
                },
                {
                  key: 'sms',
                  icon: <SmartphoneNfc size={28} />,
                  name: 'SMS Notifications',
                  tagline: 'Instant SMS alerts for buyers',
                  color: '#F59E0B',
                  desc: addons?.sms?.description || 'Send SMS for invoice generation, payment confirmations and overdue reminders to buyer mobile numbers.',
                  price: addons?.sms?.price_monthly || 299,
                  globally: addons?.sms?.globally_enabled,
                  subscribed: addons?.sms?.subscribed,
                },
              ].map(feat => {
                const isActive    = feat.globally && feat.subscribed;
                const isLocked    = !feat.globally;
                const isPending   = feat.globally && !feat.subscribed;
                const upiLink     = buildUpiLink(feat.name, feat.price);

                return (
                  <div key={feat.key} className="glass-panel" style={{
                    padding: 24, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    border: isActive ? `1.5px solid ${feat.color}88` : '1px solid var(--glass-border)',
                    opacity: isLocked ? 0.6 : 1, transition: 'transform 0.2s',
                    background: isActive ? `linear-gradient(180deg, rgba(255,255,255,0.05), ${feat.color}11)` : 'rgba(255,255,255,0.02)'
                  }}>
                    {/* Status ribbon */}
                    <div style={{ position: 'absolute', top: 16, right: 16 }}>
                      {isActive && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: `${feat.color}33`, color: feat.color, fontWeight: 700, display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={12}/> ACTIVE</span>}
                      {isPending && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 700, display:'flex', alignItems:'center', gap:4 }}><Lock size={12}/> UPGRADE</span>}
                      {isLocked && <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(100,116,139,0.2)', color: '#64748b', fontWeight: 700, display:'flex', alignItems:'center', gap:4 }}><Lock size={12}/> LOCKED</span>}
                    </div>

                    {/* Icon + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, marginTop: 4 }}>
                      <div style={{ padding: 14, borderRadius: 14, background: `${feat.color}22`, color: feat.color }}>{feat.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{feat.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{feat.tagline}</div>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6, flex: 1 }}>{feat.desc}</p>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>₹{feat.price}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/month</span>
                    </div>

                    {/* CTA */}
                    {isLocked && (
                      <div style={{ padding: '12px', background: 'rgba(100,116,139,0.1)', borderRadius: 10, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                        Coming Soon to BizFlow
                      </div>
                    )}
                    {isActive && (
                      <div style={{ padding: '12px', background: `${feat.color}15`, borderRadius: 10, fontSize: 13, color: feat.color, textAlign: 'center', fontWeight: 600 }}>
                        ✓ Included in your plan
                      </div>
                    )}
                    {isPending && (
                      <div>
                        <a
                          href={upiLink}
                          onClick={(e) => handleUpiClick(e, getUpiId())}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '12px 20px', borderRadius: 10, background: feat.color, color: '#fff',
                            fontWeight: 600, fontSize: 14, textDecoration: 'none', marginBottom: 10, transition: 'opacity 0.2s' }}
                        >
                          <ExternalLink size={16}/> Pay via UPI
                        </a>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                          Send screenshot to support to activate.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Bank Modal */}
      {showBankModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <form onSubmit={handleAddBank} className="glass-panel" style={{ padding:'32px', width:'100%', maxWidth:'450px', background:'#0B1121', position:'relative' }}>
            <button type="button" onClick={() => setShowBankModal(false)} style={{ position:'absolute', top:'24px', right:'24px', background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><Check size={20} style={{transform: 'rotate(45deg)'}}/></button>
            <h2 style={{ marginBottom:'24px', fontSize:'20px', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={20} color="var(--color-primary)"/> Add Bank Account</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Account Name *</label>
                <input required value={newBank.account_name} onChange={e=>setNewBank({...newBank, account_name:e.target.value})}
                  placeholder="e.g. Charu Marketing Current A/c"
                  style={{ width:'100%', padding:'12px', background:'var(--bg-input)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'var(--text-main)', outline:'none' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Bank Name *</label>
                <input required value={newBank.bank_name} onChange={e=>setNewBank({...newBank, bank_name:e.target.value})}
                  placeholder="e.g. State Bank of India"
                  style={{ width:'100%', padding:'12px', background:'var(--bg-input)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'var(--text-main)', outline:'none' }} />
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Account No. *</label>
                  <input required value={newBank.account_no} onChange={e=>setNewBank({...newBank, account_no:e.target.value})}
                    style={{ width:'100%', padding:'12px', background:'var(--bg-input)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'var(--text-main)', outline:'none' }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>IFSC Code *</label>
                  <input required value={newBank.ifsc} onChange={e=>setNewBank({...newBank, ifsc:e.target.value})}
                    style={{ width:'100%', padding:'12px', background:'var(--bg-input)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'var(--text-main)', outline:'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>UPI ID (Optional)</label>
                <input value={newBank.upi_id} onChange={e=>setNewBank({...newBank, upi_id:e.target.value})}
                  placeholder="e.g. company@ybl"
                  style={{ width:'100%', padding:'12px', background:'var(--bg-input)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'var(--text-main)', outline:'none' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'8px', padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <input type="checkbox" id="defaultBank" checked={newBank.is_default} onChange={e=>setNewBank({...newBank, is_default:e.target.checked})} />
                <label htmlFor="defaultBank" style={{ fontSize:'13px', color: '#10B981', cursor: 'pointer' }}>Set as default bank account for invoices</label>
              </div>
            </div>
            
            <div style={{ display:'flex', gap:'12px', marginTop:'24px' }}>
              <button type="button" onClick={() => setShowBankModal(false)} className="btn-secondary" style={{ flex:1, padding:'12px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={addingBank} style={{ flex:1, padding:'12px' }}>
                {addingBank ? 'Saving...' : 'Add Account'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
