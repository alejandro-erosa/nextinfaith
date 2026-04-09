"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";

  export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("message") === "password-updated") {
      setSuccessMsg("Contraseña actualizada. Ya puedes iniciar sesión.");
    }
  }, []);


  const handleLogin = async () => {
    if (!email.trim()) { setError("El correo es obligatorio."); return; }
    if (!password) { setError("La contraseña es obligatoria."); return; }
    setLoading(true); setError("");

    const { data, error: errLogin } = await supabase.auth.signInWithPassword({ email, password });
    if (errLogin || !data.user) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false); return;
    }

    const userId = data.user.id;

    const { data: perfil } = await supabase
      .from("profiles")
      .select("cambio_clave")
      .eq("id", userId)
      .single();

    if (perfil?.cambio_clave === true) {
      window.location.href = "/portal/cambio-clave";
      return;
    }

    const { data: rolData } = await supabase
      .from("user_roles")
      .select("roles(nombre)")
      .eq("user_id", userId)
      .single();

    const rol = (rolData?.roles as any)?.nombre ?? "usuario";
    const rolesInternos = ["super_admin", "admin", "editor", "moderador", "corresponsal", "influencer"];
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");

    if (rolesInternos.includes(rol)) {
      window.location.href = "/portal/dashboard";
    } else {
      window.location.href = returnTo ?? "/";
    }

    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%", border: "0.5px solid #b5d4f4", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, color: "#1a2b3c",
    background: "#fff", outline: "none", marginTop: 4,
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#4a6278", display: "block",
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
            Bienvenido de vuelta
          </div>
          <div style={{ fontSize: 14, color: "#4a6278", marginTop: 10 }}>
            Ingresa para ver eventos y dejar tu reseña
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 24, padding: "36px 32px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(91,184,245,0.15), 0 0 0 1px rgba(91,184,245,0.12)",
        }}>
          <div style={{ marginBottom: 16, boxSizing: "border-box" }}>
            <label style={lbl}>Correo electrónico</label>
            <input
              style={inp} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Contraseña</label>
            <div style={{ position: "relative" , width: "100%"}}>
              <input
                style={{ ...inp, paddingRight: 40, boxSizing: "border-box"  }}
                type={verPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
              />
              <button
                onClick={() => setVerPassword(!verPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#7a96aa", padding: 0 }}>
                {verPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {successMsg && (
            <div style={{ padding: "10px 14px", background: "#EBF7EB", border: "0.5px solid #7bc97b", borderRadius: 8, fontSize: 13, color: "#1e6b1e", marginBottom: 16 }}>
              {successMsg}
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, fontSize: 15,
              fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              border: "none", background: loading ? "#a8d8f8" : "#e8a020",
              color: "#fff", letterSpacing: 0.3,
            }}>
            {loading ? "Entrando..." : "Entrar →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13 }}>
            <a href="/auth/forgot-password" style={{ color: "#185FA5", fontWeight: 600, textDecoration: "none" }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#7a96aa" }}>
            ¿No tienes cuenta?{" "}
            <a href="/registro" style={{ color: "#185FA5", fontWeight: 600, textDecoration: "none" }}>
              Regístrate gratis
            </a>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#7a96aa" }}>
          ¿Problemas para acceder?{" "}
          <a href="mailto:hola@nextinfaith.com" style={{ color: "#7a96aa" }}>Contáctanos</a>
        </div>
      </div>
    </div>
  );
}
