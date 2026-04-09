"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function RecoveryPage() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = searchParams?.get("token");
    const type = searchParams?.get("type");

    if (!token || type !== "recovery") {
      setError("Enlace de recuperación inválido o expirado.");
      setVerifying(false);
      return;
    }

    supabase.auth
      .verifyOtp({ token, type: "recovery", email: "" })
      .then(({ error: err }) => {
        if (err) {
          setError("El enlace expiró o ya fue usado. Solicita uno nuevo.");
        } else {
          setVerified(true);
        }
        setVerifying(false);
      });
  }, [searchParams]);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError("Error al actualizar la contraseña. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    window.location.href = "/login?message=password-updated";
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
          <img src="/logo_fondo_blanco.png" alt="Next In Faith" style={{ width: 120, marginBottom: 16 }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1a2b3c", lineHeight: 1.2 }}>
            Nueva contraseña
          </div>
          <div style={{ fontSize: 14, color: "#4a6278", marginTop: 10 }}>
            Establece una nueva contraseña para tu cuenta
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 24, padding: "36px 32px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(91,184,245,0.15), 0 0 0 1px rgba(91,184,245,0.12)",
        }}>
          {verifying && (
            <p style={{ textAlign: "center", color: "#4a6278", fontSize: 14 }}>
              Verificando enlace...
            </p>
          )}

          {!verifying && error && !verified && (
            <>
              <div style={{ padding: "10px 14px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>
                {error}
              </div>
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <a href="/auth/forgot-password" style={{ color: "#185FA5", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                  Solicitar nuevo enlace
                </a>
              </div>
            </>
          )}

          {!verifying && verified && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Nueva contraseña</label>
                <input
                  style={inp}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Confirmar contraseña</label>
                <input
                  style={inp}
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="Repite la contraseña"
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
                {loading ? "Guardando..." : "Establecer contraseña →"}
              </button>
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
