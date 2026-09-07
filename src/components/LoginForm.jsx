import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Captcha from './Captcha';

export default function LoginForm({ onNavigate, onOpenHelp }) {
  const [emailOrNip, setEmailOrNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [captchaResetTrigger, setCaptchaResetTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', captcha: '', general: '' });

  const resetCaptcha = () => {
    setRecaptchaToken('');
    setCaptchaResetTrigger((prev) => prev + 1);
    clearErrors('captcha');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      email: !emailOrNip.trim() ? 'Email terdaftar wajib diisi.' : '',
      password: !password.trim() ? 'Password wajib diisi.' : '',
      captcha: !recaptchaToken ? 'Harap centang verifikasi "Saya bukan robot".' : '',
      general: ''
    };

    if (newErrors.email || newErrors.password || newErrors.captcha) {
      setErrors(newErrors);
      return;
    }

    setErrors({ email: '', password: '', captcha: '', general: '' });
    setIsLoading(true);

    try {
      // Tahap 3: Kirim kredensial & recaptcha_token ke backend API
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailOrNip.trim(),
          password: password,
          recaptcha_token: recaptchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setIsLoading(false);
        setErrors((prev) => ({
          ...prev,
          general: result.message || 'Login gagal. Periksa kembali email dan password Anda.'
        }));
        resetCaptcha();
        return;
      }

      // Tahap 4: Simpan token & profil user ke localStorage
      if (result.data) {
        if (result.data.token) {
          localStorage.setItem('sikepo_token', result.data.token);
        }
        if (result.data.user) {
          localStorage.setItem('sikepo_user', JSON.stringify(result.data.user));
        }
      }

      setIsLoading(false);
      onNavigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setErrors((prev) => ({
        ...prev,
        general: 'Gagal terhubung ke server backend (port 5000). Pastikan server backend sedang aktif.'
      }));
      resetCaptcha();
    }
  };

  const clearErrors = (field) => {
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
    }
  };

  return (
    <div className="login-card">
      <form onSubmit={handleSubmit} noValidate>
        {errors.general && (
          <div className="error-banner" role="alert">
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="emailOrNip" className="input-label">Email Terdaftar</label>
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
          <label htmlFor="password" className="input-label">Password</label>
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
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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

        <button type="submit" className="btn-masuk" disabled={isLoading}>
          {isLoading ? (
            <span className="loading-state">
              <span className="spinner" />
              Memproses...
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
              onNavigate('/forgot-password');
            }}
          >
            Forgot password?
          </a>
          <button type="button" className="link-item btn-link" onClick={onOpenHelp}>
            Need help?
          </button>
        </div>
      </form>
    </div>
  );
}
