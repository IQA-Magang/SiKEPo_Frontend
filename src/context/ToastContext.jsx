import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const success = useCallback((message, duration) => showToast({ message, type: 'success', duration }), [showToast]);
  const error = useCallback((message, duration) => showToast({ message, type: 'error', duration }), [showToast]);
  const warning = useCallback((message, duration) => showToast({ message, type: 'warning', duration }), [showToast]);
  const info = useCallback((message, duration) => showToast({ message, type: 'info', duration }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Container fixed di pojok kanan atas */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback jika dipanggil di luar provider (misal saat testing)
    return {
      showToast: console.log,
      success: console.log,
      error: console.error,
      warning: console.warn,
      info: console.info,
      removeToast: () => {},
    };
  }
  return ctx;
}
