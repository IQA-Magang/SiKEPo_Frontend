import { FormField } from '../../../shared/components/ui/index.js';

function DetailInputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helpText,
  required = true,
  readOnly = false,
}) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      hint={helpText}
      hintId={helpText ? `${id}-help` : undefined}
      required={required}
    >
      <input
        id={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        aria-describedby={helpText ? `${id}-help` : undefined}
      />
    </FormField>
  );
}

function StandardEquipmentToggle({ id, checked, onChange }) {
  return (
    <label className="standard-equipment-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="standard-equipment-toggle-copy">
        <strong>Digunakan sebagai alat standar</strong>
        <span>
          Tandai jika peralatan ini digunakan sebagai acuan untuk pengukuran atau pengujian.
        </span>
      </span>
    </label>
  );
}

function PeriodicActivityFields({ form, setField }) {
  return (
    <>
      <FormField
        label="Metode Pemeriksaan Berkala"
        htmlFor="d-metode-pemeriksaan"
        hint="Pilih kalibrasi atau verifikasi fungsi untuk peralatan ini."
        hintId="d-metode-pemeriksaan-help"
        required
      >
        <select
          id="d-metode-pemeriksaan"
          className="form-select"
          value={form.metode_pemeriksaan}
          onChange={(event) => setField('metode_pemeriksaan', event.target.value)}
          aria-describedby="d-metode-pemeriksaan-help"
        >
          <option value="kalibrasi">Kalibrasi</option>
          <option value="verifikasi fungsi">Verifikasi fungsi</option>
        </select>
      </FormField>

      {form.metode_pemeriksaan === 'kalibrasi' ? (
        <div className="form-grid-2" style={{ gridColumn: '1/-1' }}>
          <FormField label="Metode Kalibrasi" htmlFor="d-metode-kalibrasi" required>
            <select
              id="d-metode-kalibrasi"
              className="form-select"
              value={form.metode_kalibrasi}
              onChange={(event) => setField('metode_kalibrasi', event.target.value)}
            >
              <option value="Eksternal">Eksternal</option>
              <option value="Internal">Internal</option>
            </select>
          </FormField>
          <DetailInputField
            id="d-lab-kalibrasi"
            label="Laboratorium Kalibrasi"
            value={form.lab_kalibrasi}
            onChange={(event) => setField('lab_kalibrasi', event.target.value)}
            placeholder="Laboratorium Kalibrasi ABC"
          />
          <FormField label="Interval Kalibrasi" htmlFor="d-interval-kalibrasi" required>
            <select
              id="d-interval-kalibrasi"
              className="form-select"
              value={form.interval_bulan}
              onChange={(event) => setField('interval_bulan', event.target.value)}
            >
              <option value="">Pilih interval</option>
              <option value="12">1 tahun (12 bulan)</option>
              <option value="24">2 tahun (24 bulan)</option>
              <option value="36">3 tahun (36 bulan)</option>
            </select>
          </FormField>
          <DetailInputField
            id="d-no-sertifikat-kalibrasi"
            label="No. Sertifikat Kalibrasi"
            value={form.no_sertifikat}
            onChange={(event) => setField('no_sertifikat', event.target.value)}
            placeholder="CERT-2026-001"
          />
          <DetailInputField
            id="d-penerbit-sertifikat"
            label="Diterbitkan Oleh"
            value={form.diterbitkan_oleh}
            onChange={(event) => setField('diterbitkan_oleh', event.target.value)}
            placeholder="Laboratorium Kalibrasi ABC"
          />
          <DetailInputField
            id="d-tgl-kalibrasi"
            label="Tanggal Kalibrasi"
            type="date"
            value={form.tgl_kalibrasi}
            onChange={(event) => setField('tgl_kalibrasi', event.target.value)}
          />
          <FormField
            label="Upload Sertifikat Kalibrasi (PDF)"
            htmlFor="d-sertifikat-pdf"
            hint="File PDF, maksimal 15 MB."
            hintId="d-sertifikat-pdf-help"
            required
          >
            <input
              id="d-sertifikat-pdf"
              type="file"
              className="form-input"
              accept=".pdf,application/pdf"
              onChange={(event) => setField('sertifikat_pdf_file', event.target.files?.[0] || null)}
              aria-describedby="d-sertifikat-pdf-help"
            />
          </FormField>
        </div>
      ) : (
        <div className="form-grid-2" style={{ gridColumn: '1/-1' }}>
          <FormField
            label="Jenis Verifikasi Fungsi"
            htmlFor="d-jenis-verifikasi"
            required
          >
            <select
              id="d-jenis-verifikasi"
              className="form-select"
              value={form.jenis_pemeriksaan_berkala}
              onChange={(event) => setField('jenis_pemeriksaan_berkala', event.target.value)}
            >
              <option value="verifikasi fungsi metode tertentu">Verifikasi fungsi metode tertentu</option>
              <option value="verifikasi fungsi uji banding">Verifikasi fungsi uji banding</option>
            </select>
          </FormField>
          <FormField label="Interval Verifikasi Fungsi" htmlFor="d-interval-verifikasi" required>
            <select
              id="d-interval-verifikasi"
              className="form-select"
              value={form.interval_bulan}
              onChange={(event) => setField('interval_bulan', event.target.value)}
            >
              <option value="">Pilih interval</option>
              <option value="12">1 tahun (12 bulan)</option>
              <option value="24">2 tahun (24 bulan)</option>
              <option value="36">3 tahun (36 bulan)</option>
            </select>
          </FormField>
          <DetailInputField
            id="d-tgl-pemeriksaan-terakhir"
            label="Tanggal Pemeriksaan Terakhir"
            type="date"
            value={form.tgl_pemeriksaan_terakhir}
            onChange={(event) => setField('tgl_pemeriksaan_terakhir', event.target.value)}
          />
          <DetailInputField
            id="d-tgl-jatuh-tempo-verifikasi"
            label="Tanggal Jatuh Tempo"
            type="date"
            value={form.tgl_jatuh_tempo}
            onChange={(event) => setField('tgl_jatuh_tempo', event.target.value)}
            helpText="Dihitung otomatis dari tanggal pemeriksaan terakhir dan interval verifikasi."
            readOnly
          />
          <DetailInputField
            id="d-acuan-pembanding"
            label="Acuan Pembanding"
            value={form.acuan_pembanding}
            onChange={(event) => setField('acuan_pembanding', event.target.value)}
            placeholder="Sensor referensi suhu dan kelembapan"
          />
          <DetailInputField
            id="d-pelaksana-verifikasi"
            label="Pelaksana"
            value={form.pelaksana}
            onChange={(event) => setField('pelaksana', event.target.value)}
            placeholder="Nama Pelaksana"
          />
          <FormField label="Hasil Verifikasi Fungsi" htmlFor="d-hasil-verifikasi" required>
            <select
              id="d-hasil-verifikasi"
              className="form-select"
              value={form.hasil}
              onChange={(event) => setField('hasil', event.target.value)}
            >
              <option value="">Pilih hasil</option>
              <option value="sesuai">Sesuai</option>
              <option value="tidak sesuai">Tidak Sesuai</option>
            </select>
          </FormField>
          <DetailInputField
            id="d-no-laporan-verifikasi"
            label="No. Laporan"
            value={form.no_laporan}
            onChange={(event) => setField('no_laporan', event.target.value)}
            placeholder="LAP-VER-2026-001"
          />
          <FormField
            label="Upload Dokumen Laporan (PDF)"
            htmlFor="d-pdf-laporan"
            hint="File PDF, maksimal 15 MB."
            hintId="d-pdf-laporan-help"
            required
          >
            <input
              id="d-pdf-laporan"
              type="file"
              className="form-input"
              accept=".pdf,application/pdf"
              onChange={(event) => setField('pdf_laporan_file', event.target.files?.[0] || null)}
              aria-describedby="d-pdf-laporan-help"
            />
          </FormField>
        </div>
      )}
    </>
  );
}

