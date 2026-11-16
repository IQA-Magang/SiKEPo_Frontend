import { useEffect, useMemo, useState } from "react";
import "./inspection.css";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";
import { useToast } from "../../app/providers/ToastContext.jsx";
import { useNavigate } from "../../app/router/Router.jsx";
import {
  Button,
  ErrorState,
  FormField,
  LoadingState,
  Modal,
  PageHeader,
} from "../../shared/components/ui/index.js";
import {
  formatPhotoUrl,
  getCurrentUser,
  getEquipmentCategoryId,
  getEquipmentId,
  kalibrasiApi,
  peralatanApi,
  verifikasiFungsiApi,
} from "../../shared/services/api.js";
import { getUserRole, isStaffPengelola } from "../../shared/utils/permissions.js";

const CYCLE_CONFIG = {
  kalibrasi: {
    title: "Kalibrasi",
    categoryIds: [1, 2],
    api: kalibrasiApi,
    statusLabels: {
      direncanakan: "Direncanakan",
      dalam_proses: "Dalam proses",
      selesai: "Selesai",
      dibatalkan: "Dibatalkan",
    },
  },
  "verifikasi-fungsi": {
    title: "Verifikasi Fungsi",
    categoryIds: [1, 2],
    api: verifikasiFungsiApi,
    statusLabels: {
      direncanakan: "Direncanakan",
      dalam_proses: "Dalam proses",
      selesai: "Selesai",
      dibatalkan: "Dibatalkan",
    },
  },
};

const EMPTY_CREATE_FORM = {
  peralatan_id: "",
  metode: "Eksternal",
  jenis_pemeriksaan_berkala: "verifikasi fungsi metode tertentu",
  tgl_jatuh_tempo: "",
  fungsi_sbg_alat_standar: false,
  acuan_pembanding: "",
  interval_bulan: "",
  status: "direncanakan",
};

const EMPTY_CHECKOUT_FORM = {
  metode: "Eksternal",
  lab_kalibrasi: "",
  tanggal_keluar: "",
  perkiraan_kembali: "",
};

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "";
}

function dateTimeValue(value) {
  return value ? `${value}T00:00:00Z` : null;
}

