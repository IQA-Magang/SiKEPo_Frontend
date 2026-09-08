import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Building2,
  Mail,
  Hash,
  Award,
  Calendar,
  Key,
  CheckCircle,
  AlertCircle,
  Pencil,
  Save,
  X,
  Lock,
  Box,
  Users,
  Activity,
  ArrowRight
} from 'lucide-react';
import { userApi, setStoredUser } from '../../utils/api';

const ADMIN_PERMISSIONS = [
  { text: 'Kelola Master Data Alat Ukur (CRUD Penuh: Tambah, Edit, Hapus)', granted: true },
  { text: 'Manajemen Akun Pengguna & Hak Akses Backend (/api/users)', granted: true },
  { text: 'Konfigurasi Sistem & Log Audit Mutasi', granted: true },
  { text: 'Otorisasi Verifikasi Kelayakan (TLKM13/P)', granted: false, note: 'Kewenangan Manajer Mutu' },
  { text: 'Peminjaman Operasional Alat Lab', granted: true },
];

export default function AdminProfile({ user, onUpdateUser, onSwitchRole, onNavigate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state for Admin
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    nip: user?.nip || '',
    position: user?.position || '',
    division: user?.division || 'IT & Sistem Lab (Telkom Test House)',
    password: ''
  });

  // Sync formData whenever user prop changes (no hardcoded fallback — use real DB data)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name || '',
        email: user.email || prev.email || '',
        nip: user.nip || prev.nip || '',
        position: user.position || prev.position || '',
        division: user.division || prev.division || 'IT & Sistem Lab (Telkom Test House)',
      }));
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let targetUserId = user?.user_id;

      // If user_id is missing, find it from backend users list by NIP/email
      if (!targetUserId) {
        try {
          const listRes = await userApi.getAll();
          if (listRes?.data?.length) {
            const found = listRes.data.find(u => u.email === user?.email || u.nip === user?.nip || u.role === 'admin');
            if (found?.user_id) {
              targetUserId = found.user_id;
            }
          }
        } catch {
          // ignore lookup error
        }
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        nip: formData.nip.trim(),
        position: formData.position.trim(),
        role: 'admin'
      };

      if (formData.password && formData.password.length >= 6) {
        payload.password = formData.password;
      }

      let backendUserData = null;
      if (targetUserId) {
        const updateRes = await userApi.update(targetUserId, payload);
        if (updateRes && updateRes.data) {
          backendUserData = updateRes.data;
        }
      }

      // Prepare updated user object
      const updatedUser = {
        ...(user || {}),
        ...(backendUserData || {}),
        name: payload.name,
        email: payload.email,
        nip: payload.nip,
        position: payload.position,
        division: formData.division.trim(),
        role: 'admin',
        ...(targetUserId ? { user_id: targetUserId } : {})
      };

      // Update localStorage & notify app
      setStoredUser(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);

      setNotice('Profil Administrator berhasil disimpan dan disinkronkan ke database.');
      setIsEditing(false);
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.message || 'Gagal menyimpan pembaruan profil ke database');
    } finally {
      setSaving(false);
    }
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

      {error && (
        <div className="eq-confirm-banner" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#DC2626" />
            <span>{error}</span>
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
                background: 'linear-gradient(135deg, #E30613 0%, #990000 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(227, 6, 19, 0.25)',
                flexShrink: 0
              }}
            >
              <User size={38} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0 }}>
                  {formData.name}
                </h1>
                <span className="role-badge-pill badge-role-admin">
                  <Shield size={12} />
                  Administrator Sistem
                </span>
                <span className="account-status-pill">
                  <span className="status-indicator-dot" />
                  Hak Akses Penuh
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 6px 0' }}>
                {formData.position} • NIP: {formData.nip}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#4B5563', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={13} color="#9CA3AF" /> {formData.division}
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
                <Pencil size={14} /> Edit Profil Saya
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
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>302 Unit</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Master Data Terkelola</span>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => onNavigate('/users')}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>Kelola Akun</strong>
              <span style={{ fontSize: '11px', color: '#2563EB' }}>Buka User Management →</span>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '16px', fontWeight: 800, color: '#111827', display: 'block' }}>148 Log</strong>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>Audit Sistem Bulan Ini</span>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Details or Edit Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* LEFT: Identitas Administrator */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Informasi Identitas Administrator</h2>
              <p className="panel-subtitle">
                {isEditing ? 'Mode Edit: Admin memiliki hak mengubah seluruh field profilnya' : 'Data personel resmi tercatat di sistem'}
              </p>
            </div>
            <span className="role-tag-badge admin">Hak Edit Penuh</span>
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><User size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Nama Lengkap</span>
                <span className="eq-detail-value">{formData.name}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Hash size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> NIP Pegawai</span>
                <span className="eq-detail-value">{formData.nip}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Mail size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Email Resmi</span>
                <span className="eq-detail-value">{formData.email}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Award size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Jabatan / Posisi</span>
                <span className="eq-detail-value">{formData.position}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Building2 size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Unit / Divisi Kerja</span>
                <span className="eq-detail-value">{formData.division}</span>
              </div>
              <div className="eq-detail-row">
                <span className="eq-detail-label"><Shield size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Tingkat Kewenangan</span>
                <span className="eq-detail-value">Superuser (Full Control)</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="eq-form-group">
                <label className="eq-form-label"><User size={13} /> Nama Lengkap</label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="eq-form-group">
                <label className="eq-form-label"><Hash size={13} /> Nomor Induk Pegawai (NIP)</label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  required
                />
              </div>

              <div className="eq-form-group">
                <label className="eq-form-label"><Mail size={13} /> Email Resmi</label>
                <input
                  type="email"
                  className="eq-form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="eq-form-group">
                <label className="eq-form-label"><Award size={13} /> Jabatan / Posisi</label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>

              <div className="eq-form-group">
                <label className="eq-form-label"><Building2 size={13} /> Unit / Divisi</label>
                <input
                  type="text"
                  className="eq-form-input"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  required
                />
              </div>

              <div className="eq-form-group">
                <label className="eq-form-label"><Lock size={13} /> Kata Sandi Baru (Opsional)</label>
                <input
                  type="password"
                  className="eq-form-input"
                  placeholder="Kosongkan jika tidak ingin mengubah sandi"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-hero-primary" disabled={saving}>
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" className="eq-btn-cancel" onClick={() => setIsEditing(false)}>
                  Batal
                </button>
              </div>
            </form>
          )}
        </section>

        {/* RIGHT: Matriks Hak Akses Administrator */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Matriks Hak Akses Administrator Sistem</h2>
              <p className="panel-subtitle">Kewenangan pengelolaan sistem dan data inventaris laboratorium</p>
            </div>
            <span className="compliance-tag">SOP SiKEPo</span>
          </div>

          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', margin: 0 }}>
              Sebagai Administrator Sistem, Anda memiliki hak akses penuh untuk memanajemen inventaris alat ukur, data master pengguna, serta pengaturan sistem dan keamanan aplikasi.
            </p>
          </div>

          <div className="permission-matrix">
            {ADMIN_PERMISSIONS.map((perm, idx) => (
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
            <button className="btn-hero-primary" style={{ padding: '7px 14px', fontSize: '12px' }} onClick={() => onNavigate('/users')}>
              <Users size={14} /> Kelola Pengguna Sistem
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
