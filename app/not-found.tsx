export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", background: "#f0f6fb" }}>
      <h1 style={{ fontSize: 80, fontWeight: 700, color: "#1a3a6b", margin: 0 }}>404</h1>
      <p style={{ fontSize: 18, color: "#7a96aa", marginTop: 8, marginBottom: 32 }}>Página no encontrada</p>
      <a href="/" style={{ background: "#1a3a6b", color: "#fff", padding: "12px 28px", borderRadius: 99, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
        Volver al inicio
      </a>
    </main>
  );
}
