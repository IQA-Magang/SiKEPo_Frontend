import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileCheck2,
  FileText,
  Menu,
  Package,
  QrCode,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal.jsx';
import tthLogo from '../assets/logo/tth-logo.png';
import '../styles/landing-page.css';

const features = [
  {
    title: 'Inventaris Aset Laboratorium',
    text: 'Mengelola data alat, lokasi, kelompok aset, dan status operasional secara terstruktur agar pengendalian aset lebih akurat.',
  },
  {
    title: 'Verifikasi & Kalibrasi',
    text: 'Memonitor proses pemeriksaan berkala, jadwal kalibrasi, dan status kelayakan alat dengan alur yang mudah dipantau.',
  },
  {
    title: 'Dokumen & Audit',
    text: 'Menjadikan sertifikat, laporan, dan dokumen pendukung tersimpan rapi dalam satu sistem yang siap diaudit.',
  },
  {
    title: 'Koordinasi PIC',
    text: 'Memudahkan penetapan penanggung jawab, jadwal kerja, dan pengawasan penggunaan alat di setiap unit laboratorium.',
  },
  {
    title: 'Monitoring Kinerja',
    text: 'Menampilkan ringkasan pengelolaan aset dan status laboratorium secara cepat untuk kebutuhan operasional harian.',
  },
  {
    title: 'Integrasi Tim Internal',
    text: 'Membantu seluruh unit kerja berkolaborasi dengan data yang konsisten, terpusat, dan mudah diakses.',
  },
];

const featureIcons = [Package, FileCheck2, FileText, UserCheck, BarChart3, Users];

const faqs = [
  {
    question: 'Siapa yang dapat menggunakan SiKEPo?',
    answer: 'SiKEPo digunakan oleh administrator, manajer laboratorium, PIC, dan staf sesuai hak akses masing-masing.',
  },
  {
    question: 'Apa fungsi QR Code pada peralatan?',
    answer: 'QR Code membantu pengguna membuka identitas, status, dan riwayat peralatan dengan cepat saat melakukan pemeriksaan.',
  },
  {
    question: 'Apakah SiKEPo dapat digunakan dari ponsel?',
    answer: 'Ya. Tampilan SiKEPo dirancang responsif dan pemindaian QR dapat dilakukan melalui kamera perangkat yang kompatibel.',
  },
  {
    question: 'Bagaimana dokumen peralatan dikelola?',
    answer: 'Sertifikat, foto, dan dokumen pendukung disimpan bersama data alat agar lebih mudah ditemukan saat verifikasi atau audit.',
  },
];

const stats = [
  { label: 'Data inventaris', value: 'Terpusat' },
  { label: 'Dokumen teknis', value: 'Terintegrasi' },
  { label: 'Status peralatan', value: 'Terpantau' },
  { label: 'Kebutuhan audit', value: 'Siap' },
];

const steps = [
  { no: '01', title: 'Pemetaan Aset', desc: 'Identifikasi alat, lokasi, dan kebutuhan pengelolaan di tiap unit kerja.' },
  { no: '02', title: 'Validasi Data', desc: 'Proses verifikasi dan penetapan status kelayakan berdasarkan parameter yang ditentukan.' },
  { no: '03', title: 'Pemeliharaan', desc: 'Jadwal kalibrasi, pemeriksaan berkala, dan penanganan dokumen pendukung berjalan teratur.' },
  { no: '04', title: 'Pelaporan', desc: 'Laporan ringkas disiapkan untuk mendukung kebijakan operasional dan evaluasi laboratorium.' },
];

