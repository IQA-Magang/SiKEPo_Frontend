import { CalendarCheck2, ClipboardCheck, Gauge, Wrench } from "lucide-react";
import { useNavigate } from "../../app/router/Router.jsx";
import "./inspection.css";

const TABS = [
  { type: "kalibrasi", label: "Kalibrasi", path: "/pemeriksaan/kalibrasi", Icon: Gauge },
  { type: "verifikasi-fungsi", label: "Verifikasi Fungsi", path: "/pemeriksaan/verifikasi-fungsi", Icon: ClipboardCheck },
  { type: "pengecekan_antara", label: "Pengecekan Antara", path: "/pemeriksaan/pengecekan-antara", Icon: CalendarCheck2 },
  { type: "pemeliharaan", label: "Pemeliharaan", path: "/pemeriksaan/pemeliharaan", Icon: Wrench },
];

export default function InspectionTabs({ activeType, counts = {} }) {
  const navigate = useNavigate();

  return (
    <nav className="inspection-tabs" aria-label="Jenis pemeriksaan peralatan">
      {TABS.map(({ type, label, path, Icon }) => (
        <button
          type="button"
          key={type}
          className={`inspection-tab${activeType === type ? " is-active" : ""}`}
          aria-current={activeType === type ? "page" : undefined}
          onClick={() => navigate(path)}
        >
          <Icon size={16} aria-hidden="true" />
          <span>{label}</span>
          {Number.isFinite(counts[type]) && <span className="inspection-tab-count">{counts[type]}</span>}
        </button>
      ))}
    </nav>
  );
}
