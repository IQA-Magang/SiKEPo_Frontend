import { Camera, SwitchCamera } from "lucide-react";
import { Button, IconButton } from "../ui/index.js";

export default function CameraScanner({
  videoRef,
  canvasRef,
  cameraActive,
  cameraFacing,
  cameraDevices,
  onToggleCamera,
  onStartCamera,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-4)" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "min(240px, 36vh)",
          minHeight: 180,
          background: "var(--clr-dark-950)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid var(--clr-dark-700)",
        }}
      >
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          playsInline
          autoPlay
          muted
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <IconButton
          icon={<SwitchCamera size={18} />}
          label={`Gunakan kamera ${cameraFacing === "environment" ? "depan" : "belakang"}`}
          title={`Gunakan kamera ${cameraFacing === "environment" ? "depan" : "belakang"}`}
          variant="secondary"
          onClick={onToggleCamera}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 38,
            height: 38,
            minWidth: 38,
            minHeight: 38,
            padding: 0,
            border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: "var(--radius-full)",
            background: "rgba(15, 23, 42, 0.75)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            width: "min(180px, 65vw)",
            height: "min(180px, 65vw)",
            border: "2px dashed #EE2E24",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "90%",
              height: 2,
              background: "#EE2E24",
              boxShadow: "0 0 8px #EE2E24",
              animation: "scanLine 2s infinite ease-in-out",
            }}
          />
        </div>
      </div>

      {!cameraActive && (
        <Button
          variant="primary"
          icon={<Camera size={15} />}
          onClick={onStartCamera}
        >
          Aktifkan Kamera
        </Button>
      )}

      <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-dark-500)", textAlign: "center", margin: 0 }}>
        Arahkan kamera perangkat Anda tepat ke <strong>QR Code ID Peralatan</strong>
      </p>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-dark-500)", textAlign: "center", margin: 0 }}>
        Scanner otomatis memiliki fallback untuk browser yang belum mendukung BarcodeDetector.
      </p>
    </div>
  );
}
