import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, CheckCircle, Clock, Search, Edit2, Trash2, Mail, Users, Truck, X } from 'lucide-react';
import { fetchApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [editData, setEditData] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const showToast = useToast();

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/users/staff');
      setStaff(res);
    } catch (e) {
      console.error('Failed to load staff:', e);
      showToast('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/users/staff', { method: 'POST', body: formData });
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      showToast('Staff added successfully');
      loadStaff();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi(`/users/staff/${editData.id}`, { method: 'PUT', body: editData });
      setShowEditModal(false);
      setEditData(null);
      showToast('Staff updated successfully');
      loadStaff();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await fetchApi(`/users/staff/${id}`, { method: 'DELETE' });
      showToast('Staff removed successfully');
      loadStaff();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const openEdit = (member) => {
    setEditData({ ...member, password: '' });
    setShowEditModal(true);
  };

  // Filter Logic
  const filtered = staff.filter(s => {
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    const matchSearch = search === '' || 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  // KPIs
  const totalStaff = staff.length;
  const activeDelivery = staff.filter(s => s.role === 'delivery' && s.active).length;
  const activeOffice = staff.filter(s => s.role === 'staff' && s.active).length;

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'28px', marginBottom:'8px' }}>Staff & Delivery</h1>
          <p style={{ color:'var(--text-muted)' }}>Manage your team members and delivery personnel.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <UserPlus size={18}/> Add Member
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px', marginBottom:'32px' }}>
        <div className="glass-panel" style={{ padding:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ padding:'12px', background:'rgba(59,130,246,0.1)', color:'var(--color-primary)', borderRadius:'12px' }}><Users size={24}/></div>
          <div>
            <div style={{ fontSize:'24px', fontWeight:'bold' }}>{totalStaff}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>Total Team Members</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ padding:'12px', background:'rgba(16,185,129,0.1)', color:'#10B981', borderRadius:'12px' }}><Truck size={24}/></div>
          <div>
            <div style={{ fontSize:'24px', fontWeight:'bold' }}>{activeDelivery}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>Active Delivery Agents</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding:'20px', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ padding:'12px', background:'rgba(245,158,11,0.1)', color:'#F59E0B', borderRadius:'12px' }}><Shield size={24}/></div>
          <div>
            <div style={{ fontSize:'24px', fontWeight:'bold' }}>{activeOffice}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>Active Staff Members</div>
          </div>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
        <div style={{ display:'flex', gap:'8px', background:'rgba(255,255,255,0.03)', padding:'4px', borderRadius:'12px', border:'1px solid var(--glass-border)' }}>
          {['all', 'staff', 'delivery'].map(role => (
            <button key={role} onClick={() => setRoleFilter(role)}
              style={{
                padding:'8px 16px', borderRadius:'8px', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'13px', fontWeight:500,
                background: roleFilter === role ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: roleFilter === role ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s'
              }}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>
        
        <div style={{ position:'relative', width:'100%', maxWidth:'300px' }}>
          <Search size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 12px 10px 36px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white', outline:'none', fontSize:'13px' }}/>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>Loading staff...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding:'60px 20px', textAlign:'center' }}>
          <Users size={48} style={{ color:'var(--glass-border)', margin:'0 auto 16px', display:'block' }}/>
          <h3 style={{ fontSize:'18px', marginBottom:'8px' }}>No members found</h3>
          <p style={{ color:'var(--text-muted)', fontSize:'14px' }}>Try adjusting your search or add a new team member.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px' }}>
          {filtered.map(s => (
            <div key={s.id} className="glass-panel" style={{ padding:'24px', display:'flex', flexDirection:'column', height:'100%' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'bold', flexShrink:0 }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin:0, fontSize:'16px' }}>{s.name}</h3>
                    <span style={{ fontSize:'12px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px', marginTop:'4px' }}>
                      <Mail size={12}/> {s.email}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(59,130,246,0.1)', color:'var(--color-primary)', borderRadius:'12px', fontSize:'12px', fontWeight:500 }}>
                  <Shield size={12}/> {s.role.toUpperCase()}
                </span>
                {s.active ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(16,185,129,0.1)', color:'#10B981', borderRadius:'12px', fontSize:'12px', fontWeight:500 }}>
                    <CheckCircle size={12}/> Active
                  </span>
                ) : (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(255,255,255,0.05)', color:'var(--text-muted)', borderRadius:'12px', fontSize:'12px', fontWeight:500 }}>
                    <Clock size={12}/> Inactive
                  </span>
                )}
              </div>
              
              <div style={{ marginTop:'auto', paddingTop:'16px', borderTop:'1px solid var(--glass-border)', display:'flex', gap:'12px' }}>
                <button onClick={() => openEdit(s)} className="btn-secondary" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'8px' }}>
                  <Edit2 size={14}/> Edit
                </button>
                <button onClick={() => handleDeleteStaff(s.id)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'8px', background:'rgba(236,72,153,0.1)', color:'var(--color-danger)', border:'1px solid rgba(236,72,153,0.2)', borderRadius:'8px', cursor:'pointer', fontWeight:500 }}>
                  <Trash2 size={14}/> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div className="glass-panel" style={{ padding:'32px', width:'100%', maxWidth:'400px', background:'#0B1121', position:'relative' }}>
            <button onClick={() => setShowAddModal(false)} style={{ position:'absolute', top:'24px', right:'24px', background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h2 style={{ marginBottom:'24px', fontSize:'20px' }}>Add Team Member</h2>
            <form onSubmit={handleAddStaff} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Full Name *</label>
                <input required className="input-field" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Email Address *</label>
                <input required type="email" className="input-field" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Role *</label>
                <select className="input-field" value={formData.role} onChange={e=>setFormData({...formData, role:e.target.value})}>
                  <option value="staff">Staff (Office Admin)</option>
                  <option value="delivery">Delivery Agent</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Temporary Password *</label>
                <input required type="password" className="input-field" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} />
              </div>
              
              <div style={{ display:'flex', gap:'12px', marginTop:'12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex:1, padding:'12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1, padding:'12px' }}>
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editData && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div className="glass-panel" style={{ padding:'32px', width:'100%', maxWidth:'400px', background:'#0B1121', position:'relative' }}>
            <button onClick={() => setShowEditModal(false)} style={{ position:'absolute', top:'24px', right:'24px', background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer' }}><X size={20}/></button>
            <h2 style={{ marginBottom:'24px', fontSize:'20px' }}>Edit Member</h2>
            <form onSubmit={handleEditStaff} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Full Name *</label>
                <input required className="input-field" value={editData.name} onChange={e=>setEditData({...editData, name:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Email Address *</label>
                <input required type="email" className="input-field" value={editData.email} onChange={e=>setEditData({...editData, email:e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Role *</label>
                <select className="input-field" value={editData.role} onChange={e=>setEditData({...editData, role:e.target.value})}>
                  <option value="staff">Staff (Office Admin)</option>
                  <option value="delivery">Delivery Agent</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <input type="checkbox" checked={editData.active} onChange={e=>setEditData({...editData, active:e.target.checked})} />
                  Account Active
                </label>
              </div>
              
              <div style={{ display:'flex', gap:'12px', marginTop:'12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" style={{ flex:1, padding:'12px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1, padding:'12px' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;
