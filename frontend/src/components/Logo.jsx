import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logo = ({ to = "/shop" }) => {
  const { company } = useAuth() || {};
  const nameParts = (company?.name || 'CHARU MKTG').split(' ');
  const firstWord = nameParts[0];
  const restWords = nameParts.slice(1).join(' ');

  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
      <div style={{
        position: 'relative',
        width: '42px',
        height: '42px',
        background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9"/>
          <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="white" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-main)', display: 'block', lineHeight: 1 }}>
          {firstWord} <span style={{ color: 'var(--color-brand)' }}>{restWords}</span>
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Wholesale Distribution
        </span>
      </div>
    </Link>
  );
};

export default Logo;
