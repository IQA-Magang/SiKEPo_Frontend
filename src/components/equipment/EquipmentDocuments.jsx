import React, { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXT = '.pdf, .jpg, .jpeg, .png';

export default function EquipmentDocuments({ documents, onChange, onNext, onBack }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(f => ALLOWED_TYPES.includes(f.type));
    if (valid.length) {
      onChange([...documents, ...valid.map(f => ({ name: f.name, type: f.type.split('/')[1].toUpperCase(), size: `${(f.size / 1024).toFixed(0)} KB`, file: f }))]);
    }
  };

  const removeDoc = (idx) => onChange(documents.filter((_, i) => i !== idx));

  return (
    <div>
      <div
        className={`eq-upload-area ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <Upload size={36} className="eq-upload-icon" />
        <p className="eq-upload-title">Seret file ke sini atau klik untuk memilih</p>
        <p className="eq-upload-hint">PDF, JPG, JPEG, PNG — Sertifikat Kalibrasi, Manual Alat, Dokumen Pendukung</p>
        <label className="eq-btn-upload">
          Pilih File
          <input type="file" multiple accept={ALLOWED_EXT} hidden onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>

      {documents.length > 0 && (
        <div className="eq-doc-list">
          {documents.map((doc, idx) => (
            <div key={idx} className="eq-doc-item">
              <FileText size={18} className="eq-doc-icon" />
              <div className="eq-doc-info">
                <span className="eq-doc-name">{doc.name}</span>
                <span className="eq-doc-meta">{doc.type} · {doc.size}</span>
              </div>
              <button className="eq-doc-remove" onClick={() => removeDoc(idx)} title="Hapus">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="eq-form-actions">
        <button className="eq-btn-cancel" onClick={onBack}>← Kembali</button>
        <button className="eq-btn-next" onClick={onNext}>Simpan &amp; Lanjut →</button>
      </div>
    </div>
  );
}
