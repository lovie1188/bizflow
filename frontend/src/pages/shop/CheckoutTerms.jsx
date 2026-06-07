import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const CheckoutTerms = ({ isOpen, onClose, onAccept }) => {
  const [signature, setSignature] = useState('');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <div className="glass-panel" style={{
        background: 'var(--bg-card)', 
        maxWidth: '600px', width: '100%', 
        maxHeight: '90vh', overflowY: 'auto',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--color-primary)' }}>
            <ShieldCheck size={28} />
            <h2 style={{ fontSize: '24px', margin: 0 }}>Terms & Conditions</h2>
          </div>

          <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '24px' }}>
            <p>Please review and accept the B2B terms of service before placing your order. This acts as a digital agreement.</p>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '16px' }}>
              <h4 style={{ color: 'white', marginBottom: '8px' }}>1. Payment & MSME Compliance</h4>
              <p>Payment is strictly due within 15 days of invoice date. Late payments will incur interest as per MSME guidelines.</p>
              
              <h4 style={{ color: 'white', marginTop: '16px', marginBottom: '8px' }}>2. Return & Replacement Policy</h4>
              <ul style={{ paddingLeft: '20px' }}>
                <li>Returns or replacements of goods will <strong>only be allowed within 24 hours</strong> of delivery.</li>
                <li>Complaints regarding <strong>expired or damaged goods</strong> must be registered within <strong>12 hours</strong> of delivery.</li>
                <li><strong>Strict Deadline:</strong> No returns, replacements, or complaints will be accepted after <strong>72 hours</strong> from the time of delivery under any circumstances.</li>
              </ul>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Digital Signature (Type your full name) <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              type="text" 
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="e.g. John Doe"
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '16px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button 
              onClick={onClose}
              style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'white', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              disabled={signature.trim().length < 3}
              onClick={() => onAccept(signature)}
              style={{ padding: '12px 24px', opacity: signature.trim().length < 3 ? 0.5 : 1 }}
            >
              I Accept & Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutTerms;
