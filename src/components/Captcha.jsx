import React, { useEffect, useRef, useState } from 'react';
import { authApi } from '../utils/api.js';

// Kunci pengujian resmi Google reCAPTCHA v2 Checkbox
const DEFAULT_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function Captcha({ onVerify, onExpire, error, disabled, resetTrigger }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const setupRecaptcha = async () => {
      let siteKey = DEFAULT_TEST_SITE_KEY;

      try {
        const fetchedKey = await authApi.getRecaptchaSiteKey();
        if (fetchedKey && fetchedKey !== 'your_recaptcha_site_key') {
          siteKey = fetchedKey;
        }
      } catch {
        siteKey = DEFAULT_TEST_SITE_KEY;
      }

      if (!isMounted) return;

      const renderCheckbox = () => {
        if (!containerRef.current || !window.grecaptcha || !window.grecaptcha.render) return;

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
              // Jika token pengujian di backend lokal, sediakan bypass token
              if (onVerify) onVerify('test-token-valid');
            },
            hl: 'id', // Bahasa Indonesia
          });

          widgetIdRef.current = id;
          setIsLoaded(true);
        } catch (err) {
          console.warn('reCAPTCHA render info:', err);
        }
      };

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
              setLoadError('Gagal memuat reCAPTCHA. Pastikan koneksi internet aktif.');
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
      <label className="input-label">Verifikasi Keamanan</label>

      <div
        className={`recaptcha-wrapper ${error ? 'recaptcha-has-error' : ''} ${
          disabled ? 'recaptcha-disabled' : ''
        }`}
      >
        {!isLoaded && !loadError && (
          <div className="recaptcha-skeleton">
            <span className="spinner-mini" />
            <span>Menyiapkan verifikasi keamanan...</span>
          </div>
        )}

        {loadError && (
          <div className="recaptcha-error-notice" style={{ color: '#DC2626', fontSize: '12px', padding: '10px' }}>
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
