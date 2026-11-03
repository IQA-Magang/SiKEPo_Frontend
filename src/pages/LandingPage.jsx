import React, { lazy, Suspense, useState } from 'react';
import {
  Archive,
  ArrowLeftRight,
  Bell,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
  Database,
  FileText,
  FlaskConical,
  LogIn,
  MapPin,
  Menu,
  PenLine,
  QrCode,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import sikepoLogo from '../assets/logo/tth-logo2.png';
import '../styles/landing-page.css';

const QRScannerModal = lazy(() => import('../shared/components/QRScannerModal.jsx'));

const navigation = [
  ['Cara Kerja', '#cara-kerja'],
  ['Status Alat', '#status'],
  ['Fitur', '#fitur'],
  ['FAQ', '#faq'],
];

const statusItems = [
  {
    label: 'Laik Pakai',
    className: 'is-ok',
    icon: CheckCircle2,
    description: 'Bukti kelayakan berlaku lebih dari 90 hari lagi.',
    availability: 'Boleh digunakan',
  },
  {
    label: 'Segera Jatuh Tempo',
    className: 'is-due',
    icon: Clock3,
    description: 'Jatuh tempo dalam 90 hari. Jadwal kalibrasi atau verifikasi sedang disiapkan.',
    availability: 'Boleh digunakan',
  },
  {
    label: 'Mendesak',
    className: 'is-urgent',
    icon: CircleAlert,
    description: 'Jatuh tempo dalam 30 hari.',
    availability: 'Boleh digunakan',
  },
  {
    label: 'Tidak Laik',
    className: 'is-expired',
    icon: CircleX,
    description: 'Bukti kelayakan sudah kedaluwarsa. Status berubah otomatis sehari setelah jatuh tempo.',
    availability: 'Jangan digunakan',
  },
  {
    label: 'Karantina',
    className: 'is-quarantine',
    icon: ShieldCheck,
    description: 'Ditahan sementara sambil diperiksa; penyebabnya belum dipastikan.',
    availability: 'Jangan digunakan',
  },
  {
    label: 'Dalam Kalibrasi',
    className: 'is-calibrating',
    icon: RefreshCw,
    description: 'Alat sedang dikalibrasi atau diverifikasi dan tidak berada di lab.',
    availability: 'Tidak tersedia',
  },
  {
    label: 'Dihapuskan',
    className: 'is-retired',
    icon: Archive,
    description: 'Tidak dipakai lagi. Rekamannya tetap tersimpan.',
    availability: 'Tidak tersedia',
  },
];

const features = [
  {
    title: 'Register & lokasi alat',
    description: 'Data induk, lokasi terkini, dan riwayat perpindahan setiap alat.',
    reference: '§6.4.13 a, b, d',
    icon: Database,
  },
  {
    title: 'Pengingat jatuh tempo',
    description: 'Notifikasi H−90, H−30, dan H−7 ke Manager lab, ditambah peringatan saat lewat tempo.',
    reference: '§6.4.7',
    icon: Bell,
  },
  {
    title: 'Verifikasi & tanda tangan',
    description: 'Ajukan verifikasi, unggah sertifikat PDF, dan setujui dengan tanda tangan digital.',
    reference: '§6.4.4, §6.5',
    icon: PenLine,
  },
  {
    title: 'Peminjaman alat',
    description: 'Alat yang tidak laik otomatis tidak bisa dipinjam.',
    reference: '§6.4.3',
    icon: ArrowLeftRight,
  },
  {
    title: 'Riwayat bukti kelayakan',
    description: 'Sertifikat dan laporan verifikasi tersimpan utuh; status pada tanggal mana pun dapat diperiksa ulang.',
    reference: '§6.4.9, §6.4.13 e',
    icon: FileText,
  },
  {
    title: 'Jejak audit',
    description: 'Siapa mengubah apa, kapan, dan mengapa tercatat sebagai jejak audit.',
    reference: '§7.11, §8.4',
    icon: MapPin,
  },
];

const roles = [
  {
    title: 'Tamu & pelanggan',
    description: 'Memastikan alat yang dipakai untuk pengujian produk Anda berstatus laik.',
    access: 'Tanpa akun · Pindai QR',
    guest: true,
  },
  {
    title: 'Engineer & staf lab',
    description: 'Meminjam alat, mencatat pemakaian, dan mengajukan verifikasi.',
    access: 'Perlu akun',
  },
  {
    title: 'Manager lab',
    description: 'Menyetujui verifikasi dan memantau jadwal kalibrasi lab.',
    access: 'Perlu akun',
  },
  {
    title: 'Tim mutu & auditor',
    description: 'Menelusuri riwayat alat dan jejak audit sebagai bukti kepatuhan.',
    access: 'Perlu akun',
  },
];

const questions = [
  {
    question: 'Apakah saya perlu akun untuk memindai QR?',
    answer: 'Tidak. Tamu dapat melihat nama alat, nomor aset, status kelayakan, dan jatuh tempo tanpa akun. Informasi lain hanya untuk personel TTH.',
  },
  {
    question: 'Kamera tidak mau terbuka, bagaimana?',
    answer: 'Izinkan akses kamera untuk situs ini di pengaturan browser. Bila tetap tidak bisa, gunakan tab Unggah File atau Manual pada pemindai QR.',
  },
  {
    question: 'Apa arti status "Tidak Laik" atau "Karantina"?',
    answer: 'Keduanya berarti alat tidak boleh digunakan. Tidak Laik berarti bukti kelayakan kedaluwarsa. Karantina berarti alat sedang ditahan untuk diperiksa.',
    statusLink: true,
  },
  {
    question: 'Bagaimana cara mendapatkan akun?',
    answer: 'Pilih Masuk untuk mengakses SiKEPo. Hubungi admin SiKEPo lab terkait bila Anda memerlukan akun.',
    id: 'faq-akun',
  },
  {
    question: 'Saya lupa kata sandi.',
    answer: 'Pilih Masuk, lalu gunakan tautan lupa kata sandi pada halaman login.',
  },
  {
    question: 'Stiker QR rusak atau data alat tidak sesuai. Siapa yang dihubungi?',
    answer: 'Hubungi admin SiKEPo lab pemilik alat dengan menyebutkan nomor aset dan foto stikernya.',
    id: 'faq-salah',
  },
];

export default function LandingPage({ onNavigate }) {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScannerInitialTab, setQrScannerInitialTab] = useState('camera');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function openQrScanner(initialTab = 'camera') {
    setIsMobileMenuOpen(false);
    setQrScannerInitialTab(initialTab);
    setIsQrScannerOpen(false);
    requestAnimationFrame(() => setIsQrScannerOpen(true));
  }

  function navigateToLogin(event) {
    event.preventDefault();
    setIsMobileMenuOpen(false);
    onNavigate('/login');
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="landing-page">
      <a className="lp-skip-link" href="#main">Lewati ke konten utama</a>

      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <a className="lp-brand" href="/" aria-label="SiKEPo — beranda">
            <img src={sikepoLogo} alt="" />
            <span>
              <strong>SiKEPo</strong>
              <small>Telkom Test House</small>
            </span>
          </a>

          <nav
            className={`lp-navigation${isMobileMenuOpen ? ' is-open' : ''}`}
            aria-label="Navigasi utama"
          >
            {navigation.map(([label, href]) => (
              <a key={href} href={href} onClick={closeMobileMenu}>{label}</a>
            ))}
          </nav>

          <div className="lp-header-actions">
            <button className="lp-button lp-button-brand lp-button-small" type="button" onClick={openQrScanner}>
              <QrCode aria-hidden="true" />
              Scan QR
            </button>
            <a className="lp-button lp-button-outline lp-button-small" href="/login" onClick={navigateToLogin}>
              Masuk
            </a>
            <button
              className="lp-mobile-menu"
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-eyebrow">SiKEPo · Telkom Test House</span>
              <h1>Status alat ukur TTH, terlihat dalam satu pindai.</h1>
              <p className="lp-lead">
                SiKEPo mencatat lokasi, kalibrasi, dan kelayakan setiap alat ukur di Telkom Test House.
                Tamu cukup memindai stiker QR; personel TTH masuk untuk meminjam, memverifikasi, dan
                memantau jadwal.
              </p>

              <div className="lp-paths">
                <article className="lp-path lp-path-primary">
                  <span className="lp-eyebrow">Tamu &amp; pelanggan</span>
                  <h2>Cek status alat</h2>
                  <p>Pindai stiker QR pada alat untuk melihat status kelayakan dan jatuh temponya.</p>
                  <button className="lp-button lp-button-brand lp-button-large" type="button" onClick={openQrScanner}>
                    <QrCode aria-hidden="true" />
                    Pindai QR Alat
                  </button>
                  <div className="lp-path-more">
                    <button className="lp-text-button" type="button" onClick={() => openQrScanner('manual')}>
                      atau ketik nomor aset
                    </button>
                  </div>
                </article>

                <article className="lp-path">
                  <span className="lp-eyebrow">Personel TTH</span>
                  <h2>Kelola peralatan</h2>
                  <p>Pinjam alat, ajukan verifikasi, dan pantau jadwal kalibrasi lab Anda.</p>
                  <a className="lp-button lp-button-navy lp-button-large" href="/login" onClick={navigateToLogin}>
                    <LogIn aria-hidden="true" />
                    Masuk ke SiKEPo
                  </a>
                  <div className="lp-path-more">
                    Belum punya akun? <a className="lp-text-link" href="#faq-akun">Hubungi admin</a>
                  </div>
                </article>
              </div>
            </div>

            <div className="lp-hero-visual">
              <p className="lp-mock-caption" id="lp-mock-caption">Contoh tampilan setelah memindai</p>
              <div className="lp-phone" role="img" aria-labelledby="lp-mock-caption" aria-describedby="lp-mock-description">
                <div className="lp-phone-top"><span /></div>
                <div className="lp-phone-body">
                  <div className="lp-phone-heading">
                    <strong>SiKEPo</strong>
                    <span className="lp-demo-tag">Contoh</span>
                  </div>
                  <div className="lp-phone-card">
                    <strong className="lp-asset-number">001/DEMO</strong>
                    <p>Optical Power Meter</p>
                    <span className="lp-status-badge is-ok"><CheckCircle2 aria-hidden="true" />Laik Pakai</span>
                  </div>
                  <div className="lp-phone-card">
                    <div className="lp-key-value"><span>Jatuh tempo</span><strong>10 Okt 2027</strong></div>
                    <div className="lp-key-value"><span>Sisa</span><strong>342 hari</strong></div>
                    <div className="lp-key-value"><span>Regime</span><strong>Kalibrasi</strong></div>
                  </div>
                  <span className="lp-phone-login">Masuk untuk meminjam</span>
                </div>
              </div>
              <p className="lp-sr-only" id="lp-mock-description">
                Contoh ponsel menampilkan nomor aset 001/DEMO, Optical Power Meter, status Laik Pakai,
                jatuh tempo 10 Oktober 2027, dan informasi kalibrasi.
              </p>
            </div>
          </div>
        </section>

        <section className="lp-trust" aria-label="Informasi sistem">
          <div className="lp-container">
            <ul>
              <li><ShieldCheck aria-hidden="true" /><span>Mengacu <strong>ISO/IEC 17025:2017 §6.4</strong></span></li>
              <li><CheckCircle2 aria-hidden="true" /><span>Status <strong>dihitung otomatis</strong> dari bukti kelayakan</span></li>
              <li><Database aria-hidden="true" /><span><strong>Data alat</strong> terdaftar terpusat</span></li>
              <li><FlaskConical aria-hidden="true" /><span><strong>Data laboratorium</strong> dikelola terintegrasi</span></li>
            </ul>
          </div>
        </section>

        <section className="lp-section" id="cara-kerja">
          <div className="lp-container">
            <div className="lp-section-heading">
              <h2>Pindai stiker, lihat status dalam hitungan detik</h2>
              <p>Setiap alat ukur di TTH memiliki stiker QR. Kamera ponsel Anda cukup untuk membukanya, tanpa aplikasi tambahan.</p>
            </div>
            <ol className="lp-steps">
              <li>
                <span className="lp-step-number" aria-hidden="true">1</span>
                <h3>Pindai stiker QR</h3>
                <p>Arahkan kamera ponsel ke stiker pada alat. Tidak bisa memindai? Ketik nomor asetnya.</p>
              </li>
              <li>
                <span className="lp-step-number" aria-hidden="true">2</span>
                <h3>Lihat status kelayakan</h3>
                <p>Status, jatuh tempo kalibrasi atau verifikasi, dan nama alat tampil paling atas.</p>
              </li>
              <li>
                <span className="lp-step-number" aria-hidden="true">3</span>
                <h3>Masuk bila perlu bertindak</h3>
                <p>Personel TTH masuk untuk meminjam, memindahkan, atau mengajukan verifikasi alat.</p>
              </li>
            </ol>
            <div className="lp-section-actions">
              <button className="lp-button lp-button-brand" type="button" onClick={openQrScanner}>
                <QrCode aria-hidden="true" />
                Coba pindai sekarang
              </button>
              <button className="lp-text-button" type="button" onClick={() => openQrScanner('manual')}>Ketik nomor aset</button>
            </div>
          </div>
        </section>

        <section className="lp-section lp-section-alt" id="status">
          <div className="lp-container">
            <div className="lp-section-heading">
              <h2>Arti status pada alat</h2>
              <p>Warna selalu disertai ikon dan teks. Hanya alat berstatus Laik Pakai, Segera Jatuh Tempo, atau Mendesak yang boleh dipakai.</p>
            </div>
            <div className="lp-status-grid">
              {statusItems.map(({ label, className, icon: Icon, description, availability }) => (
                <article className="lp-status-card" key={label}>
                  <span className={`lp-status-badge ${className}`}><Icon aria-hidden="true" />{label}</span>
                  <p>{description}</p>
                  <strong>{availability}</strong>
                </article>
              ))}
              <article className="lp-status-card lp-status-report">
                <p><strong>Menemukan status yang tidak sesuai?</strong><br />Laporkan ke admin SiKEPo lab terkait.</p>
                <a className="lp-text-link" href="#faq-salah">Cara melapor</a>
              </article>
            </div>
          </div>
        </section>

        <section className="lp-section" id="fitur">
          <div className="lp-container">
            <div className="lp-section-heading">
              <h2>Setelah masuk, personel TTH dapat</h2>
              <p>Satu register untuk seluruh siklus alat, mulai dari pengadaan hingga penghapusan.</p>
            </div>
            <div className="lp-feature-grid">
              {features.map(({ title, description, reference, icon: Icon }) => (
                <article className="lp-feature-card" key={title}>
                  <span className="lp-feature-icon"><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="lp-feature-reference">{reference}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section-alt">
          <div className="lp-container">
            <div className="lp-section-heading">
              <h2>Untuk siapa SiKEPo</h2>
            </div>
            <div className="lp-role-grid">
              {roles.map(({ title, description, access, guest }) => (
                <article className={`lp-role-card${guest ? ' is-guest' : ''}`} key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span>{access}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="faq">
          <div className="lp-container">
            <div className="lp-section-heading lp-section-heading-center">
              <h2>Pertanyaan yang sering diajukan</h2>
            </div>
            <div className="lp-faq-list">
              {questions.map(({ question, answer, id, statusLink }) => (
                <details id={id} key={question}>
                  <summary>{question}</summary>
                  <div className="lp-faq-answer">
                    <p>
                      {answer}
                      {statusLink && <> Lihat <a className="lp-text-link" href="#status">arti status</a>.</>}
                    </p>
                  </div>
                </details>
              ))}
            </div>
            <p className="lp-manual-note">Butuh bantuan? Gunakan menu <a className="lp-text-link" href="#faq-salah">hubungi admin</a>.</p>
          </div>
        </section>

        <section className="lp-cta">
          <div className="lp-container">
            <h2>Siap memeriksa alat?</h2>
            <p>Pindai stiker QR untuk melihat statusnya, atau masuk untuk mengelola peralatan lab Anda.</p>
            <div className="lp-cta-actions">
              <button className="lp-button lp-button-brand" type="button" onClick={openQrScanner}>
                <QrCode aria-hidden="true" />
                Pindai QR Alat
              </button>
              <a className="lp-button lp-button-light" href="/login" onClick={navigateToLogin}>
                <LogIn aria-hidden="true" />
                Masuk ke SiKEPo
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-about">
              <a className="lp-brand lp-footer-brand" href="/" aria-label="SiKEPo — beranda">
                <img src={sikepoLogo} alt="" />
                <span><strong>SiKEPo</strong><small>Telkom Test House</small></span>
              </a>
              <p>Sistem pengelolaan peralatan laboratorium Telkom Test House, PT Telekomunikasi Indonesia.</p>
            </div>
            <div>
              <h2>Navigasi</h2>
              <ul>
                {navigation.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}
              </ul>
            </div>
            <div>
              <h2>Bantuan</h2>
              <ul>
                <li><a href="#cara-kerja">Cara menggunakan QR</a></li>
                <li><a href="#faq-akun">Mendapatkan akun</a></li>
                <li><a href="#faq-salah">Lapor data tidak sesuai</a></li>
              </ul>
            </div>
            <div>
              <h2>Kontak admin</h2>
              <ul>
                <li>Telkom Test House, Bandung</li>
                <li><a href="#faq-salah">Hubungi admin SiKEPo</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-legal">
            <span>© {new Date().getFullYear()} Telkom Test House</span>
            <span>SiKEPo · Telkom Test House</span>
          </div>
        </div>
      </footer>

      {isQrScannerOpen && (
        <Suspense fallback={null}>
          <QRScannerModal
            isOpen={isQrScannerOpen}
            onClose={() => setIsQrScannerOpen(false)}
            onNavigate={onNavigate}
            initialTab={qrScannerInitialTab}
          />
        </Suspense>
      )}
    </div>
  );
}
