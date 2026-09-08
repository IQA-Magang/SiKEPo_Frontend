import React from 'react';
import { X, Shield, User, Award, CheckCircle, AlertCircle, RefreshCw, Key, Building2, Mail, Hash } from 'lucide-react';

const ROLE_DETAILS = {
  admin: {
    title: 'Administrator Sistem',
    badgeClass: 'badge-role-admin',
    desc: 'Pengguna dengan akses penuh untuk mengelola master data, pengguna, pengaturan, serta fitur sistem SiKEPo.',
    permissions: [
      { text: 'Kelola Master Data Alat Ukur (CRUD Penuh)', granted: true },
      { text: 'Manajemen Akun Pengguna & Hak Akses (/api/users)', granted: true },
      { text: 'Konfigurasi Sistem & Audit Log Mutasi', granted: true },
      { text: 'Otorisasi Verifikasi Kelayakan (TLKM13/P)', granted: false, note: 'Kewenangan Manajer Mutu' },
      { text: 'Peminjaman Operasional Alat Lab', granted: true },
    ]
  },
  manager: {
    title: 'Manajer Penjaminan Mutu & Lab',
    badgeClass: 'badge-role-manager',
    desc: 'Pengguna dengan kewenangan luas untuk memantau aktivitas, verifikasi kelayakan TLKM13/P, dan evaluasi utilisasi lab.',
    permissions: [
      { text: 'Verifikasi & Otorisasi Status Kelayakan (TLKM13/P)', granted: true },
      { text: 'Persetujuan Mutasi Lokasi Antar Laboratorium', granted: true },
      { text: 'Pemantauan Kepatuhan Kalibrasi & Laporan Utilisasi', granted: true },
      { text: 'Monitoring Peminjaman & Pengembalian Lintas Lab', granted: true },
      { text: 'Pengaturan Teknis & Master Akun Sistem', granted: false, note: 'Kewenangan Admin IT' },
    ]
  },
  staff: {
    title: 'Staff Laboratorium / PIC Alat',
    badgeClass: 'badge-role-staff',
    desc: 'Pengguna operasional untuk mencari alat, melakukan peminjaman, penggunaan, pengembalian, serta cek riwayat tracking.',
    permissions: [
      { text: 'Pencarian Informasi & Ketersediaan Alat Real-time', granted: true },
      { text: 'Pengajuan Peminjaman, Perpanjangan & Pengembalian Alat', granted: true },
      { text: 'Melihat Tracking Posisi & Histori Alat', granted: true },
      { text: 'Verifikasi Kelayakan Status Alat (TLKM13/P)', granted: false, note: 'Memerlukan Persetujuan Manajer' },
      { text: 'Ubah Data Master Inventaris & Akun Pengguna', granted: false, note: 'Kewenangan Admin IT' },
    ]
  }
};

export default function ProfileModal({ isOpen, onClose, user, onSwitchRole }) {
  if (!isOpen) return null;

  const currentRole = (user?.role || 'admin').toLowerCase();
  const roleConfig = ROLE_DETAILS[currentRole] || ROLE_DETAILS.admin;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div className="profile-header-left">
            <div className="profile-avatar-large">
              <User size={28} />
            </div>
            <div>
              <h2 className="profile-name-heading">{user?.name || 'Pengguna SiKEPo'}</h2>
              <div className="profile-badge-row">
                <span className={`role-badge-pill ${roleConfig.badgeClass}`}>
                  <Shield size={12} />
                  {roleConfig.title}
                </span>
                <span className="account-status-pill">
                  <span className="status-indicator-dot" />
                  Sesi Aktif (JWT)
                </span>
              </div>
            </div>
          </div>
          <button className="profile-close-btn" onClick={onClose} aria-label="Tutup modal">
            <X size={20} />
          </button>
        </div>

        <div className="profile-modal-body">
          {/* Identitas Kepegawaian */}
          <section className="profile-section">
            <h3 className="profile-section-title">
              <Building2 size={16} /> Identitas Personel Laboratorium
            </h3>
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span className="info-label"><Hash size={13} /> NIP Pegawai</span>
                <strong className="info-value">{user?.nip || '-'}</strong>
              </div>
              <div className="profile-info-item">
                <span className="info-label"><Mail size={13} /> Email Resmi</span>
                <strong className="info-value">{user?.email || '-'}</strong>
              </div>
              <div className="profile-info-item">
                <span className="info-label"><Award size={13} /> Jabatan / Posisi</span>
                <strong className="info-value">{user?.position || '-'}</strong>
              </div>
              <div className="profile-info-item">
                <span className="info-label"><Building2 size={13} /> Unit Laboratorium</span>
                <strong className="info-value">{user?.division || 'Telkom Test House (TTH)'}</strong>
              </div>
            </div>
          </section>

          {/* Matriks Kewenangan Personel (TLKM13/P) */}
          <section className="profile-section">
            <div className="section-title-between">
              <h3 className="profile-section-title">
                <Key size={16} /> Matriks Kewenangan Personel (TLKM13/P)
              </h3>
              <span className="compliance-tag">SOP Telkom Test House</span>
            </div>
            <p className="profile-role-desc">{roleConfig.desc}</p>

            <div className="permission-matrix">
              {roleConfig.permissions.map((perm, idx) => (
                <div key={idx} className={`permission-item ${perm.granted ? 'granted' : 'restricted'}`}>
                  <div className="perm-icon">
                    {perm.granted ? <CheckCircle size={15} color="#059669" /> : <AlertCircle size={15} color="#9CA3AF" />}
                  </div>
                  <div className="perm-text">
                    <span className="perm-label">{perm.text}</span>
                    {perm.note && <small className="perm-note">({perm.note})</small>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Informasi Hak Akses Resmi */}
          <section className="profile-section" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B5563', fontSize: '12.5px' }}>
              <Shield size={16} color="#E30613" />
              <span>
                <strong>Catatan Otorisasi:</strong> Perubahan peran (role) dan hak akses personel hanya dapat dikelola secara resmi oleh <strong>Administrator</strong> melalui menu <em>Manajemen Pengguna</em>.
              </span>
            </div>
          </section>
        </div>

        <div className="profile-modal-footer">
          <button className="btn-profile-done" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
