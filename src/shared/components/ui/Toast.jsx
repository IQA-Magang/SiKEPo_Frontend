import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  const { id, type = 'info', message, duration = 4000 } = toast;

  useEffect(() => {
    if (!duration || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon text-success" />,
    error: <AlertCircle size={18} className="toast-icon text-error" />,
    warning: <AlertTriangle size={18} className="toast-icon text-warning" />,
    info: <Info size={18} className="toast-icon text-info" />,
  };

  return (
    <div
      className={`toast-item toast-${type} fade-in-right`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      id={`toast-${id}`}
    >
      <div className="toast-icon-wrapper">
        {icons[type] || icons.info}
      </div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close-btn"
        onClick={() => onClose(id)}
        aria-label="Tutup notifikasi"
        title="Tutup"
      >
        <X size={15} />
      </button>
    </div>
  );
}
