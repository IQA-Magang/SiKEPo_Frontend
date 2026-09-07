import React, { useState } from 'react';
import {
  User,
  Shield,
  Building2,
  Mail,
  Hash,
  Award,
  Key,
  CheckCircle,
  AlertCircle,
  Pencil,
  Save,
  X,
  Lock,
  Clock,
  FileCheck2,
  Activity,
  ArrowRight
} from 'lucide-react';

const MANAGER_PERMISSIONS = [
  { text: 'Verifikasi & Otorisasi Status Kelayakan (TLKM13/P)', granted: true },
  { text: 'Persetujuan Mutasi Lokasi Antar Laboratorium', granted: true },
  { text: 'Pemantauan Kepatuhan Kalibrasi & Laporan Utilisasi', granted: true },
  { text: 'Monitoring Peminjaman & Pengembalian Lintas Lab', granted: true },
  { text: 'Pengaturan Teknis & Master Akun Sistem', granted: false, note: 'Kewenangan Admin IT' },
];

export default function ManagerProfile({ user, onUpdateUser, onSwitchRole, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  // Editable: name and email only!
  const [name, setName] = useState(user?.name || 'Ir. Hendra Wijaya, M.T.');
  const [email, setEmail] = useState(user?.email || 'manager@sikepo.test');

  // Locked values
  const nip = user?.nip || '197509142000031001';
  const position = user?.position || 'Manager Penjaminan Mutu & Pengujian';
  const division = user?.division || 'Manajemen Mutu Laboratorium (TLKM13/P)';

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);

    const updatedUser = {
      ...(user || {}),
      name: name.trim(),
      email: email.trim(),
      nip,
      position,
      division,
      role: 'manager'
    };

    localStorage.setItem('sikepo_user', JSON.stringify(updatedUser));
    if (onUpdateUser) onUpdateUser(updatedUser);

    setNotice('Nama dan Email Manajer berhasil diperbarui.');
    setIsEditing(false);
    setSaving(false);
    setTimeout(() => setNotice(''), 3500);
  };

  return (
    <>
      {/* Notice Banner */}
      {notice && (
        <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#059669" />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* Hero Profile Card */}
      <section className="panel" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(217, 119, 6, 0.25)',
                flexShrink: 0
              }}
            >
              <User size={38} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  {name}
                </h1>
                <span className="role-badge-pill badge-role-manager">
                  <Shield size={12} />
                  Manajer Penjaminan Mutu & Lab
                </span>
                <span className="account-status-pill">
                  <span className="status-indicator-dot" />
                  TLKM13/P Otorisator
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0' }}>
                {position} • NIP: {nip}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#4B5563', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={13} color="#9CA3AF" /> {division}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={13} color="#9CA3AF" /> Telkom Test House (TTH)
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {!isEditing ? (
              <button
                type="button"
                className="btn-hero-primary"
                onClick={() => setIsEditing(true)}
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                <Pencil size={14} /> Edit Nama & Email
              </button>
            ) : (
              <button
                type="button"
                className="eq-btn-cancel"
                onClick={() => setIsEditing(false)}
                style={{ padding: '8px 16px', fontSize: '12.5px' }}
              >
                <X size={14} /> Batal
              </button>
            )}

            {/* Quick Switcher for Demo */}
            <div style={{ background: '#F3F4F6', padding: '6px', borderRadius: '12px', display: 'flex', gap: '6px' }}>
              <button type="button" className="role-switch-pill" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onSwitchRole('staff')}>Staff Lab</button>
              <button type="button" className="role-switch-pill active" style={{ padding: '6px 12px', fontSize: '12px' }}>Manajer</button>
              <button type="button" className="role-switch-pill" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onSwitchRole('admin')}>Admin</button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck2 size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>96.4%</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Kepatuhan TLKM13/P</span>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>3 Berkas</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Menunggu Verifikasi</span>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>78.2%</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Tingkat Utilisasi Alat</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* LEFT: Identitas Personel Manajer */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Informasi Identitas Manajer</h2>
              <p className="panel-subtitle">
                {isEditing ? 'Sesuai regulasi: Manajer hanya diizinkan mengubah Nama dan Email' : 'Data resmi tercatat di sistem'}
              </p>
            </div>
            <span className="role-tag-badge manager">Edit Terbatas</span>
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><User size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Nama Lengkap</span>
                <span className="eq-detail-value">{name}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Mail size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Email Resmi</span>
                <span className="eq-detail-value">{email}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Hash size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> NIP Pegawai</span>
                <span className="eq-detail-value">{nip} <small style={{ color: '#9CA3AF' }}>(Terkunci)</small></span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Award size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Jabatan / Posisi</span>
                <span className="eq-detail-value">{position}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Building2 size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Unit / Divisi Kerja</span>
                <span className="eq-detail-value">{division}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Shield size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Standar Otoritas</span>
                <span className="eq-detail-value">TLKM13/P Lab SOP</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Note banner on edit restrictions */}
              <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', fontSize: '11.5px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} color="#D97706" />
                <span>Kewenangan edit Manajer dibatasi pada Nama dan Email saja. Field kepegawaian lainnya dikunci.</span>
              </div>

              {/* Editable: Nama */}
              <div className="eq-form-group">
                <label className="eq-form-label"><User size={13} /> Nama Lengkap (Bisa Diedit)</label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Editable: Email */}
              <div className="eq-form-group">
                <label className="eq-form-label"><Mail size={13} /> Email Resmi (Bisa Diedit)</label>
                <input
                  type="email"
                  className="eq-form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Locked: NIP */}
              <div className="eq-form-group">
                <label className="eq-form-label" style={{ color: '#6B7280' }}>
                  <Lock size={12} style={{ marginRight: '4px' }} /> NIP Pegawai (Terkunci)
                </label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={nip}
                  disabled
                  style={{ background: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                />
              </div>

              {/* Locked: Position */}
              <div className="eq-form-group">
                <label className="eq-form-label" style={{ color: '#6B7280' }}>
                  <Lock size={12} style={{ marginRight: '4px' }} /> Jabatan / Posisi (Terkunci)
                </label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={position}
                  disabled
                  style={{ background: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                />
              </div>

              {/* Locked: Division */}
              <div className="eq-form-group">
                <label className="eq-form-label" style={{ color: '#6B7280' }}>
                  <Lock size={12} style={{ marginRight: '4px' }} /> Unit / Divisi (Terkunci)
                </label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={division}
                  disabled
                  style={{ background: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-hero-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Nama & Email'}
                </button>
                <button type="button" className="eq-btn-cancel" onClick={() => setIsEditing(false)}>
                  Batal
                </button>
              </div>
            </form>
          )}
        </section>

        {/* RIGHT: Matriks Hak Akses Manajer (TLKM13/P) */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Matriks Hak Akses & Kewenangan (TLKM13/P)</h2>
              <p className="panel-subtitle">Kewenangan manajerial untuk verifikasi kelayakan dan mutu alat</p>
            </div>
            <span className="compliance-tag">SOP TLKM13/P</span>
          </div>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', margin: 0 }}>
              Pengguna dengan kewenangan manajerial untuk memantau aktivitas operasional, memverifikasi status kelayakan alat (TLKM13/P), dan mengevaluasi kepatuhan kalibrasi laboratorium Telkom Test House.
            </p>
          </div>

          <div className="permission-matrix">
            {MANAGER_PERMISSIONS.map((perm, idx) => (
              <div key={idx} className={`permission-item ${perm.granted ? 'granted' : 'restricted'}`}>
                <div className="perm-icon">
                  {perm.granted ? <CheckCircle size={16} color="#059669" /> : <AlertCircle size={16} color="#9CA3AF" />}
                </div>
                <div className="perm-text">
                  <span className="perm-label">{perm.text}</span>
                  {perm.note && <small className="perm-note">({perm.note})</small>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
              Perlu perubahan NIP atau Jabatan? Hubungi Admin IT.
            </span>
            <button className="btn-hero-secondary" style={{ padding: '7px 14px', fontSize: '12px' }} onClick={() => onNavigate('/dashboard')}>
              Ke Dashboard <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
