import React, { useState, useEffect } from 'react';
import { Building, FileText, Calendar, MapPin, UploadCloud, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const BuyerProfile = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    
    // Initial data from local storage
    const userStr = localStorage.getItem('bizflow_user');
    let buyerId = null;
    if (userStr) {
      try { 
        const u = JSON.parse(userStr);
        setProfile(u); 
        buyerId = u.buyerEntityId;
      } catch (e) {}
    }

    // Fetch fresh data from DB
    if (buyerId) {
      fetchApi(`/buyers/${buyerId}`)
        .then(data => {
          if (data) {
            setProfile(prev => ({ ...prev, ...data }));
          }
        })
        .catch(err => console.error('Error fetching buyer profile:', err));
    }
  }, [isLoggedIn, navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    
    try {
      const token = localStorage.getItem('bizflow_token');
      if (!token) throw new Error('Not authenticated');
      const payload = JSON.parse(atob(token.split('.')[1]));
      const buyerEntityId = payload.buyerEntityId;
      if (!buyerEntityId) throw new Error('Buyer profile not linked. Please contact support.');

      const formData = new FormData();
      formData.append('agreementFile', file);

      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/buyers/${buyerEntityId}/agreement`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setUploadMsg('Agreement uploaded successfully and is under review!');
      setFile(null);
      // Optional: fetch profile again to reflect status
    } catch (err) {
      setUploadMsg('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: '32px' }}>
        
        {/* Sidebar Nav */}
        <aside style={{ width: '250px' }}>
          <div className="glass-panel" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
            <Link to="/shop/orders" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>My Orders</Link>
            <Link to="/shop/invoices" style={{ padding: '12px 24px', color: 'var(--text-main)', borderRight: '2px solid transparent' }}>My Invoices</Link>
            <Link to="/shop/profile" style={{ padding: '12px 24px', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', borderRight: '2px solid var(--color-primary)', fontWeight: 500 }}>Business Profile</Link>
          </div>
        </aside>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Business Profile</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Manage your business details and view credit limit.</p>

          <div className="glass-panel" style={{ padding: '32px', maxWidth: '700px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--glass-border)' }}>
              <div>
                <h2 style={{ fontSize: '24px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Building size={24} color="var(--color-primary)" /> {profile?.name || 'Loading...'}
                </h2>
                <div style={{ color: 'var(--text-muted)' }}>Registered Buyer Email: {profile?.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Status</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#10B981', textTransform: 'capitalize' }}>
                  {profile?.status || 'Pending'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <FileText size={16}/> Role
                </label>
                <input readOnly value={profile?.role || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Calendar size={16}/> Registered Since
                </label>
                <input readOnly value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '32px', maxWidth: '700px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>MSME Agreement & Onboarding</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              To place orders on credit, you must sign the MSME Buyer-Supplier Agreement with your official seal and upload it here.
            </p>
            
            <div style={{ padding: '24px', border: '2px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center' }}>
              <UploadCloud size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Upload Signed Agreement</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>PDF, JPG, PNG up to 10MB</p>
              
              <input type="file" id="agreementFile" onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,image/*" />
              
              {!file ? (
                <label htmlFor="agreementFile" className="btn-secondary" style={{ display: 'inline-block', padding: '10px 20px', cursor: 'pointer' }}>
                  Browse Files
                </label>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} /> {file.name}
                  </div>
                  <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Submit Document'}
                  </button>
                </div>
              )}
            </div>
            
            {uploadMsg && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: uploadMsg.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: uploadMsg.includes('Error') ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!uploadMsg.includes('Error') && <CheckCircle size={18} />}
                {uploadMsg}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BuyerProfile;
