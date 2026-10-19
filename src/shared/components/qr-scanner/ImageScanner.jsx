import { Upload } from "lucide-react";
import { Button } from "../ui/index.js";

export default function ImageScanner({ onFileUpload }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)", textAlign: "center" }}>
      <div
        style={{
          border: "2px dashed var(--clr-dark-300)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--sp-8)",
          background: "var(--clr-dark-50)",
        }}
      >
        <Upload
          size={36}
          style={{ color: "var(--clr-primary-500)", marginBottom: "var(--sp-3)" }}
        />
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-bold)", marginBottom: 4 }}>
          Pilih atau Drop Gambar QR Code
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-dark-500)", marginBottom: "var(--sp-4)" }}>
          Upload file PNG atau JPG gambar QR Code yang ingin dipindai
        </p>
        <Button
          as="label"
          variant="primary"
          icon={<Upload size={15} />}
          style={{ cursor: "pointer" }}
        >
          Pilih Gambar QR
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFileUpload}
          />
        </Button>
      </div>
    </div>
  );
}
