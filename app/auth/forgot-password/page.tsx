"use client";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("El correo es obligatorio.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://nextinfaith.com/auth/recovery",
    });

    if (err) {
      const msg = err.message?.toLowerCase() ?? "";
      if (msg.includes("rate") || msg.includes("limit") || msg.includes("security") || msg.includes("too many")) {
        setError("Ya enviamos un enlace recientemente. Espera unos minutos antes de solicitar otro.");
      } else {
        setError("Ocurrió un error. Verifica el correo e intenta de nuevo.");
      }
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%",
    border: "0.5px solid #b5d4f4",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 14,
    color: "#1a2b3c",
    background: "#fff",
    outline: "none",
    marginTop: 4,
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#4a6278",
    display: "block",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg,#c8e8fa 0%,#dff0fb 25%,#eef7fd 50%,#f7fbff 70%,#ffffff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px", fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image src="/logo_fondo_blanco.png" alt="Next In Faith" width={120} height={120} style={{ marginBottom: 16, height: "auto" }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1a2b3c", lineHeight: 1.2 }}>
            ¿Olvidaste tu contraseña?
          </div>
          <div style={{ fontSize: 14, color: "#4a6278", marginTop: 10 }}>
            Te enviaremos un enlace para restablecerla
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 24, padding: "36px 32px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(91,184,245,0.15), 0 0 0 1px rgba(91,184,245,0.12)",
        }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2b3c", marginBottom: 8 }}>
                Correo enviado
              </p>
              <p style={{ fontSize: 13, color: "#4a6278", lineHeight: 1.6, marginBottom: 24 }}>
                Si <strong>{email}</strong> tiene una cuenta, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
              </p>
              <a href="/login" style={{ color: "#185FA5", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                ← Volver al inicio de sesión
              </a>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Correo electrónico</label>
                <input
                  style={inp}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="tu@correo.com"
                />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, fontSize: 15,
                  fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  border: "none", background: loading ? "#a8d8f8" : "#e8a020",
                  color: "#fff", letterSpacing: 0.3,
                }}>
                {loading ? "Enviando..." : "Enviar enlace →"}
              </button>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#7a96aa" }}>
                <a href="/login" style={{ color: "#185FA5", fontWeight: 600, textDecoration: "none" }}>
                  ← Volver al inicio de sesión
                </a>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#7a96aa" }}>
          ¿Problemas para acceder?{" "}
          <a href="mailto:hola@nextinfaith.com" style={{ color: "#7a96aa" }}>Contáctanos</a>
        </div>
      </div>
    </div>
  );
}
