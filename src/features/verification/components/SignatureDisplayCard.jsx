// Komponen kartu tampilan tanda tangan resmi untuk modal rincian & persetujuan
export default function SignatureDisplayCard({
  title,
  roleLabel,
  signature,
  signerName,
  signerNip,
  signedAt,
}) {
  const isSigned = Boolean(signature);
  return (
    <div
      className="verification-signature-card"
      style={{
        border: "1px solid var(--clr-dark-200, #e2e8f0)",
        borderRadius: "var(--radius-lg, 10px)",
        background: "var(--clr-dark-50, #f8fafc)",
        padding: "var(--sp-4)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--clr-dark-600)",
          }}
        >
          {title}
        </span>
        <span
          className={`badge ${isSigned ? "badge-aktif" : "badge-gray"}`}
          style={{ fontSize: "11px" }}
        >
          {isSigned ? "Terverifikasi Digital" : "Belum Ditandatangani"}
        </span>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: "var(--radius-md, 6px)",
          border: "1px solid var(--clr-dark-200, #e2e8f0)",
          minHeight: 85,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 6,
          marginBottom: 8,
        }}
      >
        {isSigned ? (
          <img
            src={signature}
            alt={title}
            style={{
              maxHeight: 70,
              maxWidth: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "12px",
              color: "var(--clr-dark-400)",
              fontStyle: "italic",
            }}
          >
            Menunggu tanda tangan digital...
          </span>
        )}
      </div>

      <div
        style={{
          borderTop: "1px dashed var(--clr-dark-200, #e2e8f0)",
          paddingTop: 6,
        }}
      >
        <div
          style={{
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--text-xs)",
            color: "var(--clr-dark-900)",
          }}
        >
          {signerName || "-"}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--clr-dark-500)",
            marginTop: 1,
          }}
        >
          {signerNip || roleLabel || "-"}
        </div>
        {signedAt && (
          <div
            style={{
              fontSize: "10px",
              color: "var(--clr-dark-400)",
              marginTop: 2,
            }}
          >
            Tgl: {new Date(signedAt).toLocaleString("id-ID")}
          </div>
        )}
      </div>
    </div>
  );
}


