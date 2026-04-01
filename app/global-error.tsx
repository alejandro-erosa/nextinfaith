"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", background: "#f0f6fb", margin: 0 }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: "#1a3a6b", margin: 0 }}>Algo salió mal</h1>
        <p style={{ fontSize: 16, color: "#7a96aa", marginTop: 8, marginBottom: 24 }}>Ocurrió un error inesperado.</p>
        <button onClick={reset} style={{ background: "#1a3a6b", color: "#fff", padding: "12px 28px", borderRadius: 99, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
          Intentar de nuevo
        </button>
      </body>
    </html>
  );
}
