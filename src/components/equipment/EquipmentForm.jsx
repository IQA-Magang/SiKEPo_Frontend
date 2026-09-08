import React, { useState } from 'react';
import { ROOMS, PICS, FREQUENCIES } from '../../data/mockEquipment';

const REQUIRED = ['assetNumber', 'name', 'brand', 'serialNumber', 'room', 'pic'];

const FIELDS_LEFT = [
  { key: 'assetNumber', label: 'Nomor Aset', placeholder: 'Masukkan nomor aset' },
  { key: 'brand', label: 'Merek', placeholder: 'Masukkan merek' },
  { key: 'serialNumber', label: 'Nomor Seri', placeholder: 'Masukkan nomor seri' },
  { key: 'measurementRange', label: 'Rentang Ukur', placeholder: 'Masukkan rentang ukur' },
  { key: 'accuracy', label: 'Akurasi', placeholder: 'Masukkan akurasi' },
  { key: 'room', label: 'Ruang', type: 'select', options: ROOMS },
  { key: 'frequency', label: 'Frekuensi Kalibrasi', type: 'select', options: FREQUENCIES },
];

const FIELDS_RIGHT = [
  { key: 'name', label: 'Nama Alat', placeholder: 'Masukkan nama alat' },
  { key: 'model', label: 'Tipe / Model', placeholder: 'Masukkan tipe/model' },
  { key: 'parameter', label: 'Parameter', placeholder: 'Masukkan parameter' },
  { key: 'resolution', label: 'Resolusi', placeholder: 'Masukkan resolusi' },
  { key: 'unit', label: 'Satuan', placeholder: 'Masukkan satuan' },
  { key: 'pic', label: 'PIC', type: 'select', options: PICS },
];

const EMPTY_FORM = {
  assetNumber: '', name: '', brand: '', model: '', serialNumber: '',
  parameter: '', measurementRange: '', resolution: '', accuracy: '',
  unit: '', room: '', pic: '', frequency: 'Tahunan',
};

export default function EquipmentForm({ onNext, onCancel }) {
  const [data, setData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setData(prev => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    REQUIRED.forEach(k => { if (!data[k]) errs[k] = 'Field ini wajib diisi.'; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate()) onNext(data); };

  const renderField = ({ key, label, placeholder, type, options }) => (
    <div key={key} className="eq-field-group">
      <label className="eq-field-label">
        {label} {REQUIRED.includes(key) && <span className="eq-required">*</span>}
      </label>
      {type === 'select' ? (
        <select className={`eq-field-input ${errors[key] ? 'error' : ''}`} value={data[key]} onChange={set(key)}>
          <option value="">-- Pilih {label} --</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          className={`eq-field-input ${errors[key] ? 'error' : ''}`}
          type="text"
          placeholder={placeholder}
          value={data[key]}
          onChange={set(key)}
        />
      )}
      {errors[key] && <span className="eq-field-error">{errors[key]}</span>}
    </div>
  );

  return (
    <div>
      <div className="eq-form-grid">
        <div>{FIELDS_LEFT.map(renderField)}</div>
        <div>{FIELDS_RIGHT.map(renderField)}</div>
      </div>

      <div className="eq-form-actions">
        <button className="eq-btn-cancel" onClick={onCancel}>Batal</button>
        <button className="eq-btn-next" onClick={handleNext}>Simpan &amp; Lanjut →</button>
      </div>
    </div>
  );
}
