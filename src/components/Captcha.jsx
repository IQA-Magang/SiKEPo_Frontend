import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, Volume2 } from 'lucide-react';

export default function Captcha({ captchaCode, onRefresh, value, onChange, error, disabled }) {
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    setCanSpeak(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  // Draw captcha whenever captchaCode changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captchaCode) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#F8FAFC');
    bg.addColorStop(1, '#EEF2F6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Subtle background dots for noise
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 120 + 80)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, 0.15)`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 1.8 + 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Curved interference lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 180 + 40)}, ${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 50)}, 0.22)`;
      ctx.lineWidth = Math.random() * 1.5 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 20, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        width - Math.random() * 20, Math.random() * height
      );
      ctx.stroke();
    }

    // Character drawing
    const charList = captchaCode.split('');
    const charSpacing = width / (charList.length + 1);
    const colors = ['#E30613', '#B8000A', '#1F2937', '#111827', '#991B1B', '#374151'];

    charList.forEach((char, index) => {
      ctx.save();
      const x = charSpacing * (index + 1);
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() - 0.5) * 0.4; // -11 to +11 deg

      ctx.translate(x, y);
      ctx.rotate(angle);

      // Random font size and family
      const fontSize = Math.floor(Math.random() * 4 + 22);
      ctx.font = `bold ${fontSize}px 'Courier New', Monaco, monospace`;
      ctx.fillStyle = colors[index % colors.length];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Slight shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, [captchaCode]);

  const handleRefreshClick = () => {
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 500);
  };

  const handleAudioClick = () => {
    if (!canSpeak || !captchaCode) return;
    window.speechSynthesis.cancel();

    // Spell out letters slowly
    const textToSpeak = captchaCode.split('').join(' . ');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.75;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="form-group captcha-form-group">
      <label htmlFor="captchaInput" className="input-label">
        Verifikasi Keamanan (Captcha)
      </label>

      {/* Visual Canvas and Actions */}
      <div className="captcha-display-card">
        <canvas
          ref={canvasRef}
          width={150}
          height={44}
          className="captcha-canvas"
          aria-label={`Captcha visual: ${captchaCode}`}
        />

        <div className="captcha-actions">
          <button
            type="button"
            className="captcha-btn"
            onClick={handleRefreshClick}
            title="Ganti kode captcha"
            aria-label="Ganti kode captcha baru"
            disabled={disabled}
          >
            <RotateCw size={18} className={isSpinning ? 'spin-once' : ''} />
          </button>

          {canSpeak && (
            <button
              type="button"
              className="captcha-btn"
              onClick={handleAudioClick}
              title="Dengarkan kode captcha"
              aria-label="Dengarkan kode captcha"
              disabled={disabled}
            >
              <Volume2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Input Field */}
      <div className="input-wrapper" style={{ marginTop: '10px' }}>
        <input
          id="captchaInput"
          type="text"
          className={`pill-input captcha-input ${error ? 'input-error' : ''}`}
          placeholder="Ketik kode di atas"
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          maxLength={6}
        />
      </div>

      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
