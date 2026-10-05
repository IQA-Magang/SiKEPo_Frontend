import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({
        title: options.title || 'Konfirmasi Tindakan',
        message: options.message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
        confirmText: options.confirmText || 'Konfirmasi',
        cancelText: options.cancelText || 'Batal',
        variant: options.variant || 'danger',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setConfig(null);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setConfig(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {config && (
        <ConfirmDialog
          isOpen={Boolean(config)}
          title={config.title}
          message={config.message}
          confirmText={config.confirmText}
          cancelText={config.cancelText}
          variant={config.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback jika tidak berada dalam provider
    return async (opts) => window.confirm(opts?.message || 'Konfirmasi?');
  }
  return ctx;
}
