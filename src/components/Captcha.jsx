import React, { useEffect, useRef, useState } from 'react';

// Kunci pengujian resmi Google reCAPTCHA v2 Checkbox (selalu valid untuk testing lokal)
const DEFAULT_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const BACKEND_SITEKEY_URL = 'http://localhost:5000/recaptcha/sitekey';

export default function Captcha({ onVerify, onExpire, error, disabled, resetTrigger }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  // 1. Ambil site_key dari backend (dengan fallback ke kunci tes) & muat skrip Google reCAPTCHA v2
  useEffect(() => {
    let isMounted = true;

    const setupRecaptcha = async () => {
      let siteKey = DEFAULT_TEST_SITE_KEY;

      // Ambil site key langsung dari endpoint backend jika backend aktif
      try {
        const response = await fetch(BACKEND_SITEKEY_URL);
        if (response.ok) {
          const data = await response.json();
          if (data && data.site_key) {
            siteKey = data.site_key;
          }
        }
      } catch {
        // Jika backend belum dijalankan atau tidak merespons, gunakan kunci tes bawaan
        siteKey = DEFAULT_TEST_SITE_KEY;
      }

      if (!isMounted) return;

      // Fungsi untuk me-render widget reCAPTCHA ke dalam kontainer
      const renderCheckbox = () => {
        if (!containerRef.current || !window.grecaptcha || !window.grecaptcha.render) return;

        // Hindari render ganda jika iframe sudah ada
        if (containerRef.current.hasChildNodes()) {
          setIsLoaded(true);
          return;
        }

        try {
          const id = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              if (onVerify) onVerify(token);
            },
            'expired-callback': () => {
              if (onExpire) onExpire();
            },
            'error-callback': () => {
              if (onExpire) onExpire();
            },
            hl: 'id' // Bahasa Indonesia: "Saya bukan robot"
          });

          widgetIdRef.current = id;
          setIsLoaded(true);
        } catch (err) {
          console.warn('reCAPTCHA render info:', err);
        }
      };

      // Periksa apakah skrip Google reCAPTCHA sudah ada di DOM
      const scriptId = 'google-recaptcha-v2-script';
      if (!window.grecaptcha) {
        const existingScript = document.getElementById(scriptId);
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=id';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (window.grecaptcha) {
              window.grecaptcha.ready(renderCheckbox);
            }
          };
          script.onerror = () => {
            if (isMounted) {
              setLoadError('Gagal memuat reCAPTCHA. Pastikan perangkat terhubung ke internet.');
            }
          };
          document.head.appendChild(script);
        } else {
          existingScript.addEventListener('load', () => {
            if (window.grecaptcha) {
              window.grecaptcha.ready(renderCheckbox);
            }
          });
        }
      } else {
        window.grecaptcha.ready(renderCheckbox);
      }
    };

    setupRecaptcha();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Reset status centang jika login gagal atau di-trigger ulang oleh parent
  useEffect(() => {
    if (resetTrigger && widgetIdRef.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
        if (onExpire) onExpire();
      } catch (err) {
        console.warn('reCAPTCHA reset info:', err);
      }
    }
  }, [resetTrigger]);

  return (
    <div className="form-group captcha-form-group">
      <label className="input-label">
        Verifikasi Keamanan
      </label>

      <div className={`recaptcha-wrapper ${error ? 'recaptcha-has-error' : ''} ${disabled ? 'recaptcha-disabled' : ''}`}>
        {!isLoaded && !loadError && (
          <div className="recaptcha-skeleton">
            <span className="spinner-mini" />
            <span>Menyiapkan verifikasi keamanan...</span>
          </div>
        )}

        {loadError && (
          <div className="recaptcha-error-notice">
            <span>{loadError}</span>
          </div>
        )}

        <div
          ref={containerRef}
          className="recaptcha-container"
          style={{ display: isLoaded ? 'flex' : 'none' }}
        />
      </div>

      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
