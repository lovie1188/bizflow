import React, { useState, useEffect } from 'react';
import { ArrowRight, Building, FileText, UserPlus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const BuyerRegister = () => {
  const navigate = useNavigate();
  const { storeName } = useParams();
  const [supplierCompany, setSupplierCompany] = useState(null);

  const hostname = window.location.hostname;
  const isCustomDomain = hostname !== 'localhost' && !hostname.includes('bizflow.in');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        let endpoint = isCustomDomain 
          ? `/public/domain/${hostname}` 
          : `/public/store/${encodeURIComponent(storeName)}`;
        const data = await fetchApi(endpoint);
        if (data.success) setSupplierCompany(data.company);
      } catch (err) { console.error('Failed to fetch store info for registration', err); }
    };
    fetchCompany();
  }, [storeName, isCustomDomain, hostname]);

  const companyName = supplierCompany?.name || 'Supplier';
  const [formData, setFormData] = useState({
    businessName: '',
    gstin: '',
    phone: '',
    email: '',
    password: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi('/auth/register-buyer', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          companyId: supplierCompany?.id || null  // send supplier's companyId so buyer links to correct company
        })
      });
      // Registration successful, token generated
      localStorage.setItem('bizflow_token', data.token);
      localStorage.setItem('bizflow_user', JSON.stringify(data.user));
      navigate('/shop/catalog');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center" style={{ padding: '60px 24px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '600px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', marginBottom: '16px' }}>
            <UserPlus size={32} color="var(--color-secondary)" />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Register Business</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Join {companyName} to access wholesale rates and 15-day credit.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Business Name *</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input required type="text" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="e.g. SuperMart Retail" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', outline: 'none' }} />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>GSTIN *</label>
              <div style={{ position: 'relative' }}>
                <FileText size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input required type="text" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} placeholder="15-digit GST Number" style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address *</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="shop@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', outline: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Mobile Number *</label>
              <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765 43210" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password *</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Create a password" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', outline: 'none' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Complete Delivery Address *</label>
            <textarea required rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Shop No., Street, Area, City, Pincode" style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', outline: 'none', resize: 'vertical' }} />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-main)' }}>MSME Agreement Status</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              To place orders, you must eventually sign the Standard Buyer-Supplier Agreement. The supplier will generate your personalized agreement upon registration.
            </p>
            <div style={{ marginBottom: '16px' }}>
              <button type="button" className="btn-secondary" style={{ padding: '8px 12px', fontSize: '12px' }}>
                Download Pre-filled Agreement
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" style={{ marginTop: '4px', accentColor: 'var(--color-primary)' }} required />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                I agree to the 15-day credit terms. I understand that failure to pay within 45 days (if MSME registered) may attract interest under Section 43B(h) of the Income Tax Act.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            {loading ? 'Submitting...' : 'Submit Registration'} <ArrowRight size={20} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Already registered? <Link to="/shop/login" style={{ color: 'var(--color-primary)' }}>Login here</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default BuyerRegister;