function MeasuringEquipmentFields({ form, setField }) {
  return (
    <div className="form-grid-2">
      <PeriodicActivityFields form={form} setField={setField} />
      <StandardEquipmentToggle
        id="d-alat-standar"
        checked={form.fungsi_sbg_alat_standar}
        onChange={(event) => setField('fungsi_sbg_alat_standar', event.target.checked)}
      />
    </div>
  );
}

function AuxiliaryEquipmentFields({ form, setField }) {
  return (
    <div className="form-grid-2">
      <PeriodicActivityFields form={form} setField={setField} />
      <StandardEquipmentToggle
        id="d-alat-standar-ab"
        checked={form.fungsi_sbg_alat_standar}
        onChange={(event) => setField('fungsi_sbg_alat_standar', event.target.checked)}
      />
    </div>
  );
}

function ReferenceArtifactFields({ form, setField }) {
  return (
    <div className="form-grid-2">
      <DetailInputField
        id="d-jenis-aa"
        label="Jenis / Deskripsi Acuan"
        value={form.jenis_deskripsi}
        onChange={(event) => setField('jenis_deskripsi', event.target.value)}
      />
      <FormField label="Karakteristik yang Diacu" htmlFor="d-karakteristik" required>
        <select
          id="d-karakteristik"
          className="form-select"
          value={form.karakteristik_yang_diacu || 'visual'}
          onChange={(event) => setField('karakteristik_yang_diacu', event.target.value)}
        >
          <option value="visual">visual</option>
          <option value="dimension">dimension</option>
          <option value="kinerja funngsional">kinerja funngsional</option>
          <option value="visual & dimension">visual &amp; dimension</option>
          <option value="dimension & kinerja">dimension &amp; kinerja</option>
        </select>
      </FormField>
      <DetailInputField id="d-nilai-spec" label="Nilai Spesifikasi Karakterisasi" value={form.nilai_spesifikasi_karakterisasi} onChange={(event) => setField('nilai_spesifikasi_karakterisasi', event.target.value)} />
      <DetailInputField id="d-metode-kar" label="Metode Karakterisasi" value={form.metode_karakterisasi} onChange={(event) => setField('metode_karakterisasi', event.target.value)} />
      <DetailInputField id="d-no-laporan" label="No. Laporan Karakterisasi" value={form.no_laporan_karakterisasi} onChange={(event) => setField('no_laporan_karakterisasi', event.target.value)} />
      <DetailInputField id="d-tgl-kar" label="Tgl. Karakterisasi Terakhir" type="date" value={form.tgl_karakterisasi_terakhir} onChange={(event) => setField('tgl_karakterisasi_terakhir', event.target.value)} />
      <DetailInputField
        id="d-jatuh-aa"
        label="Tgl. Jatuh Tempo"
        type="date"
        value={form.tgl_jatuh_tempo}
        onChange={(event) => setField('tgl_jatuh_tempo', event.target.value)}
        readOnly
        helpText="Dihitung otomatis dari tanggal karakterisasi terakhir dan interval karakterisasi."
      />
      <DetailInputField
        id="d-kondisi"
        label="Kondisi Penyimpanan"
        value={form.kondisi_penyimpanan}
        onChange={(event) => setField('kondisi_penyimpanan', event.target.value)}
        helpText="Tulis batas suhu, kelembapan, atau kondisi penyimpanan yang dipersyaratkan."
      />
      <DetailInputField
        id="d-interval-aa"
        label="Interval Karakterisasi (Bulan)"
        type="number"
        value={form.interval_bulan}
        onChange={(event) => setField('interval_bulan', event.target.value)}
        required={false}
        helpText="Jarak waktu sampai karakterisasi ulang berikutnya."
      />
      <FormField label="Status Artefak" htmlFor="d-status-artefak">
        <select
          id="d-status-artefak"
          className="form-select"
          value={form.status_artefak}
          onChange={(event) => setField('status_artefak', event.target.value)}
        >
          <option value="aktif">Aktif</option>
          <option value="karantina">Karantina</option>
          <option value="dihapuskan">Dihapuskan</option>
        </select>
      </FormField>
    </div>
  );
}