export default function LandingPage({ onNavigate }) {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  function openQrScanner() {
    setIsMobileMenuOpen(false);
    setIsQrScannerOpen(false);
    requestAnimationFrame(() => setIsQrScannerOpen(true));
  }

  function navigateTo(section) {
    setIsMobileMenuOpen(false);
    const target = document.getElementById(section);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleSectionNavigation(event, section) {
    event.preventDefault();
    navigateTo(section);
  }

  return (
    <div className="landing-page">
      

      <div className="landing-container">
        <header className="landing-header">
          <div className="brand" aria-label="SiKEPo logo">
            <img className="brand-logo" src={tthLogo} alt="Telkom Test House" />
            <span>SiKEPo</span>
          </div>

          <nav className={`landing-nav${isMobileMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            <a href="#tentang" onClick={(event) => handleSectionNavigation(event, 'tentang')}>Tentang</a>
            <a href="#fitur" onClick={(event) => handleSectionNavigation(event, 'fitur')}>Fitur</a>
            <a href="#proses" onClick={(event) => handleSectionNavigation(event, 'proses')}>Proses</a>
            <a href="#kontak" onClick={(event) => handleSectionNavigation(event, 'kontak')}>Kontak</a>
          </nav>

          <div className="header-actions">
            <button
              className="button-qr"
              onClick={openQrScanner}
              aria-label="Buka pemindai QR peralatan"
              title="Scan QR Peralatan"
            >
              <QrCode size={17} />
              <span>Scan QR</span>
            </button>
            <button className="button-secondary" onClick={() => onNavigate('/login')}>
              Masuk
            </button>
            <button
              className="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">Laboratorium Modern</div>
              <h1>
                Kelola <span>aset</span> dan kelaikan laboratorium dalam satu sistem.
              </h1>
              <p>
                SiKEPo membantu Telkom Test House mencatat aset, memantau kalibrasi, mengelola dokumen,
                dan mempercepat proses verifikasi kelaikan secara terpusat.
              </p>
              <div className="hero-support">
                <ShieldCheck size={17} aria-hidden="true" />
                Dibangun untuk tata kelola laboratorium yang tertib dan siap diaudit
              </div>

              <div className="hero-actions">
                <button className="button-primary" onClick={() => onNavigate('/login')}>
                  Masuk ke Sistem <ArrowRight size={17} />
                </button>
                <button className="button-secondary" onClick={() => navigateTo('proses')}>
                  Lihat Cara Kerja
                </button>
              </div>

              <div className="hero-metrics">
                {stats.map((item) => (
                  <div key={item.label} className="metric">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-panel" aria-label="Preview dashboard SiKEPo">
              <div className="panel-body">
                <div className="panel-header">
                  <span>Monitoring Aset</span>
                  <span className="status-pill" aria-hidden="true" />
                </div>
                <div className="dashboard-summary">
                  <div><strong>1,248</strong><span>Total aset</span></div>
                  <div><strong>86%</strong><span>Aktif</span></div>
                  <div><strong>12</strong><span>Perlu tindak lanjut</span></div>
                </div>

                <div className="bar-grid" aria-label="chart data">
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                </div>

                <div className="panel-list">
                  <div className="panel-list-item"><span><Check size={13} /></span> Inventaris tersimpan terpusat</div>
                  <div className="panel-list-item"><span><Check size={13} /></span> Jadwal verifikasi mudah dipantau</div>
                  <div className="panel-list-item"><span><Check size={13} /></span> Dokumen pendukung terintegrasi</div>
                </div>
              </div>

              <div className="hero-score">
                <small>Status sistem</small>
                <strong>Terpantau</strong>
              </div>
            </div>
          </section>

          <section className="section" id="tentang">
            <div className="section-head">
              <h2>Dari data yang tersebar menjadi pengelolaan yang terarah</h2>
              <p>
                SiKEPo menyatukan informasi peralatan, dokumen, dan proses verifikasi agar tim dapat bekerja dengan data yang sama.
              </p>
            </div>
            <div className="problem-grid">
              <div className="problem-card before">
                <h3><Database size={20} /> Tantangan yang sering terjadi</h3>
                <ul className="problem-list">
                  <li>Data aset dan dokumen tersimpan di banyak tempat</li>
                  <li>Jadwal kalibrasi atau verifikasi sulit dipantau</li>
                  <li>Riwayat peralatan membutuhkan waktu untuk ditelusuri</li>
                </ul>
              </div>
              <div className="problem-card after">
                <h3><FileCheck2 size={20} /> Dengan SiKEPo</h3>
                <ul className="problem-list">
                  <li>Seluruh informasi aset tersedia dalam satu sumber data</li>
                  <li>Status dan tahapan verifikasi terlihat lebih jelas</li>
                  <li>Dokumen dan riwayat alat lebih siap untuk evaluasi</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="section" id="fitur">
            <div className="section-head">
              <h2>Solusi yang cocok untuk institusi dan laboratorium</h2>
              <p>
                SiKEPo membantu unit kerja mengelola data aset dan proses uji secara lebih formal, efisien, dan dapat dipertanggungjawabkan.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature, index) => {
                const Icon = featureIcons[index];
                return (
                <div key={feature.title} className="feature-card">
                  <div className="feature-icon"><Icon size={24} aria-hidden="true" /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
                );
              })}
            </div>
          </section>

          <section className="section" id="proses">
            <div className="section-head">
              <h2>Alur kerja yang lebih terstruktur</h2>
              <p>
                Setiap tahapan dirancang untuk mendukung akuntabilitas operasional, pengawasan aset, dan keputusan manajerial.
              </p>
            </div>

            <div className="steps">
              {steps.map((step) => (
                <div key={step.no} className="step-card">
                  <span className="step-no">{step.no}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="showcase">
              <div className="showcase-card dark">
                <h3>Efisiensi operasional yang lebih baik</h3>
                <p>
                  Dengan data yang terjaga, proses verifikasi dan pemeliharaan dapat dijalankan dengan lebih konsisten,
                  cepat, dan siap untuk kebutuhan evaluasi internal maupun audit.
                </p>

                <div className="checklist">
                  <div className="checklist-item"><span className="tick"><Check size={13} /></span> Inventaris lebih terorganisir</div>
                  <div className="checklist-item"><span className="tick"><Check size={13} /></span> Status aset lebih mudah dipantau</div>
                  <div className="checklist-item"><span className="tick"><Check size={13} /></span> Keputusan berbasis data</div>
                </div>
              </div>

              <div className="showcase-card light">
                <h3>Pelayanan yang lebih profesional</h3>
                <p>
                  SiKEPo membantu laboratorium menjalankan tata kelola yang lebih formal, transparan, dan responsif,
                  sehingga seluruh aktivitas pengelolaan aset dapat berjalan lebih tertib dan terukur.
                </p>

                <div className="checklist">
                  <div className="checklist-item"><span className="tick"><Check size={13} /></span> Proses verifikasi lebih terstruktur</div>
                  <div className="checklist-item"><span className="tick"><Check size={13} /></span> Dokumen lebih aman dan rapi</div>
                  <div className="checklist-item"><span className="tick"><Check size={13} /></span> Komunikasi tim lebih efektif</div>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="keamanan">
            <div className="section-head">
              <h2>Akses yang aman dan sesuai peran</h2>
              <p>Setiap pengguna melihat fitur dan data sesuai tanggung jawabnya, sehingga proses tetap terkendali.</p>
            </div>
            <div className="security-grid">
              <div className="security-card"><ShieldCheck size={24} /><h3>Role-based access</h3><p>Hak akses administrator, manajer, PIC, dan staf dibedakan sesuai kebutuhan kerja.</p></div>
              <div className="security-card"><FileCheck2 size={24} /><h3>Dokumen terkelola</h3><p>Dokumen teknis terhubung dengan aset dan lebih mudah ditelusuri saat evaluasi.</p></div>
              <div className="security-card"><Database size={24} /><h3>Riwayat terpusat</h3><p>Perubahan status dan aktivitas peralatan dapat dipantau dari satu sistem.</p></div>
            </div>
          </section>

          <section className="section faq-section" id="faq">
            <div className="section-head">
              <h2>Pertanyaan yang sering diajukan</h2>
              <p>Informasi singkat untuk membantu pengguna memahami fungsi utama SiKEPo.</p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div className="faq-item" key={faq.question}>
                  <button className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>
                    <span>{faq.question}</span>
                    {openFaq === index ? <X size={18} /> : <ArrowRight size={18} />}
                  </button>
                  {openFaq === index && <p className="faq-answer">{faq.answer}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="section" id="benefit">
            <div className="cta-panel">
              <div>
                <h3>Siap modernisasi tata kelola laboratorium Anda?</h3>
                <p>Gunakan platform yang lebih formal, lebih terstruktur, dan lebih siap mendukung operasional institusi.</p>
              </div>

              <button className="button-light" onClick={() => onNavigate('/login')}>
                Masuk ke Sistem
              </button>
            </div>
          </section>
        </main>

        <footer className="landing-footer" id="kontak">
          <div className="footer-main">
            <div className="footer-brand">
              <img src={tthLogo} alt="Telkom Test House" />
              <div><strong>SiKEPo</strong><span>Sistem pengelolaan inventaris dan kelaikan peralatan laboratorium.</span></div>
            </div>
            <div className="footer-links">
              <a href="#fitur" onClick={(event) => handleSectionNavigation(event, 'fitur')}>Fitur</a>
              <a href="#proses" onClick={(event) => handleSectionNavigation(event, 'proses')}>Cara Kerja</a>
              <a href="#faq" onClick={(event) => handleSectionNavigation(event, 'faq')}>FAQ</a>
              <a href="mailto:admin@sikepo.local">Hubungi Admin</a>
            </div>
          </div>
          <div className="footer-bottom">© 2026 SiKEPo - Telkom Test House</div>
        </footer>
      </div>

      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
