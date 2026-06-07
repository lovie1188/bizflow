import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, CheckCircle, Clock } from 'lucide-react';
import { fetchApi } from '../../utils/api';

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [adding, setAdding] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await fetchApi('/users/staff');
      setStaff(res);
    } catch (e) {
      console.error('Failed to load staff:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await fetchApi('/users/staff', {
        method: 'POST',
        body: formData
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'staff' });
      loadStaff();
    } catch (e) {
      alert(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'28px', marginBottom:'8px' }}>Staff & Delivery</h1>
          <p style={{ color:'var(--text-muted)' }}>Manage your delivery personnel and staff members.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <UserPlus size={18}/> Add Staff
        </button>
      </div>

      <div className="glass-panel" style={{ padding:'24px', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'600px' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--glass-border)', color:'var(--text-muted)', fontSize:'13px', textAlign:'left' }}>
              <th style={{ padding:'12px 16px' }}>Name</th>
              <th style={{ padding:'12px 16px' }}>Email</th>
              <th style={{ padding:'12px 16px' }}>Role</th>
              <th style={{ padding:'12px 16px' }}>Status</th>
              <th style={{ padding:'12px 16px' }}>Added On</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding:'16px', textAlign:'center', color:'var(--text-muted)' }}>Loading staff...</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan="5" style={{ padding:'16px', textAlign:'center', color:'var(--text-muted)' }}>No staff members found.</td></tr>
            ) : staff.map(s => (
              <tr key={s.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding:'16px', fontWeight:500 }}>{s.name}</td>
                <td style={{ padding:'16px', color:'var(--text-muted)' }}>{s.email}</td>
                <td style={{ padding:'16px' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(59,130,246,0.1)', color:'var(--color-primary)', borderRadius:'12px', fontSize:'12px', fontWeight:500 }}>
                    <Shield size={14}/> {s.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding:'16px' }}>
                  {s.active ? (
                    <span style={{ color:'#10B981', display:'flex', alignItems:'center', gap:'4px', fontSize:'13px' }}><CheckCircle size={14}/> Active</span>
                  ) : (
                    <span style={{ color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'4px', fontSize:'13px' }}><Clock size={14}/> Inactive</span>
                  )}
                </td>
                <td style={{ padding:'16px', color:'var(--text-muted)', fontSize:'13px' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
          <div className="glass-panel" style={{ padding:'32px', width:'100%', maxWidth:'400px', background:'#0B1121' }}>
            <h2 style={{ marginBottom:'24px', fontSize:'20px' }}>Add New Staff</h2>
            <form onSubmit={handleAddStaff} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Full Name</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}
                  style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Email Address</label>
                <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email:e.target.value})}
                  style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', display:'block' }}>Temporary Password</label>
                <input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})}
                  style={{ width:'100%', padding:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', borderRadius:'8px', color:'white' }} />
              </div>
              
              <div style={{ display:'flex', gap:'12px', marginTop:'12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex:1, padding:'12px', background:'transparent', border:'1px solid var(--glass-border)', color:'white', borderRadius:'8px', cursor:'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={adding} style={{ flex:1, padding:'12px' }}>
                  {adding ? 'Adding...' : 'Add Staff'}
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
