import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, Camera, Upload, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import jsQR from 'jsqr';
import { getEquipmentId, getToken, peralatanApi } from '../services/api.js';
import { Button, Tabs } from './ui/index.js';
import CameraScanner from './qr-scanner/CameraScanner.jsx';
import ImageScanner from './qr-scanner/ImageScanner.jsx';
import ManualIdSearch from './qr-scanner/ManualIdSearch.jsx';

export default function QRScannerModal({ isOpen, onClose, onNavigate }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'upload', 'manual'
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [cameraDevices, setCameraDevices] = useState([]);
  const [cameraDeviceId, setCameraDeviceId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const detectorRef = useRef(null);
  const scanInProgressRef = useRef(false);
  const scannerTypeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('camera');
      setScanResult(null);
      setErrorMsg('');
    }
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing]);

  // Handle camera start
  async function startCamera() {
    setErrorMsg('');
    setCameraActive(false);
    scanInProgressRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Browser ini tidak mendukung akses kamera. Gunakan Chrome/Edge atau tab Unggah File.');
      return;
    }

    try {
      let stream;
      try {
        const videoConstraints = cameraDeviceId
          ? { deviceId: { exact: cameraDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: { ideal: cameraFacing }, width: { ideal: 640 }, height: { ideal: 480 } };
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (preferredError) {
        // Some desktop webcams reject facingMode or a stale deviceId even though video access works.
        if (['NotFoundError', 'OverconstrainedError', 'AbortError'].includes(preferredError.name)) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else {
          throw preferredError;
        }
      }
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

      // Device labels and IDs are available after permission is granted.
      try {
        const devices = (await navigator.mediaDevices.enumerateDevices())
          .filter((device) => device.kind === 'videoinput');
        setCameraDevices(devices);
        if (!cameraDeviceId) {
          const activeTrack = stream.getVideoTracks()[0];
          setCameraDeviceId(activeTrack?.getSettings?.().deviceId || '');
        }
      } catch (deviceError) {
        console.warn('Daftar kamera tidak dapat dibaca:', deviceError);
      }
    } catch (err) {
      console.warn('Kamera tidak tersedia:', err);
      const messageByName = {
        NotAllowedError: 'Izin kamera ditolak. Klik ikon kamera di address bar Chrome, pilih Izinkan, lalu tekan Aktifkan Kamera.',
        NotFoundError: 'Kamera tidak ditemukan. Pastikan kamera terpasang dan tidak sedang digunakan aplikasi lain.',
        NotReadableError: 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.',
        SecurityError: 'Akses kamera diblokir browser. Buka aplikasi melalui http://localhost:5174/.',
      };
      setErrorMsg(messageByName[err.name] || 'Kamera tidak dapat diakses. Periksa izin kamera atau gunakan tab Unggah File.');
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

  function toggleCamera() {
    if (cameraDevices.length < 2) {
      setErrorMsg('Hanya satu kamera yang terdeteksi pada perangkat ini. Sambungkan webcam kedua untuk berpindah kamera.');
      return;
    }

    const currentIndex = cameraDevices.findIndex((device) => device.deviceId === cameraDeviceId);
    const nextDevice = cameraDevices[(currentIndex + 1) % cameraDevices.length];
    stopCamera();
    setErrorMsg('');
    setCameraDeviceId(nextDevice.deviceId);
    setCameraFacing((currentFacing) => (currentFacing === 'environment' ? 'user' : 'environment'));
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
      const token = getToken();
      if (!token) {
        const guestData = await peralatanApi.getByAssetNumber(manualInput.trim());
        const guestItem = guestData?.data?.peralatan || guestData?.data || guestData;
        if (!guestItem?.nomor_aset) {
          throw new Error(`Peralatan dengan nomor aset "${manualInput.trim()}" tidak ditemukan.`);
        }
        navigateToGuestEquipment(guestItem.nomor_aset);
        return;
      }

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
    const token = getToken();

    try {
      if (!token) {
        const guestData = await peralatanApi.getByAssetNumber(rawValue.trim());
        const guestItem = guestData?.data?.peralatan || guestData?.data || guestData;
        if (!guestItem?.nomor_aset) {
          throw new Error(`QR "${rawValue}" tidak cocok dengan nomor aset yang tersedia untuk guest.`);
        }
        navigateToGuestEquipment(guestItem.nomor_aset);
        return;
      }

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

  function navigateToGuestEquipment(assetNumber) {
    const safeAssetNumber = String(assetNumber || '').trim();
    if (!safeAssetNumber) return;

    setScanResult(`Nomor aset terdeteksi: ${safeAssetNumber}`);
    stopCamera();
    setTimeout(() => {
      onClose();
      onNavigate(`/guest/peralatan/${encodeURIComponent(safeAssetNumber)}`);
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
          <Button
            variant="ghost"
            className="btn-icon"
            icon={<X size={20} />}
            aria-label="Tutup pemindai QR"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{ color: '#fff' }}
          />
        </div>

        <Tabs
          className="qr-scanner-tabs"
          ariaLabel="Metode pemindaian QR"
          activeId={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'camera', label: <><Camera size={15} /> Kamera Live</> },
            { id: 'upload', label: <><Upload size={15} /> Unggah File</> },
            { id: 'manual', label: <><Search size={15} /> Input ID Manual</> },
          ]}
        />

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

          {activeTab === 'camera' && (
            <CameraScanner
              videoRef={videoRef}
              canvasRef={canvasRef}
              cameraActive={cameraActive}
              cameraFacing={cameraFacing}
              cameraDevices={cameraDevices}
              onToggleCamera={toggleCamera}
              onStartCamera={startCamera}
            />
          )}

          {/* TAB 2: UNGGAH FILE QR */}
          {activeTab === 'upload' && <ImageScanner onFileUpload={handleFileUpload} />}

          {/* TAB 3: INPUT ID MANUAL */}
          {activeTab === 'manual' && (
            <ManualIdSearch
              value={manualInput}
              onChange={setManualInput}
              onSubmit={handleManualSubmit}
              scanning={scanning}
            />
          )}
        </div>
      </div>
    </div>
  ), document.body);
}