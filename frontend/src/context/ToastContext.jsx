import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: '#fff',
              borderLeft: `4px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '300px',
              maxWidth: '400px',
              animation: 'slideInRight 0.3s ease-out forwards'
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle color="#10B981" size={20} />
            ) : (
              <XCircle color="#EF4444" size={20} />
            )}
            <div style={{ flex: 1, fontSize: '14px', color: '#111827', fontWeight: 500, lineHeight: 1.4 }}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
