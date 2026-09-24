import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, HelpCircle, X, Mail, Phone } from 'lucide-react';
import WaveBackground from '../components/WaveBackground.jsx';
import LogoSiKEPo from '../components/LogoSiKEPo.jsx';
import TelkomTestHouseLogo from '../components/TelkomTestHouseLogo.jsx';
import Captcha from '../components/Captcha.jsx';
import { authApi, getToken } from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Login({ onNavigate }) {
  const [emailOrNip, setEmailOrNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [captchaResetTrigger, setCaptchaResetTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', captcha: '', general: '' });
  const [infoModal, setInfoModal] = useState(null); // { title, subtitle, content, icon: Icon }

  const toast = useToast();

  useEffect(() => {
    if (getToken()) {
      onNavigate('/dashboard');
    }
  }, [onNavigate]);

  // Handle ESC to close info modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && infoModal) {
        setInfoModal(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [infoModal]);

  const resetCaptcha = () => {
    setRecaptchaToken('');
    setCaptchaResetTrigger((prev) => prev + 1);
  };

  const clearErrors = (field) => {
    setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      email: !emailOrNip.trim() ? 'Email terdaftar wajib diisi.' : '',
      password: !password.trim() ? 'Password wajib diisi.' : '',
      captcha: !recaptchaToken ? 'Harap selesaikan verifikasi "Saya bukan robot".' : '',
      general: '',
    };

    if (newErrors.email || newErrors.password || newErrors.captcha) {
      setErrors(newErrors);
      return;
    }

    setErrors({ email: '', password: '', captcha: '', general: '' });
    setIsLoading(true);

    try {
      await authApi.login({
        email: emailOrNip.trim(),
        password: password,
        recaptcha_token: recaptchaToken,
      });

      setIsLoading(false);
      toast.success('Berhasil masuk ke SiKEPo!', 3000);
      onNavigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || 'Gagal login. Periksa email, password, dan reCAPTCHA.';
      setErrors((prev) => ({
        ...prev,
        general: msg,
      }));
      toast.error(msg, 5000);
      resetCaptcha();
    }
  };

  return (
    <div className="login-page-container">
      {/* Curved Wave Background */}
      <WaveBackground />

      <main className="login-content-grid">
        {/* Left Column: Form Card */}
        <section className="login-left-col">
          <div className="login-left-wrapper">
            <LogoSiKEPo />
            <p className="sikepo-onboarding-sub">
              Sistem Informasi Tata Kelola &amp; Posisi Peralatan Laboratorium Uji Telkom Test House
            </p>

            <div className="login-card">
              <form onSubmit={handleSubmit} noValidate>
                {errors.general && (
                  <div className="error-banner" role="alert">
                    {errors.general}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="emailOrNip" className="input-label">
                    Email Terdaftar <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="emailOrNip"
                      type="text"
                      className={`pill-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="Masukkan Email terdaftar"
                      value={emailOrNip}
                      onChange={(e) => {
                        setEmailOrNip(e.target.value);
                        clearErrors('email');
                      }}
                      disabled={isLoading}
                      autoComplete="username"
                      aria-required="true"
                      aria-invalid={Boolean(errors.email)}
                    />
                  </div>
                  {errors.email && <span className="error-text" role="alert">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="input-label">
                    Password <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`pill-input ${errors.password ? 'input-error' : ''}`}
                      placeholder="Masukkan Password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearErrors('password');
                      }}
                      disabled={isLoading}
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text" role="alert">{errors.password}</span>}
                </div>

                {/* Google reCAPTCHA v2 Checkbox */}
                <Captcha
                  onVerify={(token) => {
                    setRecaptchaToken(token);
                    clearErrors('captcha');
                  }}
                  onExpire={() => {
                    setRecaptchaToken('');
                  }}
                  resetTrigger={captchaResetTrigger}
                  error={errors.captcha}
                  disabled={isLoading}
                />

                <button type="submit" className="btn-masuk" disabled={isLoading} id="btn-login-submit">
                  {isLoading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="spinner-mini" /> Memproses...
                    </span>
                  ) : (
                    'Masuk'
                  )}
                </button>

                {/* Accessible Replacement for alert() */}
                <div className="form-links">
                  <button
                    type="button"
                    className="link-item btn-link"
                    onClick={() =>
                      setInfoModal({
                        title: 'Lupa Kata Sandi?',
                        subtitle: 'Prosedur Reset Akun SiKEPo Telkom Test House',
                        icon: KeyRound,
                        content: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: '13.5px', color: 'var(--clr-dark-700, #374151)', lineHeight: 1.5 }}>
                              Untuk alasan keamanan ISO/IEC 17025, pengaturan ulang kata sandi dikelola secara tersentralisasi.
                            </p>
                            <div style={{ background: '#F9FAFB', padding: '12px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: '12.5px', color: '#4B5563' }}>
                              <strong style={{ display: 'block', marginBottom: 4, color: '#111827' }}>Langkah Reset:</strong>
                              <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <li>Hubungi Administrator Lab atau Manajer Mutu TTH.</li>
                                <li>Lampirkan NIP dan nama lengkap yang terdaftar.</li>
                                <li>Administrator akan menerbitkan kata sandi sementara untuk Anda.</li>
                              </ol>
                            </div>
                          </div>
                        ),
                      })
                    }
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    className="link-item btn-link"
                    onClick={() =>
                      setInfoModal({
                        title: 'Pusat Bantuan & Dukungan',
                        subtitle: 'Helpdesk SiKEPo - Telkom Test House',
                        icon: HelpCircle,
                        content: (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ fontSize: '13.5px', color: 'var(--clr-dark-700, #374151)', lineHeight: 1.5 }}>
                              Mengalami kendala saat login atau memiliki pertanyaan terkait tata kelola peralatan uji?
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#374151' }}>
                                <Mail size={16} style={{ color: '#E30613' }} />
                                <span>Email Support: <strong>support-tth@telkom.co.id</strong></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#374151' }}>
                                <Phone size={16} style={{ color: '#E30613' }} />
                                <span>Ext. Kantor Lab: <strong>+62 (022) 456-7890 (TTH)</strong></span>
                              </div>
                            </div>
                          </div>
                        ),
                      })
                    }
                  >
                    Need help?
                  </button>
                </div>

                {import.meta.env.DEV && (
                  <div className="test-creds-box">
                    <span className="test-creds-text">
                      Akun Standar: <strong>admin@sikepo.local</strong>
                    </span>
                    <button
                      type="button"
                      className="btn-test-creds"
                      onClick={() => {
                        setEmailOrNip('admin@sikepo.local');
                        setPassword('password123');
                        clearErrors('email');
                        clearErrors('password');
                      }}
                    >
                      Isi Kredensial Pengujian
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Right Column: Giant TTH Logo */}
        <section className="login-right-col">
          <TelkomTestHouseLogo />
        </section>
      </main>

      {/* Accessible Info & Help Modal Dialog */}
      {infoModal && (
        <div
          className="confirm-modal-overlay fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInfoModal(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-info-modal-title"
        >
          <div className="confirm-dialog-card zoom-in">
            <div className="confirm-dialog-header">
              <div className="confirm-icon-wrap bg-primary-subtle text-primary">
                {infoModal.icon ? <infoModal.icon size={22} /> : <HelpCircle size={22} />}
              </div>
              <button
                className="confirm-dialog-close"
                onClick={() => setInfoModal(null)}
                aria-label="Tutup jendela informasi"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <h3 id="login-info-modal-title" className="confirm-dialog-title">
                {infoModal.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--clr-dark-500, #6B7280)', marginBottom: 14 }}>
                {infoModal.subtitle}
              </p>
              {infoModal.content}
            </div>
            <div className="confirm-dialog-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setInfoModal(null)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
