import { useEffect, useId, useRef } from "react";
import { CheckCircle2, Eraser } from "lucide-react";

export default function SignatureField({
  value,
  onChange,
  label,
  required = true,
  savedSignature = "",
  onRestore,
  onForgetSaved,
  savedSignatureHint = "Tanda tangan tersimpan untuk penggunaan berikutnya.",
  inputHint = "Gunakan mouse, stylus, atau sentuhan layar",
}) {
  const canvasId = useId();
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  // Inisialisasi canvas dengan DPI scaling agar garis tajam dan tidak buram di layar Retina / mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 130;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 130;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!value) return undefined;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Hitung scaling proporsional (contain) agar tanda tangan tidak gepeng / ter-stretch
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawW = width;
        drawH = width / imgAspect;
        drawX = 0;
        drawY = (height - drawH) / 2;
      } else {
        drawH = height;
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    };
    img.src = value;

    return () => {
      img.onload = null;
    };
  }, [value]);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }
    drawingRef.current = true;
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp(e) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { }
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    onChange("");
  }

  return (
    <div className="form-group signature-field-group" style={{ marginBottom: "var(--sp-3)", maxWidth: 560 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <label
          htmlFor={canvasId}
          className="form-label"
          style={{
            margin: 0,
            fontWeight: "var(--fw-semibold)",
            fontSize: "var(--text-xs)",
          }}
        >
          {label}{" "}
          {required && (
            <span style={{ color: "var(--clr-error-500, #ef4444)" }}>*</span>
          )}
        </label>
        {value ? (
          <span
            className="badge badge-success"
            style={{
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#dcfce7",
              color: "#15803d",
            }}
          >
            <CheckCircle2 size={12} /> Tanda tangan tercatat
          </span>
        ) : (
          <span className="badge badge-gray" style={{ fontSize: "11px" }}>
            Belum ditandatangani
          </span>
        )}
      </div>

      <div
        className="signature-field__canvas-frame"
        style={{
          width: "100%",
          position: "relative",
          borderRadius: "var(--radius-lg, 10px)",
          border: "1.5px dashed var(--clr-dark-300, #cbd5e1)",
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* Garis batas panduan tanda tangan */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 28,
            borderBottom: "1px dashed #cbd5e1",
            pointerEvents: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              background: "#ffffff",
              padding: "0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Tanda Tangan di Atas Garis Ini
          </span>
          <span style={{ fontSize: "10px", color: "#94a3b8" }}>✕</span>
        </div>

        <canvas
          id={canvasId}
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: "100%",
            height: 130,
            display: "block",
            cursor: "crosshair",
            touchAction: "none",
            position: "relative",
            zIndex: 2,
          }}
          aria-label={label}
        />
      </div>

      <div
        className="signature-field__actions"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 6,
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-error"
            onClick={clear}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", fontSize: "12px" }}
          >
            <Eraser size={14} /> Hapus & Goreskan Ulang
          </button>
          {!value && savedSignature && onRestore && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onRestore}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", fontSize: "12px", color: "#0284c7" }}
            >
              Gunakan Tersimpan
            </button>
          )}
          {savedSignature && onForgetSaved && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-error"
              onClick={onForgetSaved}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", fontSize: "12px" }}
            >
              Hapus Tersimpan
            </button>
          )}
        </div>
        {inputHint && (
          <span style={{ fontSize: "11px", color: "var(--clr-dark-400, #94a3b8)" }}>
            {inputHint}
          </span>
        )}
      </div>

      {savedSignatureHint && (
        <div
          style={{ marginTop: 4, fontSize: "11px", color: "var(--clr-dark-400)" }}
        >
          {savedSignatureHint}
        </div>
      )}
    </div>
  );
}
