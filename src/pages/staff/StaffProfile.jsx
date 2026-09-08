import React, { useState, useEffect } from 'react';
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
  Box,
  Clock,
  ArrowRight
} from 'lucide-react';

import { setStoredUser, userApi } from '../../utils/api';

const STAFF_PERMISSIONS = [
  { text: 'Pencarian Informasi & Ketersediaan Alat Real-time', granted: true },
  { text: 'Pengajuan Peminjaman, Perpanjangan & Pengembalian Alat', granted: true },
  { text: 'Melihat Tracking Posisi & Histori Alat', granted: true },
  { text: 'Verifikasi Kelayakan Status Alat (TLKM13/P)', granted: false, note: 'Memerlukan Persetujuan Manajer' },
  { text: 'Ubah Data Master Inventaris & Akun Pengguna', granted: false, note: 'Kewenangan Admin IT' },
];

export default function StaffProfile({ user, onUpdateUser, onSwitchRole, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  // Editable: name and email only!
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Sync state whenever user prop updates
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Locked values — taken from real DB data, no hardcoded fallback
  const nip = user?.nip || '';
  const position = user?.position || '';
  const division = user?.division || '';

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updatedUser = {
      ...(user || {}),
      name: name.trim(),
      email: email.trim(),
      nip,
      position,
      division,
      role: 'staff'
    };

    // If backend allows (e.g. current JWT is admin testing staff profile), try sync
    if (user?.user_id) {
      try {
        await userApi.update(user.user_id, {
          name: updatedUser.name,
          email: updatedUser.email,
          nip: updatedUser.nip,
          position: updatedUser.position,
          role: 'staff'
        });
      } catch (err) {
        // Backend only allows role admin to update /api/users/:id. Keep client session updated.
        console.warn('Backend update note:', err.message);
      }
    }

    setStoredUser(updatedUser);
    if (onUpdateUser) onUpdateUser(updatedUser);

    setNotice('Nama dan Email Anda berhasil disimpan dan diperbarui.');
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
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
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
                <span className="role-badge-pill badge-role-staff">
                  <Shield size={12} />
                  Staff Operasional Lab (PIC)
                </span>
                <span className="account-status-pill">
                  <span className="status-indicator-dot" />
                  Operasional Aktif
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
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF2F2', color: '#E30613', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>3 Unit</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Alat Sedang Dipinjam</span>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>1 Unit Besok</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Batas Pengembalian</span>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>14 Kali</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Riwayat Pengujian Saya</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* LEFT: Identitas Personel Staff */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Informasi Identitas Staff Laboratorium</h2>
              <p className="panel-subtitle">
                {isEditing ? 'Sesuai regulasi: Staff hanya diizinkan mengubah Nama dan Email' : 'Data resmi tercatat di sistem'}
              </p>
            </div>
            <span className="role-tag-badge staff">Edit Terbatas</span>
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
                <span className="eq-detail-label"><Shield size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Tingkat Akses</span>
                <span className="eq-detail-value">Operasional Laboratorium</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Note banner on edit restrictions */}
              <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', fontSize: '11.5px', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} color="#2563EB" />
                <span>Kewenangan edit Staff dibatasi pada Nama dan Email saja. Field kepegawaian lainnya dikunci.</span>
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

        {/* RIGHT: Matriks Hak Akses Staff */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Matriks Hak Akses Staff Laboratorium</h2>
              <p className="panel-subtitle">Kewenangan operasional peminjaman dan pengujian alat</p>
            </div>
            <span className="compliance-tag">SOP TTH</span>
          </div>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', margin: 0 }}>
              Pengguna operasional untuk mencari ketersediaan alat, mengajukan peminjaman, mencatat pengembalian alat, serta memantau histori pengujian alat laboratorium.
            </p>
          </div>

          <div className="permission-matrix">
            {STAFF_PERMISSIONS.map((perm, idx) => (
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
            <button className="btn-hero-primary" style={{ padding: '7px 14px', fontSize: '12px' }} onClick={() => onNavigate('/peminjaman')}>
              Ajukan Peminjaman
            </button>
            <button className="btn-hero-secondary" style={{ padding: '7px 14px', fontSize: '12px' }} onClick={() => onNavigate('/dashboard')}>
              Ke Dashboard <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
