import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXT = '.pdf, .jpg, .jpeg, .png';

export default function EquipmentDocuments({ documents, onChange, onNext, onBack }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    if (!files || !files.length) return;
    const valid = Array.from(files).filter(f => ALLOWED_TYPES.includes(f.type));
    if (valid.length) {
      onChange([
        ...documents,
        ...valid.map(f => ({
          name: f.name,
          type: f.type.split('/')[1].toUpperCase(),
          size: `${(f.size / 1024).toFixed(0)} KB`,
          file: f,
        })),
      ]);
    }
  };

  const removeDoc = (idx) => onChange(documents.filter((_, i) => i !== idx));

  const handleAreaClick = (e) => {
    // Avoid re-triggering if the user specifically clicked the label button directly
    if (e.target.closest('.eq-btn-upload')) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="eq-documents-container">
      <div
        className={`eq-upload-area ${dragOver ? 'drag-over' : ''}`}
        onClick={handleAreaClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Area unggah dokumen. Ketuk atau seret file ke sini untuk memilih."
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={36} className="eq-upload-icon" />
        <p className="eq-upload-title">Ketuk atau seret file ke sini untuk memilih</p>
        <p className="eq-upload-hint">PDF, JPG, JPEG, PNG — Sertifikat Kalibrasi, Manual Alat, Dokumen Pendukung</p>
        <label className="eq-btn-upload" onClick={(e) => e.stopPropagation()}>
          Pilih File
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXT}
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {documents.length > 0 && (
        <div className="eq-doc-list">
          {documents.map((doc, idx) => (
            <div key={idx} className="eq-doc-item">
              <FileText size={18} className="eq-doc-icon" />
              <div className="eq-doc-info">
                <span className="eq-doc-name" title={doc.name}>{doc.name}</span>
                <span className="eq-doc-meta">{doc.type} · {doc.size}</span>
              </div>
              <button
                type="button"
                className="eq-doc-remove"
                onClick={(e) => { e.stopPropagation(); removeDoc(idx); }}
                title="Hapus dokumen"
                aria-label={`Hapus ${doc.name}`}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="eq-form-actions">
        <button type="button" className="eq-btn-cancel" onClick={onBack}>← Kembali</button>
        <button type="button" className="eq-btn-next" onClick={onNext}>Simpan &amp; Lanjut →</button>
      </div>
    </div>
  );
}

