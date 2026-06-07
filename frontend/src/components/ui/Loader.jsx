import React from 'react';

const Loader = ({ type = 'spinner', size = 'md', className = '' }) => {
  if (type === 'skeleton-card') {
    return (
      <div className={`skeleton skeleton-card ${className}`}></div>
    );
  }

  if (type === 'skeleton-text') {
    return (
      <div className={`skeleton skeleton-text ${className}`} style={{ width: size === 'full' ? '100%' : size === 'lg' ? '75%' : '50%' }}></div>
    );
  }
  
  if (type === 'skeleton-title') {
    return (
      <div className={`skeleton skeleton-title ${className}`} style={{ width: size === 'full' ? '100%' : size === 'lg' ? '60%' : '40%' }}></div>
    );
  }

  // default spinner
  let spinnerClass = 'spinner';
  if (size === 'sm') spinnerClass = 'spinner-sm';
  if (size === 'lg') spinnerClass = 'spinner-lg';

  return (
    <div className={`flex-center ${className}`} style={{ padding: '24px', width: '100%' }}>
      <div className={spinnerClass}></div>
    </div>
  );
};

export default Loader;
