import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// A simple global state for toasts since we don't have a complex store setup yet.
// In a real app, use a Context or Redux/Zustand.
let toastCount = 0;
let toastListeners = [];

export const showToast = (message, type = 'info', duration = 4000) => {
  const id = ++toastCount;
  toastListeners.forEach(listener => listener({ id, message, type, duration }));
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toast) => {
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
      }
    };
    
    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handleNewToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let Icon = Info;
        let tClass = 'toast-info';
        
        if (toast.type === 'success') { Icon = CheckCircle; tClass = 'toast-success'; }
        if (toast.type === 'error') { Icon = XCircle; tClass = 'toast-error'; }
        if (toast.type === 'warning') { Icon = AlertTriangle; tClass = 'toast-warning'; }

        return (
          <div key={toast.id} className={`toast ${tClass}`}>
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)} 
              style={{ background: 'transparent', color: 'inherit', padding: '2px', opacity: 0.7, pointerEvents: 'all' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
