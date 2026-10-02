import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Package, ShieldCheck, CircleAlert } from 'lucide-react';
import { getToken, peralatanApi } from '../../utils/api.js';

export default function GuestEquipmentPage({ equipmentNumber, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseData, setResponseData] = useState(null);
  const apiData = responseData?.data || responseData;
  const peralatan = apiData?.peralatan || apiData;

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
    if (hasToken && peralatan?.id) {
      onNavigate?.(`/peralatan/detail/${peralatan.id}`);
    }
  }, [hasToken, onNavigate, peralatan]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f7f7f7 0%, #f0f2f5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#1f2937',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Package size={42} style={{ opacity: 0.7 }} />
          <p style={{ marginTop: 16, fontSize: 18, fontWeight: 700 }}>Memuat data peralatan...</p>
        </div>
      </div>
    );
  }

  if (error || !peralatan) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f7f7f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 640,
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e5e7eb',
          padding: '32px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <CircleAlert size={24} color="#dc2626" />
            <h2 style={{ margin: 0, fontSize: 28 }}>Peralatan tidak tersedia</h2>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#374151' }}>
            {error || 'Data peralatan tidak ditemukan untuk akses guest.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('/')}
            style={{
              marginTop: 24,
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: 8 }} />
            Kembali ke Landing Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
      padding: '16px 14px 28px',
      color: '#111827',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => onNavigate?.('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '10px 14px',
            fontWeight: 700,
            cursor: 'pointer',
            color: '#111827',
            marginBottom: 14,
            width: 'auto',
            minHeight: 42,
          }}
        >
          <ArrowLeft size={16} />
          Kembali
        </button>

        <div style={{
          background: '#fff',
          borderRadius: 22,
          border: '1px solid #e5e7eb',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 18px 16px',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <ShieldCheck size={18} />
              <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.4 }}>INFORMASI PUBLIK</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.7rem, 6vw, 2.6rem)', lineHeight: 1.2, wordBreak: 'break-word' }}>
              {peralatan.nama_peralatan || 'Peralatan'}
            </h1>
          </div>

          <div style={{ padding: '18px 16px 20px' }}>
            {(responseData?.status || responseData?.message) && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px 12px',
                marginBottom: 18,
                padding: '11px 13px',
                borderLeft: '3px solid #16836b',
                background: '#eff8f5',
                color: '#28584d',
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {responseData.status && <strong>Status API: {responseData.status}</strong>}
                {responseData.message && <span>{responseData.message}</span>}
              </div>
            )}

            <DataSection title="Data Peralatan" data={peralatan} />
            {apiData?.detail && <DataSection title="Detail Kalibrasi dan Kelayakan" data={apiData.detail} />}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'stretch' }}>
              <button
                type="button"
                onClick={() => onNavigate?.('/login')}
                style={{
                  background: '#111827',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: 46,
                }}
              >
                Masuk ke Sistem
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSection({ title, data }) {
  return (
    <section style={{ marginTop: 18, paddingTop: 17, borderTop: '1px solid #dce3e8' }}>
      <h2 style={{ margin: '0 0 10px', color: '#17252d', fontSize: 16, lineHeight: 1.35 }}>
        {title}
      </h2>
      <DataFields data={data} />
    </section>
  );
}

function DataFields({ data }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '0 16px' }}>
      {Object.entries(data).map(([key, value]) => {
        const label = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (character) => character.toUpperCase());

        if (value && typeof value === 'object') {
          const nestedData = Array.isArray(value)
            ? { items: value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : item)).join(', ') }
            : value;

          return (
            <div key={key} style={{ gridColumn: '1 / -1', margin: '8px 0', padding: '10px 12px', background: '#f3f6f7', borderLeft: '2px solid #d35643' }}>
              <h3 style={{ margin: '0 0 4px', color: '#35464e', fontSize: 13, lineHeight: 1.4 }}>{label}</h3>
              <DataFields data={nestedData} />
            </div>
          );
        }

        let displayValue = value;
        if (value === null) displayValue = 'Tidak tersedia';
        else if (typeof value === 'boolean') displayValue = value ? 'Ya' : 'Tidak';
        else if (value === '') displayValue = 'Kosong';

        return (
          <div key={key} style={{ minWidth: 0, padding: '10px 0', borderBottom: '1px solid #edf0f2' }}>
            <div style={{ marginBottom: 4, color: '#6b7880', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', overflowWrap: 'anywhere' }}>
              {label}
            </div>
            <div style={{ color: '#192a32', fontSize: 14, fontWeight: 600, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
              {String(displayValue)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
