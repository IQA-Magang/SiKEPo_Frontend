import React from 'react';
import { X, HelpCircle } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
        
        <div className="modal-header">
          <div className="modal-icon-wrapper">
            <HelpCircle size={28} color="#E30613" />
          </div>
          <h3>Need Help?</h3>
        </div>

        <div className="modal-body">
          <p>
            Silakan hubungi administrator <strong>SiKEPo</strong> untuk mendapatkan bantuan.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-modal-close" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
