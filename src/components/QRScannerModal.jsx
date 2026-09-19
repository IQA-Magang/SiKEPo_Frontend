import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, Camera, Upload, X, CheckCircle, AlertCircle, Search, ArrowRight } from 'lucide-react';
import jsQR from 'jsqr';
import { getEquipmentId, peralatanApi } from '../utils/api.js';

export default function QRScannerModal({ isOpen, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'upload', 'manual'
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const detectorRef = useRef(null);
  const scanInProgressRef = useRef(false);
  const scannerTypeRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Handle camera start
  async function startCamera() {
    setErrorMsg('');
    setCameraActive(false);
    scanInProgressRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        if ('BarcodeDetector' in window) {
          try {
            detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
            scannerTypeRef.current = 'native';
          } catch {
            detectorRef.current = null;
            scannerTypeRef.current = 'jsqr';
          }
        } else {
          scannerTypeRef.current = 'jsqr';
        }
        startScanningLoop();
      }
    } catch (err) {
      console.warn('Kamera tidak tersedia:', err);
      setErrorMsg('Kamera tidak dapat diakses. Gunakan tab Unggah Gambar QR atau Input ID Manual.');
    }
  }

  // Handle camera stop
  function stopCamera() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    detectorRef.current = null;
    scannerTypeRef.current = null;
    scanInProgressRef.current = false;
    setCameraActive(false);
  }

  // Loop scan frame
  function startScanningLoop() {
    async function tick() {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        !scanInProgressRef.current
      ) {
        try {
          let rawValue = '';
          if (scannerTypeRef.current === 'native' && detectorRef.current) {
            const codes = await detectorRef.current.detect(videoRef.current);
            rawValue = codes[0]?.rawValue || '';
          } else if (scannerTypeRef.current === 'jsqr') {
            const video = videoRef.current;
            const canvas = canvasRef.current || document.createElement('canvas');
            const width = video.videoWidth;
            const height = video.videoHeight;
            if (width && height) {
              canvas.width = width;
              canvas.height = height;
              const context = canvas.getContext('2d', { willReadFrequently: true });
              context.drawImage(video, 0, 0, width, height);
              const imageData = context.getImageData(0, 0, width, height);
              rawValue = jsQR(imageData.data, width, height, {
                inversionAttempts: 'attemptBoth',
              })?.data || '';
            }
          }
          if (rawValue) {
            scanInProgressRef.current = true;
            await handleScanPayload(rawValue);
            return;
          }
        } catch (err) {
          console.warn('QR tidak dapat dibaca dari frame:', err);
        }
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  }

  // Helper parse QR content to extract Equipment ID
  function parseEquipmentId(rawStr) {
    if (!rawStr) return null;
    const clean = String(rawStr).trim();

    // Format: SIKEPO-EQ-ID:12-AST-001 atau SIKEPO-EQ-ID:12
    const matchPrefix = clean.match(/SIKEPO-EQ-ID[:\-](\d+)/i);
    if (matchPrefix && matchPrefix[1]) return matchPrefix[1];

    // 2. Format URL: .../peralatan/detail/12 atau .../peralatan/12/qr
    const matchUrl = clean.match(/\/peralatan\/(?:detail\/)?(\d+)/i);
    if (matchUrl && matchUrl[1]) return matchUrl[1];

    // 3. Pure numeric ID (misal: "12")
    if (/^\d+$/.test(clean)) return clean;

    return null;
  }

  // Handle manual input search
  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setErrorMsg('');
    setScanning(true);

    try {
      const res = await peralatanApi.getAll();
      const list = res.data || [];
      const found = findEquipment(manualInput, list);
      if (found) {
        navigateToEquipment(getEquipmentId(found));
      } else {
        setErrorMsg(`Peralatan dengan ID / Nomor Aset "${manualInput}" tidak ditemukan.`);
      }

    } catch (err) {
      setErrorMsg('Gagal mencari peralatan: ' + err.message);
    } finally {
      setScanning(false);
    }
  }

  async function handleScanPayload(rawValue) {
    try {
      const res = await peralatanApi.getAll();
      const found = findEquipment(rawValue, res.data || []);
      if (!found) {
        setErrorMsg(`QR Code "${rawValue}" tidak cocok dengan peralatan di sistem.`);
        scanInProgressRef.current = false;
        animationFrameRef.current = requestAnimationFrame(() => startScanningLoop());
        return;
      }
      navigateToEquipment(getEquipmentId(found));
    } catch (err) {
      setErrorMsg(`Gagal memvalidasi QR Code: ${err.message}`);
      scanInProgressRef.current = false;
    }
  }

  function findEquipment(input, list) {
    const cleanInput = String(input || '').trim();
    const extractedId = parseEquipmentId(cleanInput);
    return list.find((item) => {
      const id = getEquipmentId(item);
      return (
        (extractedId && String(id) === String(extractedId)) ||
        String(id) === cleanInput ||
        item.nomor_aset?.toLowerCase() === cleanInput.toLowerCase()
      );
    });
  }

  // Handle file upload QR
  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    setScanning(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = canvasRef.current || document.createElement('canvas');
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(img, 0, 0, width, height);
          const imageData = context.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          const rawValue = code?.data;
          if (!rawValue) throw new Error('QR Code tidak ditemukan pada gambar.');
          await handleScanPayload(rawValue);
        } catch (err) {
          setActiveTab('manual');
          setErrorMsg(`${err.message} Gunakan Input ID Manual.`);
        } finally {
          setScanning(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function navigateToEquipment(id) {
    setScanResult(`ID Terdeteksi: #${id}`);
    stopCamera();
    setTimeout(() => {
      onClose();
      onNavigate(`/peralatan/detail/${id}`);
    }, 600);
  }

  if (!isOpen) return null;

  return createPortal((
    <div
      className="modal-overlay fade-in-up"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'var(--sp-4)',
      }}
    >
      <div
        className="card"
        style={{
          width: 500,
          maxWidth: '95%',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--clr-dark-200)',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: 'var(--sp-5) var(--sp-6)',
            background: 'linear-gradient(135deg, var(--clr-dark-900), var(--clr-dark-800))',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(238, 46, 36, 0.2)',
                color: 'var(--clr-primary-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', margin: 0, color: '#fff' }}>
                Pemindai Kode QR (Scan by ID)
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-300)', margin: 0 }}>
                Scan QR Code untuk langsung melihat detail peralatan
              </p>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{ color: '#fff' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderBottom: '1px solid var(--clr-dark-200)',
            background: 'var(--clr-dark-50)',
          }}
        >
          <button
            onClick={() => setActiveTab('camera')}
            style={{
              padding: '12px',
              fontSize: 'var(--text-xs)',
              fontWeight: activeTab === 'camera' ? 'var(--fw-bold)' : 'var(--fw-medium)',
              color: activeTab === 'camera' ? 'var(--clr-primary-600)' : 'var(--clr-dark-600)',
              borderBottom: activeTab === 'camera' ? '2px solid var(--clr-primary-500)' : 'none',
              background: activeTab === 'camera' ? '#fff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Camera size={15} /> Kamera Live
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '12px',
              fontSize: 'var(--text-xs)',
              fontWeight: activeTab === 'upload' ? 'var(--fw-bold)' : 'var(--fw-medium)',
              color: activeTab === 'upload' ? 'var(--clr-primary-600)' : 'var(--clr-dark-600)',
              borderBottom: activeTab === 'upload' ? '2px solid var(--clr-primary-500)' : 'none',
              background: activeTab === 'upload' ? '#fff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Upload size={15} /> Unggah File
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '12px',
              fontSize: 'var(--text-xs)',
              fontWeight: activeTab === 'manual' ? 'var(--fw-bold)' : 'var(--fw-medium)',
              color: activeTab === 'manual' ? 'var(--clr-primary-600)' : 'var(--clr-dark-600)',
              borderBottom: activeTab === 'manual' ? '2px solid var(--clr-primary-500)' : 'none',
              background: activeTab === 'manual' ? '#fff' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Search size={15} /> Input ID Manual
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: 'var(--sp-6)',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {scanResult && (
            <div
              style={{
                padding: 'var(--sp-4)',
                background: 'var(--clr-success-100)',
                border: '1px solid var(--clr-success-500)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--clr-success-700)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--fw-bold)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 'var(--sp-4)',
              }}
            >
              <CheckCircle size={18} /> {scanResult} — Mengalihkan...
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--clr-error-100)',
                border: '1px solid var(--clr-error-500)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--clr-error-500)',
                fontSize: 'var(--text-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 'var(--sp-4)',
              }}
            >
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* TAB 1: KAMERA LIVE */}
          {activeTab === 'camera' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-4)' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'min(240px, 36vh)',
                  minHeight: 180,
                  background: 'var(--clr-dark-950)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--clr-dark-700)',
                }}
              >
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Camera Viewfinder Overlay Box */}
                <div
                  style={{
                    position: 'absolute',
                    width: 'min(180px, 65vw)',
                    height: 'min(180px, 65vw)',
                    border: '2px dashed #EE2E24',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '90%',
                      height: 2,
                      background: '#EE2E24',
                      boxShadow: '0 0 8px #EE2E24',
                      animation: 'scanLine 2s infinite ease-in-out',
                    }}
                  />
                </div>
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', textAlign: 'center', margin: 0 }}>
                Arahkan kamera perangkat Anda tepat ke <strong>QR Code ID Peralatan</strong>
              </p>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', textAlign: 'center', margin: 0 }}>
                Scanner otomatis memiliki fallback untuk browser yang belum mendukung BarcodeDetector.
              </p>
            </div>
          )}

          {/* TAB 2: UNGGAH FILE QR */}
          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', textAlign: 'center' }}>
              <div
                style={{
                  border: '2px dashed var(--clr-dark-300)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--sp-8)',
                  background: 'var(--clr-dark-50)',
                }}
              >
                <Upload size={36} style={{ color: 'var(--clr-primary-500)', marginBottom: 'var(--sp-3)' }} />
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 4 }}>
                  Pilih atau Drop Gambar QR Code
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 'var(--sp-4)' }}>
                  Upload file PNG atau JPG gambar QR Code yang ingin dipindai
                </p>
                <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={15} /> Pilih Gambar QR
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: INPUT ID MANUAL */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="input-scan-manual">
                  Masukkan ID Peralatan atau Nomor Aset
                </label>
                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <input
                    id="input-scan-manual"
                    className="form-input"
                    type="text"
                    placeholder="Contoh: 1 atau AST-2026-001"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={scanning || !manualInput.trim()}>
                    Cari <ArrowRight size={15} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0 }}>
                Ketik nomor ID peralatan (misal <code>1</code>) atau nomor aset lengkap untuk langsung membuka halaman detail.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}
