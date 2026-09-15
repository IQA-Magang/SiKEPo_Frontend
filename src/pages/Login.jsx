import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import WaveBackground from '../components/WaveBackground.jsx';
import LogoSiKEPo from '../components/LogoSiKEPo.jsx';
import TelkomTestHouseLogo from '../components/TelkomTestHouseLogo.jsx';
import Captcha from '../components/Captcha.jsx';
import { authApi } from '../utils/api.js';

export default function Login({ onNavigate }) {
  const [emailOrNip, setEmailOrNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [captchaResetTrigger, setCaptchaResetTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', captcha: '', general: '' });

  useEffect(() => {
    if (localStorage.getItem('sikepo_token')) {
      onNavigate('/dashboard');
    }
  }, []);

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
      onNavigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Gagal login. Periksa email, password, dan reCAPTCHA.',
      }));
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

            <div className="login-card">
              <form onSubmit={handleSubmit} noValidate>
                {errors.general && (
                  <div className="error-banner" role="alert">
                    {errors.general}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="emailOrNip" className="input-label">
                    Email Terdaftar
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
                    />
                  </div>
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="input-label">
                    Password
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
                  {errors.password && <span className="error-text">{errors.password}</span>}
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

                <div className="form-links">
                  <a
                    href="#/forgot-password"
                    className="link-item"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Silakan hubungi Administrator Lab untuk mereset kata sandi Anda.');
                    }}
                  >
                    Forgot password?
                  </a>
                  <button
                    type="button"
                    className="link-item btn-link"
                    onClick={() =>
                      alert('Butuh bantuan? Hubungi IT Support Telkom Test House (TTH).')
                    }
                  >
                    Need help?
                  </button>
                </div>

                {/* Test Credentials Helper */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px dashed #E5E7EB',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                    Akun Standar: <strong>admin@sikepo.local</strong>
                  </span>
                  <button
                    type="button"
                    style={{
                      display: 'block',
                      margin: '4px auto 0',
                      background: 'none',
                      border: 'none',
                      color: '#DC2626',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
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
              </form>
            </div>
          </div>
        </section>

        {/* Right Column: Giant TTH Logo */}
        <section className="login-right-col">
          <TelkomTestHouseLogo />
        </section>
      </main>
    </div>
  );
}
