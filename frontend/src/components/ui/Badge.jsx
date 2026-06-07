import React from 'react';

const Badge = ({ children, variant = 'muted', icon: Icon, dot = false, className = '' }) => {
  const vClass = `badge-${variant}`;
  const dotClass = dot ? 'badge-dot' : '';
  
  return (
    <span className={`badge ${vClass} ${dotClass} ${className}`}>
      {Icon && !dot && <Icon size={12} />}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  let variant = 'muted';
  let label = status || 'Unknown';

  const statusLower = String(status).toLowerCase();

  switch (statusLower) {
    case 'pending': 
    case 'processing':
      variant = 'warning'; 
      break;
    case 'dispatched':
    case 'shipped':
    case 'active':
      variant = 'info'; 
      break;
    case 'paid':
    case 'delivered':
    case 'completed':
    case 'success':
      variant = 'success'; 
      break;
    case 'overdue':
    case 'cancelled':
    case 'failed':
    case 'rejected':
      variant = 'danger'; 
      break;
    case 'draft':
      variant = 'muted';
      break;
    default:
      break;
  }

  return <Badge variant={variant} dot>{label}</Badge>;
};

export default Badge;
