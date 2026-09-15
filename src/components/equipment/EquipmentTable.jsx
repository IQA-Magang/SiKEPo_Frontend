import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import EquipmentStatusBadge from './EquipmentStatusBadge';
import { ruanganApi, kelompokAssetApi, formatPhotoUrl } from '../../utils/api';

export default function EquipmentTable({ equipment, onSelect }) {
  const [ruanganList, setRuanganList] = useState([]);
  const [kelompokList, setKelompokList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      ruanganApi.getAll().catch(() => ({ data: [] })),
      kelompokAssetApi.getAll().catch(() => ({ data: [] }))
    ]).then(([rRes, kRes]) => {
      if (!isMounted) return;
      if (rRes?.data) setRuanganList(rRes.data);
      if (kRes?.data) setKelompokList(kRes.data);
    });
    return () => { isMounted = false; };
  }, []);

  if (equipment.length === 0) {
    return (
      <div className="eq-empty">
        <p>Tidak ada alat ukur ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>No</th>
            <th style={{ width: '60px' }}>Foto</th>
            <th>Nomor Aset</th>
            <th>Nama Peralatan</th>
            <th>Kelompok Peralatan</th>
            <th>Ruangan</th>
            <th>Status Kelayakan</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((eq, idx) => {
            const assetNo = eq.nomor_aset || eq.assetNumber || '-';
            const name = eq.nama_peralatan || eq.name || '-';
            const brand = eq.merk || eq.merek || eq.brand || '';
            const model = eq.tipe_model || eq.model || '';

            const kId = eq.kelompok_aset_id || eq.kelompokAsetId;
            const foundK = kelompokList.find(k => String(k.id) === String(kId));
            const category = eq.kelompok_aset?.nama || eq.kelompok_asset?.nama || foundK?.nama || eq.kategori_peralatan?.nama_kategori || eq.kategori_peralatan || eq.category || 'Peralatan';

            const rId = eq.ruangan_id || eq.ruanganId;
            const foundR = ruanganList.find(r => String(r.id) === String(rId));
            const roomName = eq.ruangan
              ? `${eq.ruangan.kode_ruangan ? `${eq.ruangan.kode_ruangan} - ` : ''}${eq.ruangan.nama_ruangan}`
              : foundR
                ? `${foundR.kode_ruangan ? `${foundR.kode_ruangan} - ` : ''}${foundR.nama_ruangan || foundR.nama}`
                : (eq.room || '-');

            const status = eq.status_alat || eq.status_kelayakan || eq.status || 'Aktif';
            const photoUrl = formatPhotoUrl(eq.foto);

            return (
              <tr
                key={eq.id || idx}
                onClick={() => onSelect?.(eq)}
                style={{ cursor: onSelect ? 'pointer' : undefined }}
                title={onSelect ? 'Buka detail peralatan' : undefined}
              >
                <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                <td>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={18} color="#9CA3AF" />
                    )}
                  </div>
                </td>
                <td><span className="loan-id-badge">{assetNo}</span></td>
                <td>
                  <div>
                    <strong className="tool-name-text">{name}</strong>
                    {(brand || model) && (
                      <>
                        <br />
                        <small className="tool-code">{brand} {model ? `· ${model}` : ''}</small>
                      </>
                    )}
                  </div>
                </td>
                <td><span className="eq-category-tag">{category}</span></td>
                <td><span className="eq-room-tag">{roomName}</span></td>
                <td><EquipmentStatusBadge status={status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
