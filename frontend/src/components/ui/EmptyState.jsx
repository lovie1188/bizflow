import React from 'react';
import { FileQuestion } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = 'No Data Found', 
  message = 'There is nothing to display here right now.', 
  action 
}) => {
  return (
    <div className="flex-col flex-center glass-panel" style={{ padding: '48px 24px', textAlign: 'center', minHeight: '300px' }}>
      <div style={{ 
        width: '64px', height: '64px', 
        borderRadius: '50%', 
        background: 'rgba(255,255,255,0.03)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px',
        color: 'var(--text-muted)'
      }}>
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', marginBottom: action ? '24px' : '0' }}>
        {message}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};

export default EmptyState;
