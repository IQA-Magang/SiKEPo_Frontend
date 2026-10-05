import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CircleAlert, Package, ShieldCheck } from 'lucide-react';
import { formatPhotoUrl, getToken, peralatanApi } from '../../utils/api.js';
import './guest-equipment.css';

export default function GuestEquipmentPage({ equipmentNumber, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const apiData = responseData?.data || responseData;
  const peralatan = apiData?.peralatan || apiData;
  const guestEquipmentData = peralatan ? getGuestEquipmentDisplayData(peralatan) : null;
  const photoUrl = formatPhotoUrl(peralatan?.foto);

  useEffect(() => {
    let cancelled = false;

    async function loadGuestEquipment() {
      setLoading(true);
      setError('');

      try {
        const response = await peralatanApi.getByAssetNumber(equipmentNumber);
        const data = response?.data || response;
        const item = data?.peralatan || data;

        if (!item || (!item.id && !item.nomor_aset)) {
          throw new Error('Peralatan tidak ditemukan');
        }

        if (!cancelled) {
          setResponseData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Peralatan tidak tersedia untuk guest.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (equipmentNumber) {
      loadGuestEquipment();
    } else {
      setLoading(false);
      setError('Nomor aset tidak valid.');
    }

    return () => {
      cancelled = true;
    };
  }, [equipmentNumber]);

  const hasToken = useMemo(() => !!getToken(), []);

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);

  useEffect(() => {
    if (hasToken && peralatan?.id) {
      onNavigate?.(`/peralatan/detail/${peralatan.id}`);
    }
  }, [hasToken, onNavigate, peralatan]);

  if (loading) {
    return (
      <div className="guest-equipment-page guest-equipment-state" role="status" aria-live="polite">
        <div className="guest-state-mark"><Package size={25} /></div>
        <div className="guest-state-copy">
          <strong>Memuat data peralatan</strong>
          <span>Mohon tunggu sebentar</span>
        </div>
      </div>
    );
  }

  if (error || !peralatan) {
    return (
      <div className="guest-equipment-page guest-equipment-state">
        <div className="guest-state-panel">
          <div className="guest-error-mark"><CircleAlert size={22} /></div>
          <div>
            <p className="guest-kicker">AKSES PUBLIK</p>
            <h1>Peralatan tidak tersedia</h1>
          </div>
          <p className="guest-state-message">
            {error || 'Data peralatan tidak ditemukan untuk akses guest.'}
          </p>
          <button
            type="button"
            className="guest-back-button"
            onClick={() => onNavigate?.('/')}
          >
            <ArrowLeft size={17} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-equipment-page">
      <div className="guest-equipment-shell">
        <header className="guest-page-header">
          <button type="button" className="guest-back-button" onClick={() => onNavigate?.('/')}>
            <ArrowLeft size={17} />
            Kembali
          </button>
          <span className="guest-header-brand"><span className="guest-brand-mark"><Package size={16} /></span>SiKEPo</span>
        </header>

        <main>
          <section className="guest-asset-intro">
            <div className="guest-asset-copy">
              <div className="guest-kicker"><ShieldCheck size={15} /> INFORMASI PUBLIK</div>
              <h1>{peralatan.nama_peralatan || 'Peralatan'}</h1>
              <p className="guest-asset-subtitle">
                Data identitas dan kelayakan aset laboratorium
              </p>
            </div>
            <figure className="guest-asset-photo">
              {photoUrl && !photoFailed ? (
                <img
                  src={photoUrl}
                  alt={`Foto ${peralatan.nama_peralatan || 'peralatan'}`}
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="guest-photo-placeholder" aria-label="Foto belum tersedia">
                  <Package size={30} strokeWidth={1.5} />
                  <span>{photoUrl ? 'Foto gagal dimuat' : 'Foto belum diunggah'}</span>
                </div>
              )}
              <figcaption>Foto peralatan</figcaption>
            </figure>
            <div className="guest-asset-summary">
              <div className="guest-asset-number">
                <span>Nomor aset</span>
                <strong>{peralatan.nomor_aset || 'Tidak tersedia'}</strong>
              </div>
              <div className="guest-status-pill">
                <span className="guest-status-dot" />
                {peralatan.status_alat || 'Status tidak tersedia'}
              </div>
            </div>
          </section>

          {(responseData?.status || responseData?.message) && (
            <div className="guest-api-notice" role="status">
              <span className="guest-api-indicator" />
              {responseData.status && <strong>{responseData.status}</strong>}
              {responseData.message && <span>{responseData.message}</span>}
            </div>
          )}

          <div className="guest-data-layout">
            <DataSection title="Identitas Peralatan" data={guestEquipmentData} number="01" hideId />
            {apiData?.detail && <DataSection title="Detail Kalibrasi & Kelayakan" data={apiData.detail} number="02" />}
          </div>

          <footer className="guest-page-footer">
            <span>Informasi aset laboratorium</span>
            <button type="button" onClick={() => onNavigate?.('/login')}>
              Masuk ke SiKEPo <ArrowUpRight size={16} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}

function getGuestEquipmentDisplayData(equipment) {
  const displayData = { ...equipment };
  const categoryName = equipment.kategori_peralatan?.nama_kategori
    || equipment.kategori?.nama_kategori;
  const roomName = equipment.ruangan?.nama_ruangan
    || equipment.ruangan?.nama;
  const assetGroupName = equipment.kelompok_aset?.nama_kelompok_aset
    || equipment.kelompok_aset?.nama_kelompok
    || equipment.kelompok_aset?.nama;
  const picName = equipment.pic?.nama_lengkap
    || equipment.pic?.nama
    || equipment.pic_user?.nama_lengkap
    || equipment.pic_user?.nama;

  [
    'id',
    'foto',
    'kategori_id',
    'kategori_peralatan_id',
    'ruangan_id',
    'kelompok_aset_id',
    'pic_id',
    'kategori_peralatan',
    'kategori',
    'ruangan',
    'kelompok_aset',
    'pic',
    'pic_user',
  ].forEach((key) => delete displayData[key]);

  return {
    ...displayData,
    kategori: categoryName || 'Nama kategori tidak tersedia',
    ruangan: roomName || 'Tidak tersedia untuk guest',
    kelompok_aset: assetGroupName || 'Tidak tersedia untuk guest',
    pic: picName || 'Tidak tersedia untuk guest',
  };
}

function DataSection({ title, data, number, hideId = false }) {
  return (
    <section className="guest-data-section">
      <header className="guest-section-heading">
        <span className="guest-section-number">{number}</span>
        <h2>{title}</h2>
      </header>
      <DataFields data={data} hideId={hideId} />
    </section>
  );
}

function DataFields({ data, hideId = false }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  return (
    <div className="guest-fields-grid">
      {Object.entries(data).filter(([key]) => key !== 'foto' && key !== 'peralatan_id' && (!hideId || key !== 'id')).map(([key, value]) => {
        const label = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (character) => character.toUpperCase());

        if (value && typeof value === 'object') {
          const nestedData = Array.isArray(value)
            ? { items: value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : item)).join(', ') }
            : value;

          return (
            <div key={key} className="guest-nested-field">
              <h3>{label}</h3>
              <DataFields data={nestedData} />
            </div>
          );
        }

        let displayValue = value;
        if (value === null) displayValue = 'Tidak tersedia';
        else if (typeof value === 'boolean') displayValue = value ? 'Ya' : 'Tidak';
        else if (value === '') displayValue = 'Kosong';

        return (
          <div key={key} className="guest-data-field">
            <div className="guest-data-label">
              {label}
            </div>
            <div className="guest-data-value">
              {String(displayValue)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
