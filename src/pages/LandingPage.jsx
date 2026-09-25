import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal.jsx';

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

const stats = [
  { label: 'Aset Terdata', value: '2.4K+' },
  { label: 'Laboratorium', value: '18' },
  { label: 'Kepatuhan Proses', value: '98.7%' },
  { label: 'Tingkat Efisiensi', value: '2.3x' },
];

const steps = [
  { no: '01', title: 'Pemetaan Aset', desc: 'Identifikasi alat, lokasi, dan kebutuhan pengelolaan di tiap unit kerja.' },
  { no: '02', title: 'Validasi Data', desc: 'Proses verifikasi dan penetapan status kelayakan berdasarkan parameter yang ditentukan.' },
  { no: '03', title: 'Pemeliharaan', desc: 'Jadwal kalibrasi, pemeriksaan berkala, dan penanganan dokumen pendukung berjalan teratur.' },
  { no: '04', title: 'Pelaporan', desc: 'Laporan ringkas disiapkan untuk mendukung kebijakan operasional dan evaluasi laboratorium.' },
];

export default function LandingPage({ onNavigate }) {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  function openQrScanner() {
    setIsQrScannerOpen(false);
    requestAnimationFrame(() => setIsQrScannerOpen(true));
  }

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          min-height: 100vh;
          background:
            linear-gradient(180deg, #f8fafc 0%, #edf3ff 100%);
          color: #0f172a;
          font-family: Inter, 'Segoe UI', sans-serif;
        }

        .landing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 22px 22px 64px;
        }

        .landing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0 30px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: -0.04em;
        }

        .brand-mark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ee2e24 0%, #c81e1e 100%);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 1.15rem;
          box-shadow: 0 12px 24px rgba(238, 46, 36, 0.2);
        }

        .landing-nav {
          display: flex;
          align-items: center;
          gap: 28px;
          font-size: 0.92rem;
          font-weight: 600;
          color: #475569;
        }

        .landing-nav a {
          color: #475569;
          transition: color 0.2s ease;
        }

        .landing-nav a:hover {
          color: #0f172a;
        }

        .button-primary,
        .button-secondary,
        .button-light,
        .button-qr {
          border-radius: 999px;
          padding: 13px 22px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none;
        }

        .button-primary {
          background: linear-gradient(135deg, #ee2e24, #c81e1e);
          color: #fff;
          box-shadow: 0 14px 26px rgba(238, 46, 36, 0.22);
        }

        .button-secondary {
          background: rgba(255,255,255,0.9);
          color: #0f172a;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .button-light {
          background: rgba(255,255,255,0.12);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.16);
        }

        .button-qr {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          color: #991b1b;
          border: 1px solid rgba(153, 27, 27, 0.16);
        }

        .button-primary:hover,
        .button-secondary:hover,
        .button-light:hover,
        .button-qr:hover {
          transform: translateY(-1px);
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          align-items: center;
          gap: 34px;
          padding: 20px 0 18px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 8px 14px;
          background: rgba(238,46,36,0.08);
          color: #991b1b;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          font-weight: 700;
          text-transform: uppercase;
        }

        .hero-copy {
          max-width: 620px;
        }

        .hero h1 {
          margin-top: 18px;
          font-size: clamp(2.8rem, 5vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.07em;
          font-weight: 900;
          color: #0f172a;
        }

        .hero h1 span {
          color: #ee2e24;
        }

        .hero p {
          margin-top: 18px;
          font-size: 1.05rem;
          line-height: 1.8;
          color: #475569;
          max-width: 560px;
        }

        .hero-actions {
          margin-top: 28px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .hero-metrics {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(4, minmax(120px, 1fr));
          gap: 16px;
        }

        .metric {
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 18px;
          padding: 16px 14px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.03);
        }

        .metric strong {
          display: block;
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.06em;
        }

        .metric span {
          font-size: 0.76rem;
          color: #64748b;
          font-weight: 600;
        }

        .hero-panel {
          position: relative;
          padding: 20px;
          background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.98));
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 26px;
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .hero-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(238,46,36,0.04), rgba(59,130,246,0.04));
          pointer-events: none;
        }

        .panel-body {
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 22px;
          padding: 18px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .status-pill {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 6px rgba(34,197,94,0.12);
        }

        .bar-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          align-items: end;
          gap: 12px;
          height: 160px;
          padding-top: 10px;
        }

        .bar {
          border-radius: 10px 10px 0 0;
          background: linear-gradient(180deg, #ef4444 0%, #fca5a5 100%);
          min-height: 38px;
          opacity: 0.94;
        }

        .bar:nth-child(1) { height: 42%; }
        .bar:nth-child(2) { height: 58%; }
        .bar:nth-child(3) { height: 72%; }
        .bar:nth-child(4) { height: 80%; }
        .bar:nth-child(5) { height: 92%; }
        .bar:nth-child(6) { height: 66%; }

        .panel-list {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        .panel-list-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #334155;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .panel-list-item span {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(34,197,94,0.12);
          color: #16a34a;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .hero-score {
          position: absolute;
          right: 22px;
          bottom: 18px;
          background: #0f172a;
          color: #fff;
          border-radius: 16px;
          padding: 12px 14px;
          box-shadow: 0 18px 32px rgba(15,23,42,0.15);
          z-index: 2;
        }

        .hero-score small {
          display: block;
          color: rgba(255,255,255,0.7);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-score strong {
          display: block;
          font-size: 1.2rem;
          letter-spacing: -0.04em;
        }

        .section {
          padding-top: 72px;
        }

        .section-head {
          max-width: 760px;
          margin: 0 auto 30px;
          text-align: center;
        }

        .section-head h2 {
          font-size: clamp(2rem, 3vw, 3.2rem);
          line-height: 1.15;
          letter-spacing: -0.06em;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .section-head p {
          color: #64748b;
          font-size: 1.02rem;
          line-height: 1.8;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .feature-card {
          background: rgba(255,255,255,0.82);
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 24px;
          padding: 24px 20px;
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.04);
        }

        .feature-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(238,46,36,0.08), rgba(59,130,246,0.08));
          color: #ee2e24;
          font-size: 1.4rem;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 8px;
          color: #0f172a;
        }

        .feature-card p {
          color: #64748b;
          line-height: 1.75;
          font-size: 0.95rem;
        }

        .showcase {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .showcase-card {
          border-radius: 24px;
          padding: 26px 22px;
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.05);
        }

        .showcase-card.dark {
          background: linear-gradient(135deg, #0f172a, #1d293c 65%, #1e293b 100%);
          color: #fff;
        }

        .showcase-card.light {
          background: linear-gradient(135deg, #ffffff, #eef4ff 100%);
          border: 1px solid rgba(148,163,184,0.18);
          color: #0f172a;
        }

        .showcase-card h3 {
          font-size: clamp(1.5rem, 2vw, 2rem);
          letter-spacing: -0.05em;
          margin-bottom: 10px;
          font-weight: 800;
        }

        .showcase-card p {
          line-height: 1.7;
          font-size: 0.98rem;
        }

        .showcase-card.dark p {
          color: rgba(255,255,255,0.76);
        }

        .showcase-card.light p {
          color: #475569;
        }

        .checklist {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        .checklist-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.94rem;
          font-weight: 600;
        }

        .checklist-item .tick {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(34,197,94,0.12);
          color: #16a34a;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 0.72rem;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .step-card {
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(148,163,184,0.18);
          border-radius: 22px;
          padding: 22px 18px;
          box-shadow: 0 14px 28px rgba(15,23,42,0.03);
        }

        .step-no {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #ee2e24;
          background: rgba(238,46,36,0.08);
          padding: 7px 9px;
          border-radius: 999px;
          margin-bottom: 10px;
        }

        .step-card h3 {
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 8px;
          color: #0f172a;
        }

        .step-card p {
          color: #64748b;
          line-height: 1.7;
          font-size: 0.94rem;
        }

        .cta-panel {
          margin-top: 60px;
          background: linear-gradient(135deg, #0f172a, #1e293b 42%, #7f1d1d 100%);
          color: #fff;
          border-radius: 30px;
          padding: 32px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
        }

        .cta-panel h3 {
          font-size: clamp(1.65rem, 2.6vw, 2.6rem);
          letter-spacing: -0.06em;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .cta-panel p {
          color: rgba(255,255,255,0.76);
          line-height: 1.7;
        }

        .landing-footer {
          padding-top: 28px;
          text-align: center;
          font-size: 0.9rem;
          color: #64748b;
        }

        @media (max-width: 900px) {
          .landing-nav {
            display: none;
          }

          .hero,
          .showcase,
          .feature-grid,
          .steps {
            grid-template-columns: 1fr;
          }

          .hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cta-panel {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="landing-container">
        <header className="landing-header">
          <div className="brand" aria-label="SiKEPo logo">
            <div className="brand-mark">S</div>
            <span>SiKEPo</span>
          </div>

          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#fitur">Fitur</a>
            <a href="#proses">Proses</a>
            <a href="#kontak">Kontak</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          </div>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">Laboratorium Modern</div>
              <h1>
                Sistem tata kelola <span>aset</span> laboratorium yang lebih terukur.
              </h1>
              <p>
                SiKEPo dirancang untuk membantu institusi dan laboratorium mengelola peralatan, proses verifikasi,
                dan dokumentasi teknis dengan pendekatan yang lebih rapi, konsisten, dan profesional.
              </p>

              <div className="hero-actions">
                <button className="button-primary" onClick={() => onNavigate('/login')}>
                  Mulai Sekarang
                </button>
                <button className="button-secondary" onClick={() => onNavigate('/login')}>
                  Lihat Demo
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

                <div className="bar-grid" aria-label="chart data">
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                </div>

                <div className="panel-list">
                  <div className="panel-list-item"><span>✓</span> 120 aset aktif terpantau</div>
                  <div className="panel-list-item"><span>✓</span> Jadwal verifikasi teratur</div>
                  <div className="panel-list-item"><span>✓</span> Dokumen pendukung terintegrasi</div>
                </div>
              </div>

              <div className="hero-score">
                <small>Verifikasi</small>
                <strong>96.8%</strong>
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
              {features.map((feature, index) => (
                <div key={feature.title} className="feature-card">
                  <div className="feature-icon">{['📦', '✅', '📄', '👤', '📊', '🔗'][index]}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              ))}
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
                  <div className="checklist-item"><span className="tick">✓</span> Inventaris lebih terorganisir</div>
                  <div className="checklist-item"><span className="tick">✓</span> Status aset lebih mudah dipantau</div>
                  <div className="checklist-item"><span className="tick">✓</span> Keputusan berbasis data</div>
                </div>
              </div>

              <div className="showcase-card light">
                <h3>Pelayanan yang lebih profesional</h3>
                <p>
                  SiKEPo membantu laboratorium menjalankan tata kelola yang lebih formal, transparan, dan responsif,
                  sehingga seluruh aktivitas pengelolaan aset dapat berjalan lebih tertib dan terukur.
                </p>

                <div className="checklist">
                  <div className="checklist-item"><span className="tick">✓</span> Proses verifikasi lebih terstruktur</div>
                  <div className="checklist-item"><span className="tick">✓</span> Dokumen lebih aman dan rapi</div>
                  <div className="checklist-item"><span className="tick">✓</span> Komunikasi tim lebih efektif</div>
                </div>
              </div>
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
          © 2026 SiKEPo — Sistem Kelola Inventaris & Pengujian Laboratorium
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
