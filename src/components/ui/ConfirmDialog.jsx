import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Auto-focus ke tombol batal jika danger (mencegah salah klik enter) atau confirm jika info
    const timer = setTimeout(() => {
      if (variant === 'danger' && cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      } else if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, variant, onCancel]);

  if (!isOpen) return null;

  const iconVariants = {
    danger: <div className="confirm-icon-wrap bg-danger-subtle text-danger"><Trash2 size={24} /></div>,
    warning: <div className="confirm-icon-wrap bg-warning-subtle text-warning"><AlertTriangle size={24} /></div>,
    primary: <div className="confirm-icon-wrap bg-primary-subtle text-primary"><Info size={24} /></div>,
  };

  const confirmBtnClasses = {
    danger: 'btn btn-danger',
    warning: 'btn btn-warning',
    primary: 'btn btn-primary',
  };

  return (
    <div
      className="confirm-modal-overlay fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className="confirm-dialog-card zoom-in" tabIndex="-1">
        <div className="confirm-dialog-header">
          {iconVariants[variant] || iconVariants.primary}
          <button
            className="confirm-dialog-close"
            onClick={onCancel}
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="confirm-dialog-body">
          <h3 id="confirm-dialog-title" className="confirm-dialog-title">
            {title}
          </h3>
          <p id="confirm-dialog-desc" className="confirm-dialog-message">
            {message}
          </p>
        </div>

        <div className="confirm-dialog-footer">
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            id="btn-confirm-cancel"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={confirmBtnClasses[variant] || 'btn btn-danger'}
            onClick={onConfirm}
            id="btn-confirm-proceed"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
