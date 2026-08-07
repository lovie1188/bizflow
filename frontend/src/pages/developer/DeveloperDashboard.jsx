import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Download, RefreshCw, AlertCircle, Activity, ShieldCheck, Bell, Settings, LogOut, Code } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = (process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin)) + '/api';

/* ─── inline dark-panel style helpers ─── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    padding: '24px',
    fontFamily: "'Manrope', sans-serif",
  },
  inner: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 10 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: (active) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 500,
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#02B290' : '#1e293b',
    color: active ? '#fff' : '#94a3b8',
    transition: 'all 0.2s',
  }),
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #334155' },
  td: { padding: '14px 16px', fontSize: 13, borderBottom: '1px solid #1e293b', color: '#cbd5e1' },
  alertError: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  alertSuccess: { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13 },
  btnPrimary: { background: '#02B290', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  btnSecondary: { background: '#334155', color: '#cbd5e1', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  btnDanger: { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 14px', borderRadius: 6, fontWeight: 500, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  badge: (color) => ({ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: `${color}22`, color, fontWeight: 600 }),
  toggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '20px 24px' },
  logBox: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 12, color: '#34d399', whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: 400 },
  empty: { padding: '48px 0', textAlign: 'center', color: '#475569', fontSize: 13 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: '#f1f5f9' },
  signout: { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
};

const DeveloperDashboard = () => {
  const { logout: authLogout } = useAuth();
  const [backups, setBackups]         = useState([]);
  const [auditLogs, setAuditLogs]     = useState([]);
  const [consents, setConsents]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [systemLogs, setSystemLogs]   = useState('');
  const [settings, setSettings]       = useState({});
  const [paymentConfig, setPaymentConfig] = useState({});

  const [activeTab, setActiveTab]     = useState('backups');
  const [loading, setLoading]         = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]             = useState('');
  const [message, setMessage]         = useState('');

  const navigate = useNavigate();

  // Always read token fresh — not captured at render time
  const getToken = () => localStorage.getItem('bizflow_token');

  // Auto-logout on 401
  const handleUnauthorized = () => {
    if (authLogout) authLogout();
    else {
      localStorage.removeItem('bizflow_token');
      localStorage.removeItem('bizflow_user');
      localStorage.removeItem('bizflow_company');
      navigate('/login', { replace: true });
    }
  };

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });
  const authJsonHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

  // Helper: check response for 401 and auto-logout
  const checkAuth = (res) => {
    if (res.status === 401) { handleUnauthorized(); return false; }
    return true;
  };

  useEffect(() => {
    setError(''); setMessage('');
    if (activeTab === 'backups')            fetchBackups();
    else if (activeTab === 'audit')         fetchApiData('/audit-logs', setAuditLogs);
    else if (activeTab === 'consent')       fetchApiData('/consent', setConsents);
    else if (activeTab === 'notifications') fetchApiData('/notifications', setNotifications);
    else if (activeTab === 'subscriptions') fetchSubscriptions();
    else if (activeTab === 'system_logs')   fetchSystemLogs();
    else if (activeTab === 'settings')      fetchSettings();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/developer/settings`, { headers: authHeaders() });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setPaymentConfig({
          developer_upi: data.developer_upi || '',
          developer_bank_name: data.developer_bank_name || '',
          developer_account_no: data.developer_account_no || '',
          developer_ifsc: data.developer_ifsc || ''
        });
      }
      else setError(data.error || 'Failed to fetch settings');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const updateSetting = async (key, value) => {
    try {
      setActionLoading(true);
      const res  = await fetch(`${API_BASE}/developer/settings`, {
        method: 'PUT', headers: authJsonHeaders(),
        body: JSON.stringify({ key, value })
      });
      if (!checkAuth(res)) return;
      if (res.ok) { setSettings(prev => ({ ...prev, [key]: String(value) })); setMessage('Setting saved!'); }
      else { const d = await res.json(); setError(d.error || 'Failed to update'); }
    } catch (e) { setError(e.message); } finally { setActionLoading(false); }
  };

  const handleSavePaymentConfig = async () => {
    try {
      setActionLoading(true);
      setMessage('');
      setError('');
      for (const [key, value] of Object.entries(paymentConfig)) {
        await fetch(`${API_BASE}/developer/settings`, {
          method: 'PUT', headers: authJsonHeaders(),
          body: JSON.stringify({ key, value })
        });
      }
      setMessage('Payment configuration saved successfully!');
    } catch (e) {
      setError('Failed to save payment configuration: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/developer/logs`, { headers: authHeaders() });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (data.success) {
        setSystemLogs(data.logs || 'No logs available.');
      } else setError(data.error || 'Failed to fetch logs');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/subscriptions/all`, { headers: authHeaders() });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (data.success) setSubscriptions(Array.isArray(data.companies) ? data.companies : []);
      else setError(data.error || 'Failed to fetch subscriptions');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/developer/backups`, { headers: authHeaders() });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (data.success) setBackups(data.backups);
      else setError(data.error || 'Failed to fetch backups');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const fetchApiData = async (endpoint, setter) => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (data.success || Array.isArray(data)) {
        let items = data.data || data;
        setter(items);
      }
      else setError(data.error || 'Failed to fetch');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleCreateBackup = async () => {
    try {
      setActionLoading(true); setError(''); setMessage('');
      const res  = await fetch(`${API_BASE}/developer/backups/create`, { method: 'POST', headers: authHeaders() });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (data.success) { setMessage('Backup created!'); fetchBackups(); }
      else setError(data.error || 'Failed to create backup');
    } catch (e) { setError(e.message); } finally { setActionLoading(false); }
  };

  const handleRestore = async (file) => {
    if (!window.confirm('⚠️ Restoring will overwrite the entire database. Are you sure?')) return;
    try {
      setActionLoading(true); setError(''); setMessage('');
      const res  = await fetch(`${API_BASE}/developer/backups/restore`, {
        method: 'POST', headers: authJsonHeaders(), body: JSON.stringify({ filePath: file })
      });
      if (!checkAuth(res)) return;
      const data = await res.json();
      if (data.success) setMessage('Database restored!');
      else setError(data.error || 'Restore failed');
    } catch (e) { setError(e.message); } finally { setActionLoading(false); }
  };

  const handleExportCode = async (target) => {
    try {
      setActionLoading(true); setError(''); setMessage('');
      const res = await fetch(`${API_BASE}/developer/export`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify({ target })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Export failed');
      }

      // Download the zip blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizflow-export-${target}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`Source code (${target}) exported securely.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatSize = (b) => {
    if (!b) return '—';
    const k = 1024, s = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
  };

  const logout = () => {
    if (authLogout) {
      authLogout();
    } else {
      localStorage.removeItem('bizflow_token');
      localStorage.removeItem('bizflow_user');
      localStorage.removeItem('bizflow_company');
      navigate('/login', { replace: true });
    }
  };

  const TABS = [
    { key: 'backups',       icon: <Database size={15}/>,    label: 'DB Backups' },
    { key: 'export',        icon: <Code size={15}/>,        label: 'Source Export' },
    { key: 'audit',         icon: <Activity size={15}/>,    label: 'Audit Logs' },
    { key: 'consent',       icon: <ShieldCheck size={15}/>, label: 'Consent Records' },
    { key: 'notifications', icon: <Bell size={15}/>,        label: 'Notifications' },
    { key: 'subscriptions', icon: <Activity size={15}/>,    label: 'Subscriptions' },
    { key: 'system_logs',   icon: <AlertCircle size={15}/>, label: 'System Logs' },
    { key: 'settings',      icon: <Settings size={15}/>,    label: 'Settings' },
  ];

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}><Database size={22} color="#02B290"/> Developer System Utility</h1>
            <p style={S.subtitle}>Manage Database, Audit Logs &amp; System Settings</p>
          </div>
          <button style={S.signout} onClick={logout}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>

        {/* Alerts */}
        {error   && <div style={S.alertError}><AlertCircle size={16}/> {error}</div>}
        {message && <div style={S.alertSuccess}>{message}</div>}

        {/* Tabs */}
        <div style={S.tabs}>
          {TABS.map(t => (
            <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div style={S.card}>

          {/* ── BACKUPS ── */}
          {activeTab === 'backups' && (
            <>
              <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>Backup Snapshots</span>
                <button style={S.btnPrimary} onClick={handleCreateBackup} disabled={actionLoading}>
                  <RefreshCw size={14} style={actionLoading ? { animation: 'spin 1s linear infinite' } : {}}/> Trigger Backup
                </button>
              </div>
              {loading ? <div style={S.empty}>Loading backups…</div>
                : backups.length === 0 ? <div style={S.empty}>No backups found.</div>
                : (
                  <table style={S.table}>
                    <thead>
                      <tr><th style={S.th}>Filename</th><th style={S.th}>Size</th><th style={S.th}>Created</th><th style={{...S.th, textAlign:'right'}}>Actions</th></tr>
                    </thead>
                    <tbody>
                      {backups.map((b, i) => (
                        <tr key={i}>
                          <td style={{...S.td, color:'#60a5fa', fontFamily:'monospace', fontSize:12}}>{b.file || b.filename}</td>
                          <td style={S.td}>{formatSize(b.size)}</td>
                          <td style={S.td}>{b.date ? new Date(b.date).toLocaleString() : '—'}</td>
                          <td style={{...S.td, textAlign:'right'}}>
                            <button style={S.btnDanger} onClick={() => handleRestore(b.file || b.filename)}>
                              <Download size={12}/> Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </>
          )}

          {/* ── EXPORT CODE ── */}
          {activeTab === 'export' && (
            <>
              <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>Secure Source Code Export</span>
              </div>
              <div style={{ marginBottom: 20, color: '#94a3b8', fontSize: 13 }}>
                Download a packaged zip of the project codebase. Confidential keys, passwords, node_modules, and .env files are <strong>automatically excluded</strong> from the export.
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ background: '#0f172a', padding: 20, borderRadius: 10, border: '1px solid #334155' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, color: '#f1f5f9' }}>Frontend App</h3>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>React, Contexts, Pages, UI</p>
                  <button style={S.btnPrimary} onClick={() => handleExportCode('frontend')} disabled={actionLoading}>
                    <Download size={14}/> Export Frontend
                  </button>
                </div>
                
                <div style={{ background: '#0f172a', padding: 20, borderRadius: 10, border: '1px solid #334155' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, color: '#f1f5f9' }}>Backend API</h3>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Node.js, Express, Postgres logic</p>
                  <button style={S.btnPrimary} onClick={() => handleExportCode('backend')} disabled={actionLoading}>
                    <Download size={14}/> Export Backend
                  </button>
                </div>

                <div style={{ background: '#0f172a', padding: 20, borderRadius: 10, border: '1px solid #02B29044' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, color: '#02B290' }}>Full Platform</h3>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Complete BizFlow architecture</p>
                  <button style={{...S.btnPrimary, background: '#0f172a', color: '#02B290', border: '1px solid #02B290'}} onClick={() => handleExportCode('all')} disabled={actionLoading}>
                    <Download size={14}/> Export Everything
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── AUDIT LOGS ── */}
          {activeTab === 'audit' && (
            <>
              <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>System Audit Logs</span>
              </div>
              {loading ? <div style={S.empty}>Loading…</div> : (
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Date</th><th style={S.th}>User</th><th style={S.th}>Action</th><th style={S.th}>Entity</th><th style={S.th}>IP</th>
                  </tr></thead>
                  <tbody>
                    {auditLogs.length === 0
                      ? <tr><td colSpan={5} style={S.empty}>No audit logs found.</td></tr>
                      : auditLogs.map(l => (
                        <tr key={l.id}>
                          <td style={{...S.td, whiteSpace:'nowrap'}}>{new Date(l.created_at).toLocaleString()}</td>
                          <td style={S.td}>{l.user_email || 'System'}</td>
                          <td style={{...S.td, color:'#60a5fa'}}>{l.action}</td>
                          <td style={S.td}>{l.entity_type} {l.entity_id ? `(#${l.entity_id})` : ''}</td>
                          <td style={{...S.td, fontFamily:'monospace', fontSize:11, color:'#64748b'}}>{l.ip_address}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ── CONSENT RECORDS ── */}
          {activeTab === 'consent' && (
            <>
              <div style={S.sectionHeader}><span style={S.sectionTitle}>Consent Records</span></div>
              {loading ? <div style={S.empty}>Loading…</div> : (
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Date</th><th style={S.th}>User Email</th><th style={S.th}>Purpose</th><th style={S.th}>Consent</th><th style={S.th}>Version</th>
                  </tr></thead>
                  <tbody>
                    {consents.length === 0
                      ? <tr><td colSpan={5} style={S.empty}>No consent records.</td></tr>
                      : consents.map(c => (
                        <tr key={c.id}>
                          <td style={{...S.td, whiteSpace:'nowrap'}}>{c.timestamp ? new Date(c.timestamp).toLocaleString() : '—'}</td>
                          <td style={S.td}>{c.user_email}</td>
                          <td style={S.td}>{c.purpose}</td>
                          <td style={S.td}>
                            <span style={S.badge(c.consent_given ? '#10b981' : '#ef4444')}>
                              {c.consent_given ? 'Granted' : 'Revoked'}
                            </span>
                          </td>
                          <td style={{...S.td, fontFamily:'monospace', fontSize:11}}>v{c.version}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <>
              <div style={S.sectionHeader}><span style={S.sectionTitle}>Notifications</span></div>
              {loading ? <div style={S.empty}>Loading…</div> : (
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Sent At</th><th style={S.th}>Company</th><th style={S.th}>Type</th><th style={S.th}>Invoice</th><th style={S.th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {notifications.length === 0
                      ? <tr><td colSpan={5} style={S.empty}>No notifications.</td></tr>
                      : notifications.map(n => (
                        <tr key={n.id}>
                          <td style={{...S.td, whiteSpace:'nowrap'}}>{n.sent_at ? new Date(n.sent_at).toLocaleString() : 'Pending'}</td>
                          <td style={S.td}>{n.company_name || n.buyer_name || '—'}</td>
                          <td style={S.td}>{n.type}</td>
                          <td style={{...S.td, color:'#60a5fa'}}>{n.invoice_number || '—'}</td>
                          <td style={S.td}><span style={S.badge(n.status === 'sent' ? '#10b981' : '#94a3b8')}>{n.status}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ── SYSTEM LOGS ── */}
          {activeTab === 'system_logs' && (
            <>
              <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>System Error Logs</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.btnSecondary} onClick={fetchSystemLogs} disabled={loading}>
                    <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}}/> Refresh
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 8, fontSize: 12, color: '#475569' }}>
                Showing last 200 lines of <code style={{ color: '#60a5fa', background: '#1e293b', padding: '1px 6px', borderRadius: 4 }}>error.log</code>
              </div>
              <div style={{ ...S.logBox, minHeight: 300 }}>
                {loading
                  ? <span style={{ color: '#94a3b8' }}>Loading logs…</span>
                  : systemLogs || <span style={{ color: '#10b981' }}>No errors logged yet. System is running clean! ✅</span>
                }
              </div>
            </>
          )}

          {/* ── SUBSCRIPTIONS ── */}
          {activeTab === 'subscriptions' && (
            <>
              <div style={S.sectionHeader}>
                <span style={S.sectionTitle}>Client Subscriptions</span>
              </div>
              {loading ? <div style={S.empty}>Loading…</div> : (
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Company</th>
                    <th style={S.th}>Feature</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Price/Month</th>
                    <th style={S.th}>Activated</th>
                    <th style={S.th}>Expires</th>
                  </tr></thead>
                  <tbody>
                    {subscriptions.length === 0
                      ? <tr><td colSpan={6} style={S.empty}>No subscriptions found.</td></tr>
                      : subscriptions.flatMap(company =>
                          Object.entries(company.subscriptions || {}).map(([feature, sub]) => (
                            <tr key={`${company.id}-${feature}`}>
                              <td style={{...S.td, fontWeight: 600, color: '#f1f5f9'}}>{company.name}</td>
                              <td style={{...S.td, textTransform: 'capitalize', color: '#60a5fa'}}>{feature}</td>
                              <td style={S.td}>
                                <span style={S.badge(sub.status === 'active' ? '#10b981' : '#ef4444')}>
                                  {sub.status}
                                </span>
                              </td>
                              <td style={S.td}>{sub.price_monthly ? `₹${sub.price_monthly}/mo` : '—'}</td>
                              <td style={{...S.td, fontSize: 11, color: '#64748b'}}>{sub.activated_at ? new Date(sub.activated_at).toLocaleDateString('en-IN') : '—'}</td>
                              <td style={{...S.td, fontSize: 11, color: '#64748b'}}>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN') : 'Never'}</td>
                            </tr>
                          ))
                        )
                    }
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <>
              <div style={S.sectionHeader}><span style={S.sectionTitle}>System Settings</span></div>
              {loading ? <div style={S.empty}>Loading settings…</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>

                  {/* Razorpay Toggle */}
                  <div style={S.toggle}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15, marginBottom: 4 }}>Razorpay Payment Gateway</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        When disabled, buyers will not see the "Pay Now" button anywhere in the app.
                      </div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 28, flexShrink: 0, marginLeft: 24 }}>
                      <input
                        type="checkbox"
                        checked={settings.razorpay_enabled === 'true'}
                        disabled={actionLoading}
                        onChange={(e) => updateSetting('razorpay_enabled', e.target.checked ? 'true' : 'false')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', cursor: actionLoading ? 'not-allowed' : 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: settings.razorpay_enabled === 'true' ? '#02B290' : '#334155',
                        borderRadius: 28, transition: 'background 0.3s',
                      }}
                        onClick={() => !actionLoading && updateSetting('razorpay_enabled', settings.razorpay_enabled === 'true' ? 'false' : 'true')}
                      >
                        <span style={{
                          position: 'absolute',
                          top: 3, left: settings.razorpay_enabled === 'true' ? 26 : 3,
                          width: 22, height: 22,
                          background: '#fff', borderRadius: '50%',
                          transition: 'left 0.3s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        }}/>
                      </span>
                    </label>
                  </div>

                  <div style={{ fontSize: 12, color: '#475569', padding: '8px 0' }}>
                    Status: <strong style={{ color: settings.razorpay_enabled === 'true' ? '#02B290' : '#ef4444' }}>
                      {settings.razorpay_enabled === 'true' ? 'ENABLED' : 'DISABLED'}
                    </strong>
                  </div>

                  {/* Payment Config for Platform Subscriptions */}
                  <div style={{ marginTop: 24, padding: 24, background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8, marginTop: 0 }}>Platform Payment Details (Add-ons)</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                      These details are used when Tenant Admins click "Pay via UPI" to subscribe to premium add-on services.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Developer UPI ID</label>
                        <input 
                          value={paymentConfig.developer_upi || ''} 
                          onChange={(e) => setPaymentConfig({...paymentConfig, developer_upi: e.target.value})}
                          placeholder="e.g. yourname@icici"
                          style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Bank Name (Optional)</label>
                        <input 
                          value={paymentConfig.developer_bank_name || ''} 
                          onChange={(e) => setPaymentConfig({...paymentConfig, developer_bank_name: e.target.value})}
                          placeholder="e.g. HDFC Bank"
                          style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Account Number (Optional)</label>
                        <input 
                          value={paymentConfig.developer_account_no || ''} 
                          onChange={(e) => setPaymentConfig({...paymentConfig, developer_account_no: e.target.value})}
                          placeholder="e.g. 50100200..."
                          style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>IFSC Code (Optional)</label>
                        <input 
                          value={paymentConfig.developer_ifsc || ''} 
                          onChange={(e) => setPaymentConfig({...paymentConfig, developer_ifsc: e.target.value})}
                          placeholder="e.g. HDFC0001234"
                          style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', fontSize: 13, outline: 'none' }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSavePaymentConfig}
                      disabled={actionLoading}
                      style={{ background: '#02B290', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {actionLoading ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>

                </div>
              )}
            </>
          )}

        </div>{/* end card */}

        {/* Footer notice */}
        {activeTab === 'backups' && (
          <div style={{ marginTop: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '14px 18px' }}>
            <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14}/> System Notice
            </div>
            <p style={{ color: '#78716c', fontSize: 12 }}>
              Auto-backups run daily at midnight. The system retains the last 15 days of backups.
              Set <code>GOOGLE_DRIVE_FOLDER_ID</code> in .env to enable Google Drive sync.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default DeveloperDashboard;