function displayDate(value) {
  const date = dateOnly(value);
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dueState(value) {
  const date = dateOnly(value);
  if (!date) return { label: "Belum ada tanggal", tone: "neutral", days: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${date}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `Terlambat ${Math.abs(days)} hari`, tone: "late", days };
  if (days <= 7) return { label: days === 0 ? "Jatuh tempo hari ini" : `${days} hari lagi`, tone: "urgent", days };
  if (days <= 30) return { label: `${days} hari lagi`, tone: "soon", days };
  return { label: `${days} hari lagi`, tone: "safe", days };
}

export default function InspectionCycleManagement({ type }) {
  const config = CYCLE_CONFIG[type];
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [equipment, setEquipment] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [panel, setPanel] = useState(null);
  const [activeView, setActiveView] = useState("planned");
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [checkoutForm, setCheckoutForm] = useState(EMPTY_CHECKOUT_FORM);

  const user = useMemo(() => getCurrentUser(), []);
  const canManage = getUserRole(user) === "admin" || isStaffPengelola(user);

  async function loadData() {
    setLoading(true);
    setLoadError("");
    try {
      const equipmentResponse = await peralatanApi.getAll();
      if (!Array.isArray(equipmentResponse?.data)) {
        throw new Error("Format respons daftar peralatan tidak valid.");
      }
      const equipmentList = equipmentResponse.data.filter(
        (item) => config.categoryIds.includes(getEquipmentCategoryId(item)),
      );
      const records = await Promise.all(equipmentList.map(async (item) => {
        const response = await config.api.getByEquipment(getEquipmentId(item));
        if (!Array.isArray(response?.data)) {
          throw new Error(`Format histori ${config.title.toLowerCase()} tidak valid untuk ${item.nama_peralatan || "peralatan"}.`);
        }
        return response.data.map((record) => ({ ...record, peralatan: item }));
      }));
      setEquipment(equipmentList);
      setCycles(records.flat());
    } catch (loadErr) {
      setLoadError(loadErr.message || `Gagal memuat data ${config.title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    setActiveView("planned");
  }, [type]);

  const activeCycles = cycles
    .filter((cycle) => ["direncanakan", "dalam_proses"].includes(cycle.status))
    .sort((a, b) => {
      const firstDate = dateOnly(a.tgl_jatuh_tempo || a.perkiraan_kembali || a.tanggal_keluar);
      const secondDate = dateOnly(b.tgl_jatuh_tempo || b.perkiraan_kembali || b.tanggal_keluar);
      return (firstDate || "9999-12-31").localeCompare(secondDate || "9999-12-31");
    });
  const activeEquipmentIds = new Set(activeCycles.map((cycle) => String(cycle.peralatan_id)));
  const availableEquipment = equipment.filter(
    (item) => !activeEquipmentIds.has(String(getEquipmentId(item))),
  );
  const equipmentWithCycles = new Set(cycles.map((cycle) => String(cycle.peralatan_id)));
  const inProgressCycles = activeCycles.filter((cycle) => cycle.status === "dalam_proses");
  const plannedCycles = activeCycles.filter((cycle) => cycle.status === "direncanakan");
  const completedCycles = cycles
    .filter((cycle) => ["selesai", "dibatalkan"].includes(cycle.status))
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
  const withoutSchedule = equipment.filter(
    (item) => !equipmentWithCycles.has(String(getEquipmentId(item))),
  );

  function openCreate(equipmentItem = null) {
    const equipmentId = equipmentItem ? getEquipmentId(equipmentItem) : "";
    setCreateForm({
      ...EMPTY_CREATE_FORM,
      peralatan_id: equipmentId ? String(equipmentId) : "",
      interval_bulan: equipmentItem?.interval_kalibrasi_bulan || "",
    });
    setSelectedCycle(null);
    setPanel("create");
  }

  function openEquipmentVerification(cycle) {
    const equipmentId = getEquipmentId(cycle.peralatan) ?? cycle.peralatan_id;
    if (equipmentId == null || equipmentId === "") {
      error("ID peralatan tidak ditemukan untuk membuka halaman verifikasi.");
      return;
    }
    navigate(`/verifikasi/${equipmentId}`);
  }

  function openCheckout(cycle) {
    setSelectedCycle(cycle);
    setCheckoutForm({
      metode: cycle.metode || "Eksternal",
      lab_kalibrasi: cycle.lab_kalibrasi || "",
      tanggal_keluar: dateOnly(cycle.tanggal_keluar),
      perkiraan_kembali: dateOnly(cycle.perkiraan_kembali),
    });
    setPanel("checkout");
  }

  useEffect(() => {
    if (loading || loadError) return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (!["result", "checkout"].includes(action)) return;
    const cycleId = params.get("cycleId");
    const cycle = cycles.find((item) => String(item.id) === cycleId);
    if (!cycle) {
      error(`Siklus ${config.title.toLowerCase()} tidak ditemukan.`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    setActiveView(cycle.status === "dalam_proses" ? "in-progress" : "planned");
    if (canManage) {
      if (
        action === "result" &&
        (type === "verifikasi-fungsi" || (type === "kalibrasi" && cycle.status === "dalam_proses"))
      ) {
        window.history.replaceState({}, "", window.location.pathname);
        openEquipmentVerification(cycle);
        return;
      } else if (action === "checkout" && type === "kalibrasi" && cycle.status === "direncanakan") {
        openCheckout(cycle);
      } else {
        error("Aksi tidak sesuai dengan status siklus pemeriksaan.");
      }
    } else {
      error("Anda tidak memiliki akses untuk mencatat pemeriksaan.");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [loading, loadError, cycles, type, canManage, error, navigate]);

  function updateCreateField(event) {
    const { name, value, checked, type: inputType } = event.target;
    setCreateForm((previous) => ({
      ...previous,
      [name]: inputType === "checkbox" ? checked : value,
      ...(name === "peralatan_id" && type === "kalibrasi"
        ? {
          interval_bulan: equipment.find((item) => String(getEquipmentId(item)) === value)
            ?.interval_kalibrasi_bulan || "",
        }
        : {}),
    }));
  }

  async function createCycle(event) {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    try {
      const item = equipment.find((entry) => String(getEquipmentId(entry)) === String(createForm.peralatan_id));
      if (type === "kalibrasi") {
        await config.api.create(Number(createForm.peralatan_id), {
          metode: createForm.metode,
          status: createForm.status,
          interval_bulan: Number(createForm.interval_bulan || item?.interval_kalibrasi_bulan || 0),
        });
      } else {
        await config.api.create(Number(createForm.peralatan_id), {
          jenis_pemeriksaan_berkala: createForm.jenis_pemeriksaan_berkala,
          status: createForm.status,
          tgl_jatuh_tempo: dateTimeValue(createForm.tgl_jatuh_tempo),
          fungsi_sbg_alat_standar: createForm.fungsi_sbg_alat_standar,
          acuan_pembanding: createForm.acuan_pembanding,
        });
      }
      success(`Siklus ${config.title.toLowerCase()} berhasil dibuat.`);
      setPanel(null);
      await loadData();
    } catch (saveError) {
      error(saveError.message || `Gagal membuat siklus ${config.title.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(cycle, status) {
    setSaving(true);
    try {
      await config.api.updateStatus(cycle.id, status);
      success(status === "dalam_proses" ? "Siklus dimulai." : "Siklus dibatalkan.");
      await loadData();
    } catch (statusError) {
      error(statusError.message || "Gagal memperbarui status siklus.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCheckout(event) {
    event.preventDefault();
    if (!selectedCycle) return;
    setSaving(true);
    try {
      await kalibrasiApi.recordEquipmentOut(selectedCycle.id, checkoutForm);
      success("Data alat keluar berhasil dicatat.");
      setPanel(null);
      await loadData();
    } catch (saveError) {
      error(saveError.message || "Gagal mencatat data alat keluar.");
    } finally {
      setSaving(false);
    }
  }

  function updateCheckoutField(name, value) {
    setCheckoutForm((previous) => ({ ...previous, [name]: value }));
  }

  const statusTabs = [
    {
      id: "planned",
      label: type === "kalibrasi" ? "Masuk rentang kalibrasi" : "Masuk rentang verifikasi",
      count: plannedCycles.length,
      Icon: CalendarClock,
    },
    {
      id: "in-progress",
      label: type === "kalibrasi" ? "Sedang dikalibrasi" : "Sedang diverifikasi",
      count: inProgressCycles.length,
      Icon: RefreshCw,
    },
    { id: "unscheduled", label: "Belum ada jadwal", count: withoutSchedule.length, Icon: Plus },
    { id: "history", label: "History", count: completedCycles.length, Icon: FileText },
  ];
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="page-container fade-in-up inspection-cycle-page">
      <div className="inspection-breadcrumb"><span>Pemeriksaan Peralatan</span><span>/</span><strong>{config.title}</strong></div>
      <PageHeader
        eyebrow="PEMANTAUAN SIKLUS PERALATAN"
        title={config.title}
        subtitle={`Lab Anda · ${today} · Jadwal, proses, dan histori ${config.title.toLowerCase()} dalam satu tampilan.`}
      />

      <nav className="inspection-tabs" aria-label="Status pemeriksaan berkala">
        {statusTabs.map(({ id, label, count: tabCount, Icon }) => (
          <button
            type="button"
            key={id}
            className={`inspection-tab${activeView === id ? " is-active" : ""}`}
            aria-pressed={activeView === id}
            onClick={() => setActiveView(id)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
            <span className="inspection-tab-count">{tabCount}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <LoadingState message={`Memuat jadwal ${config.title.toLowerCase()}...`} />
      ) : loadError ? (
        <ErrorState title={`Gagal memuat ${config.title.toLowerCase()}`} message={loadError} onRetry={loadData} />
      ) : (
        <div className="inspection-cycle-layout">
          <div className="inspection-cycle-sections">
            {activeView === "planned" && (
              <CycleTableSection
                number="1"
                title={type === "kalibrasi" ? "Masuk rentang kalibrasi" : "Masuk rentang verifikasi"}
                hint={plannedCycles.length ? `${plannedCycles.length} jadwal · terdekat ditampilkan lebih dulu` : "Siklus aktif yang memerlukan tindak lanjut"}
                cycles={plannedCycles}
                type={type}
                canManage={canManage}
                saving={saving}
                config={config}
                onStart={(cycle) => type === "kalibrasi"
                  ? openCheckout(cycle)
                  : changeStatus(cycle, "dalam_proses")}
                onResult={openEquipmentVerification}
                emptyText={`Belum ada jadwal ${config.title.toLowerCase()} yang menunggu.`}
              />
            )}
            {activeView === "in-progress" && (
              <CycleTableSection
                number="2"
                title={type === "kalibrasi" ? "Sedang dikalibrasi" : "Sedang diverifikasi"}
                hint="Siklus yang sedang dikerjakan"
                cycles={inProgressCycles}
                type={type}
                canManage={canManage}
                saving={saving}
                config={config}
                onStart={(cycle) => type === "kalibrasi"
                  ? openCheckout(cycle)
                  : changeStatus(cycle, "dalam_proses")}
                onResult={openEquipmentVerification}
                emptyText="Belum ada siklus yang sedang diproses."
              />
            )}
            {activeView === "history" && (
              <CycleTableSection
                number="3"
                title="History"
                hint="Siklus yang telah selesai atau dibatalkan"
                cycles={completedCycles}
                type={type}
                canManage={false}
                saving={saving}
                config={config}
                onStart={() => {}}
                onResult={openEquipmentVerification}
                emptyText="History akan muncul setelah siklus selesai."
              />
            )}
            {activeView === "unscheduled" && (
              <section className="inspection-section inspection-empty-schedule">
                <header className="inspection-section__header">
                  <div><h2>Belum ada jadwal</h2><span>Peralatan tanpa siklus pemeriksaan berkala</span></div>
                  <span className="inspection-section-count">{withoutSchedule.length}</span>
                </header>
                {withoutSchedule.length === 0 ? (
                  <div className="inspection-table-empty"><Clock3 size={16} />Semua peralatan sudah memiliki jadwal.</div>
                ) : (
                  <div className="inspection-unscheduled-list">
                    {withoutSchedule.map((item) => (
                      <button type="button" key={getEquipmentId(item)} onClick={() => openCreate(item)}>
                        <span><strong>{item.nomor_aset || `ID ${getEquipmentId(item)}`}</strong>{item.nama_peralatan}</span>
                        <Plus size={16} />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {panel && (
            <Modal
              isOpen={Boolean(panel)}
              onClose={() => setPanel(null)}
              title={panel === "create"
                ? `Buat Jadwal ${config.title}`
                : "Catat Alat Keluar"}
              description={panel === "create"
                ? `Lengkapi informasi siklus ${config.title.toLowerCase()}.`
                : `${selectedCycle?.peralatan?.nomor_aset || ""} ${selectedCycle?.peralatan?.nama_peralatan || ""}`}
              size="lg"
              className="inspection-cycle-modal"
            >
              {panel === "create" ? (
                <CreateCycleForm
                  type={type}
                  equipment={availableEquipment}
                  form={createForm}
                  onChange={updateCreateField}
                  onSubmit={createCycle}
                  onCancel={() => setPanel(null)}
                  saving={saving}
                />
              ) : (
                <EquipmentCheckoutForm
                  form={checkoutForm}
                  onChange={updateCheckoutField}
                  onSubmit={saveCheckout}
                  onCancel={() => setPanel(null)}
                  saving={saving}
                />
              )}
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}

function CycleTableSection({
  number,
  title,
  hint,
  cycles,
  type,
  canManage,
  saving,
  config,
  onStart,
  onResult,
  emptyText,
}) {
  return (
    <section className="inspection-section">
      <header className="inspection-section__header">
        <div><h2>{number} · {title}</h2><span>{hint}</span></div>
        <span className="inspection-section-count">{cycles.length}</span>
      </header>
      {cycles.length === 0 ? (
        <div className="inspection-table-empty"><Clock3 size={16} />{emptyText}</div>
      ) : (
        <div className="inspection-table-scroll">
          <table className="inspection-cycle-table">
            <thead>
              <tr>
                <th>Peralatan</th>
                <th>{type === "kalibrasi" ? "Metode" : "Jenis / acuan"}</th>
                <th>Jatuh tempo</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => {
                const due = dueState(cycle.tgl_jatuh_tempo || cycle.perkiraan_kembali);
                const pdf = type === "kalibrasi" ? cycle.sertifikat_pdf : cycle.pdf_laporan;
                const pdfUrl = formatPhotoUrl(pdf);
                return (
                  <tr key={`${cycle.peralatan_id}-${cycle.id}`} className={due.tone === "late" ? "is-overdue" : ""}>
                    <td>
                      <div className="inspection-table-equipment">
                        <strong>{cycle.peralatan?.nomor_aset || `ID ${cycle.peralatan_id}`}</strong>
                        <span>{cycle.peralatan?.nama_peralatan || "Peralatan"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="inspection-table-meta">
                        <strong>{type === "kalibrasi" ? cycle.metode : (cycle.jenis_pemeriksaan_berkala || "Verifikasi fungsi")}</strong>
                        <span>{type === "kalibrasi" ? (cycle.lab_kalibrasi || `Setiap ${cycle.interval_bulan || "—"} bulan`) : (cycle.acuan_pembanding || "Acuan belum dicatat")}</span>
                      </div>
                    </td>
                    <td>
                      <div className="inspection-table-meta">
                        <strong>{displayDate(cycle.tgl_jatuh_tempo || cycle.perkiraan_kembali)}</strong>
                        <span className={`inspection-due-text is-${due.tone}`}>{due.label}</span>
                      </div>
                    </td>
                    <td><span className={`inspection-cycle-status inspection-cycle-status--${cycle.status}`}>{config.statusLabels[cycle.status] || cycle.status}</span></td>
                    <td>
                      <div className="inspection-row-actions">
                        {pdfUrl && <a className="inspection-row-file" href={pdfUrl} target="_blank" rel="noreferrer" aria-label="Buka dokumen"><FileText size={16} /></a>}
                        {canManage && cycle.status === "direncanakan" && (
                          <Button variant="secondary" size="sm" disabled={saving} onClick={() => onStart(cycle)}>
                            {type === "kalibrasi" ? "Catat alat keluar" : "Mulai"}
                          </Button>
                        )}
                        {canManage && cycle.status === "dalam_proses" && (
                          <Button variant="primary" size="sm" disabled={saving} onClick={() => onResult(cycle)}>
                            {type === "kalibrasi" ? "Selesai kalibrasi" : "Catat hasil"}
                          </Button>
                        )}
                        {!canManage && ["direncanakan", "dalam_proses"].includes(cycle.status) && (
                          <span className="inspection-readonly-hint">Hubungi pengelola</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CreateCycleForm({ type, equipment, form, onChange, onSubmit, onCancel, saving }) {
  const selectedEquipment = equipment.find((item) => String(getEquipmentId(item)) === String(form.peralatan_id));
  return (
    <form className="inspection-side-form" onSubmit={onSubmit}>
      <FormField label="Peralatan" htmlFor="cycle-equipment" required>
        <select id="cycle-equipment" className="form-select" name="peralatan_id" value={form.peralatan_id} onChange={onChange} required>
          <option value="">Pilih peralatan</option>
          {equipment.map((item) => <option key={getEquipmentId(item)} value={getEquipmentId(item)}>{item.nomor_aset ? `${item.nomor_aset} — ` : ""}{item.nama_peralatan}</option>)}
        </select>
      </FormField>
      {type === "kalibrasi" ? (
        <>
          <FormField label="Tujuan kalibrasi" htmlFor="cycle-method" required>
            <select id="cycle-method" className="form-select" name="metode" value={form.metode} onChange={onChange}>
              <option value="Eksternal">Eksternal</option><option value="Internal">Internal</option>
            </select>
          </FormField>
          <FormField label="Interval (bulan)" htmlFor="cycle-interval">
            <input id="cycle-interval" className="form-input" type="number" min="1" max="120" name="interval_bulan" value={form.interval_bulan || selectedEquipment?.interval_kalibrasi_bulan || ""} onChange={onChange} required />
          </FormField>
          <p className="inspection-form-note"><AlertCircle size={15} /> Sertifikat tidak diperlukan untuk membuat jadwal. Unggah saat kalibrasi selesai.</p>
        </>
      ) : (
        <>
          <FormField label="Cara verifikasi" htmlFor="cycle-function-kind" required>
            <select id="cycle-function-kind" className="form-select" name="jenis_pemeriksaan_berkala" value={form.jenis_pemeriksaan_berkala} onChange={onChange}>
              <option value="verifikasi fungsi uji banding">Uji banding</option>
              <option value="verifikasi fungsi metode tertentu">Metode tertentu</option>
            </select>
          </FormField>
          <FormField label="Tanggal jatuh tempo" htmlFor="cycle-function-due">
            <input id="cycle-function-due" className="form-input" type="date" name="tgl_jatuh_tempo" value={form.tgl_jatuh_tempo} onChange={onChange} />
          </FormField>
          <FormField label="Acuan pembanding" htmlFor="cycle-reference">
            <input id="cycle-reference" className="form-input" name="acuan_pembanding" value={form.acuan_pembanding} onChange={onChange} placeholder="Nama/nomor acuan" />
          </FormField>
          <label className="inspection-check-option"><input type="checkbox" name="fungsi_sbg_alat_standar" checked={form.fungsi_sbg_alat_standar} onChange={onChange} /><span>Berfungsi sebagai alat standar</span></label>
        </>
      )}
      <FormField label="Status awal" htmlFor="cycle-status" required>
        <select id="cycle-status" className="form-select" name="status" value={form.status} onChange={onChange}>
          <option value="direncanakan">Direncanakan</option>
          {type !== "kalibrasi" && <option value="dalam_proses">Dalam proses</option>}
        </select>
      </FormField>
      <div className="inspection-side-form__footer">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Batal</Button>
        <Button type="submit" icon={<Plus size={15} />} disabled={saving || !equipment.length}>{saving ? "Menyimpan..." : "Simpan jadwal"}</Button>
      </div>
    </form>
  );
}

function EquipmentCheckoutForm({ form, onChange, onSubmit, onCancel, saving }) {
  return (
    <form className="inspection-side-form" onSubmit={onSubmit}>
      <FormField label="Tujuan kalibrasi" htmlFor="checkout-calibration-method" required>
        <select
          id="checkout-calibration-method"
          className="form-select"
          value={form.metode}
          onChange={(event) => onChange("metode", event.target.value)}
          required
        >
          <option value="Eksternal">Eksternal</option>
          <option value="Internal">Internal</option>
        </select>
      </FormField>
      <FormField label="Lab kalibrasi" htmlFor="checkout-calibration-lab" required>
        <input
          id="checkout-calibration-lab"
          className="form-input"
          value={form.lab_kalibrasi}
          onChange={(event) => onChange("lab_kalibrasi", event.target.value)}
          placeholder="Nama laboratorium kalibrasi"
          required
        />
      </FormField>
      <div className="inspection-form-grid">
        <FormField label="Tanggal keluar" htmlFor="checkout-calibration-out" required>
          <input
            id="checkout-calibration-out"
            className="form-input"
            type="date"
            value={form.tanggal_keluar}
            onChange={(event) => onChange("tanggal_keluar", event.target.value)}
            required
          />
        </FormField>
        <FormField label="Perkiraan kembali" htmlFor="checkout-calibration-return" required>
          <input
            id="checkout-calibration-return"
            className="form-input"
            type="date"
            value={form.perkiraan_kembali}
            onChange={(event) => onChange("perkiraan_kembali", event.target.value)}
            min={form.tanggal_keluar || undefined}
            required
          />
        </FormField>
      </div>
      <p className="inspection-form-note"><Send size={14} /> Data keluar disimpan sebelum proses pencatatan hasil kalibrasi.</p>
      <div className="inspection-side-form__footer">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>Batal</Button>
        <Button type="submit" icon={<Send size={15} />} disabled={saving}>{saving ? "Menyimpan..." : "Simpan alat keluar"}</Button>
      </div>
    </form>
  );
}

