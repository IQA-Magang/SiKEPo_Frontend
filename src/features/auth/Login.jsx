import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, HelpCircle, Mail, Phone, KeyRound } from 'lucide-react';
import WaveBackground from '../../shared/components/WaveBackground.jsx';
import LogoSiKEPo from '../../shared/components/LogoSiKEPo.jsx';
import TelkomTestHouseLogo from '../../shared/components/TelkomTestHouseLogo.jsx';
import Captcha from '../../shared/components/Captcha.jsx';
import { authApi, getToken } from '../../shared/services/api.js';
import { useToast } from '../../app/providers/ToastContext.jsx';
import { Button, FormField, Modal } from '../../shared/components/ui/index.js';

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
              Sistem untuk Memantau Posisi dan Pengoperasian Peralatan
            </p>

            <div className="login-card">
              <form onSubmit={handleSubmit} noValidate>
                {errors.general && (
                  <div className="error-banner" role="alert">
                    {errors.general}
                  </div>
                )}

                <FormField
                  label="Email Terdaftar"
                  htmlFor="emailOrNip"
                  required
                  error={errors.email}
                  className="form-group"
                >
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
                </FormField>

                <FormField
                  label="Password"
                  htmlFor="password"
                  required
                  error={errors.password}
                  className="form-group"
                >
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
                </FormField>

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

                <Button type="submit" className="btn-masuk" disabled={isLoading} id="btn-login-submit">
                  {isLoading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span className="spinner-mini" /> Memproses...
                    </span>
                  ) : (
                    'Masuk'
                  )}
                </Button>

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
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="btn-test-creds"
                      onClick={() => {
                        setEmailOrNip('admin@sikepo.local');
                        setPassword('password123');
                        clearErrors('email');
                        clearErrors('password');
                      }}
                    >
                      Isi Kredensial Pengujian
                    </Button>
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

      <Modal
        isOpen={Boolean(infoModal)}
        onClose={() => setInfoModal(null)}
        title={infoModal && (
          <span className="login-info-modal-title">
            <span className="confirm-icon-wrap bg-primary-subtle text-primary">
              {infoModal.icon ? <infoModal.icon size={22} /> : <HelpCircle size={22} />}
            </span>
            {infoModal.title}
          </span>
        )}
        description={infoModal?.subtitle}
        className="login-info-modal"
        footer={(
          <Button variant="primary" onClick={() => setInfoModal(null)}>
            Mengerti
          </Button>
        )}
      >
        {infoModal?.content}
      </Modal>
    </div>
  );
}
