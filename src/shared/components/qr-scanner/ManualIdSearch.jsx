import { ArrowRight } from "lucide-react";
import { Button, FormField } from "../ui/index.js";

export default function ManualIdSearch({
  value,
  onChange,
  onSubmit,
  scanning,
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}
    >
      <FormField
        label="Masukkan ID Peralatan atau Nomor Aset"
        htmlFor="input-scan-manual"
      >
        <div style={{ display: "flex", gap: "var(--sp-2)" }}>
          <input
            id="input-scan-manual"
            className="form-input"
            type="text"
            placeholder="Contoh: 1 atau AST-2026-001"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            style={{ flex: 1 }}
            autoFocus
          />
          <Button
            type="submit"
            variant="primary"
            icon={<ArrowRight size={15} />}
            disabled={scanning || !value.trim()}
          >
            Cari
          </Button>
        </div>
      </FormField>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-dark-500)", margin: 0 }}>
        Ketik nomor ID peralatan (misal <code>1</code>) atau nomor aset lengkap
        untuk langsung membuka halaman detail.
      </p>
    </form>
  );
}