function SupportingComponentFields({ form, setField }) {
  return (
    <div className="equipment-technical-details__stack">
      <div className="form-grid-2">
        <FormField label="Sub Kategori" htmlFor="d-subkat" required>
          <select
            id="d-subkat"
            className="form-select"
            value={form.sub_kategori || 'data acuan'}
            onChange={(event) => setField('sub_kategori', event.target.value)}
          >
            <option value="data acuan">data acuan</option>
            <option value="pereaksi">pereaksi</option>
            <option value="bahan habis pakai">bahan habis pakai</option>
          </select>
        </FormField>
        <DetailInputField id="d-pemasok" label="Sumber / Pemasok" value={form.sumber_pemasok} onChange={(event) => setField('sumber_pemasok', event.target.value)} helpText="Nama produsen, pemasok, atau sumber penerbitan bahan." />
        <DetailInputField id="d-lot" label="No. Lot / Batch / Edisi" value={form.no_lot_batch_edisi} onChange={(event) => setField('no_lot_batch_edisi', event.target.value)} helpText="Nomor identifikasi lot pada label atau kemasan." />
        <DetailInputField id="d-grade" label="Grade Mutu" value={form.grade_mutu} onChange={(event) => setField('grade_mutu', event.target.value)} />
        <DetailInputField id="d-satuan-kemasan" label="Satuan Kemasan" value={form.satuan_kemasan} onChange={(event) => setField('satuan_kemasan', event.target.value)} />
        <DetailInputField id="d-tgl-terima" label="Tgl. Terima / Terbit" type="date" value={form.tgl_terima_terbit} onChange={(event) => setField('tgl_terima_terbit', event.target.value)} />
        <DetailInputField id="d-tgl-kadaluarsa" label="Tgl. Kedaluwarsa" type="date" value={form.tgl_kedaluwarsa} onChange={(event) => setField('tgl_kedaluwarsa', event.target.value)} helpText="Tanggal batas penggunaan sesuai label atau sertifikat bahan." />
        <DetailInputField id="d-kondisi-kp" label="Kondisi Penyimpanan" value={form.kondisi_penyimpanan} onChange={(event) => setField('kondisi_penyimpanan', event.target.value)} required={false} helpText="Cantumkan suhu, kelembapan, atau perlindungan khusus yang diperlukan." />
      </div>
      <FormField
        label="Deskripsi / Spesifikasi"
        htmlFor="d-deskripsi-kp"
        hint="Tuliskan spesifikasi penting seperti konsentrasi, ukuran, atau karakteristik yang membedakan bahan ini."
        hintId="d-deskripsi-kp-help"
        required
      >
        <textarea
          id="d-deskripsi-kp"
          className="form-textarea"
          value={form.deskripsi_spesifikasi}
          onChange={(event) => setField('deskripsi_spesifikasi', event.target.value)}
          style={{ minHeight: 80 }}
          aria-describedby="d-deskripsi-kp-help"
        />
      </FormField>
      <FormField label="Status Ketersediaan" htmlFor="d-ketersediaan" required>
        <select
          id="d-ketersediaan"
          className="form-select"
          value={form.status_ketersediaan}
          onChange={(event) => setField('status_ketersediaan', event.target.value)}
        >
          {['Berlaku', 'Tersedia', 'Stok cukup', 'Stok menipis', 'Kedaluwarsa', 'Habis'].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

export default function EquipmentTechnicalDetails({ form, setField, categoryId }) {
  if (categoryId === 1) return <MeasuringEquipmentFields form={form} setField={setField} />;
  if (categoryId === 2) return <AuxiliaryEquipmentFields form={form} setField={setField} />;
  if (categoryId === 3) return <ReferenceArtifactFields form={form} setField={setField} />;
  if (categoryId === 4) return <SupportingComponentFields form={form} setField={setField} />;
  return <p>Pilih kategori pada langkah sebelumnya.</p>;
}
