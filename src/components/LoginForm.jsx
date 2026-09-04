import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { mockUsers } from '../data/mockUsers';

export default function LoginForm({ onNavigate, onOpenHelp }) {
  const [emailOrNip, setEmailOrNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {
      email: !emailOrNip.trim() ? 'Email / NIP wajib diisi.' : '',
      password: !password.trim() ? 'Password wajib diisi.' : '',
      general: ''
    };

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setErrors({ email: '', password: '', general: '' });
    setIsLoading(true);

    setTimeout(() => {
      const trimmedEmail = emailOrNip.trim().toLowerCase();
      const user = mockUsers.find(
        (u) => u.email.toLowerCase() === trimmedEmail && u.password === password
      );

      if (!user) {
        setIsLoading(false);
        setErrors((prev) => ({ ...prev, general: 'Email / NIP atau password tidak sesuai.' }));
        return;
      }

      localStorage.setItem('sikepo_user', JSON.stringify(user));
      setIsLoading(false);
      onNavigate('/dashboard');
    }, 600);
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
          <label htmlFor="emailOrNip" className="input-label">Email / NIP</label>
          <div className="input-wrapper">
            <input
              id="emailOrNip"
              type="text"
              className={`pill-input ${errors.email ? 'input-error' : ''}`}
              placeholder="Masukkan Email / NIP"
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
