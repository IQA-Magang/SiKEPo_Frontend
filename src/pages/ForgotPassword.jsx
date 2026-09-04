import React, { useState } from 'react';
import WaveBackground from '../components/WaveBackground';
import LogoSiKEPo from '../components/LogoSiKEPo';
import TelkomTestHouseLogo from '../components/TelkomTestHouseLogo';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email wajib diisi.');
      setSubmittedMessage('');
      return;
    }
    setError('');
    setSubmittedMessage('Fitur reset password belum terhubung dengan backend.');
  };

  return (
    <div className="login-page-container">
      <WaveBackground />

      <main className="login-content-grid">
        <section className="login-left-col">
          <div className="login-left-wrapper">
            <LogoSiKEPo />

            <div className="login-card forgot-card">
              <h2 className="forgot-heading">Lupa Password?</h2>
              <p className="forgot-subtext">
                Masukkan email Anda untuk menerima instruksi reset password.
              </p>

              {submittedMessage ? (
                <div className="info-banner">
                  <CheckCircle2 size={20} color="#059669" />
                  <span>{submittedMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group">
                    <label htmlFor="fp-email" className="input-label">
                      Email
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="fp-email"
                        type="email"
                        className={`pill-input ${error ? 'input-error' : ''}`}
                        placeholder="Masukkan Email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                      />
                    </div>
                    {error && <span className="error-text">{error}</span>}
                  </div>

                  <button type="submit" className="btn-masuk btn-kirim">
                    Kirim
                  </button>
                </form>
              )}

              <div className="form-links back-link-wrapper">
                <a
                  href="#/login"
                  className="link-item link-back"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/login');
                  }}
                >
                  <ArrowLeft size={16} />
                  Kembali ke Login
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="login-right-col">
          <TelkomTestHouseLogo />
        </section>
      </main>
    </div>
  );
}
