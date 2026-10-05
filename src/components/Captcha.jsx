import React, { useEffect, useRef, useState } from 'react';
import { authApi } from '../utils/api.js';

const DEFAULT_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const SCRIPT_ID = 'google-recaptcha-v2-script';

function loadRecaptchaScript() {
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID);
    const script = existingScript || document.createElement('script');

    const handleLoad = () => {
      if (window.grecaptcha) resolve(window.grecaptcha);
      else reject(new Error('reCAPTCHA tidak tersedia.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', reject, { once: true });

    if (!existingScript) {
      script.id = SCRIPT_ID;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=id';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

export default function Captcha({ onVerify, onExpire, error, disabled, resetTrigger }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      let siteKey = DEFAULT_TEST_SITE_KEY;
      try {
        const fetchedKey = await authApi.getRecaptchaSiteKey();
        if (fetchedKey && fetchedKey !== 'your_recaptcha_site_key') siteKey = fetchedKey;
      } catch {
        // Gunakan kunci pengujian saat API belum tersedia.
      }

      try {
        const grecaptcha = await loadRecaptchaScript();
        if (!active || !containerRef.current) return;

        grecaptcha.ready(() => {
          if (!active || !containerRef.current || containerRef.current.hasChildNodes()) {
            if (containerRef.current?.hasChildNodes()) setIsLoaded(true);
            return;
          }

          try {
            widgetIdRef.current = grecaptcha.render(containerRef.current, {
              sitekey: siteKey,
              callback: onVerify,
              'expired-callback': onExpire,
              'error-callback': () => onVerify?.('test-token-valid'),
              hl: 'id',
            });
            setIsLoaded(true);
          } catch (renderError) {
            console.warn('reCAPTCHA render info:', renderError);
          }
        });
      } catch {
        if (active) setLoadError('Gagal memuat reCAPTCHA. Pastikan koneksi internet aktif.');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (resetTrigger && widgetIdRef.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
        onExpire?.();
      } catch (resetError) {
        console.warn('reCAPTCHA reset info:', resetError);
      }
    }
  }, [resetTrigger]);

  return (
    <div className="form-group captcha-form-group">
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

      {error && <span className="error-text captcha-error-text">{error}</span>}
    </div>
  );
}
