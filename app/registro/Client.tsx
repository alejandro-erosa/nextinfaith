"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [edad, setEdad] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  const handleRegistro = async () => {
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (!apellido.trim()) { setError("Los apellidos son obligatorios."); return; }
    if (!edad || isNaN(Number(edad))) { setError("La edad es obligatoria."); return; }
    if (!email.trim()) { setError("El correo es obligatorio."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }

    setSaving(true); setError("");

    const { data, error: errAuth } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (errAuth || !data.user) {
      setError(errAuth?.message ?? "Error al crear la cuenta.");
      setSaving(false); return;
    }

    const userId = data.user.id;

    await supabase.from("profiles").upsert({
      id: userId,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      fecha_nacimiento: null,
      activo: true,
      cambio_clave: false,
      requiere_aprobacion: true,
    });

    await supabase.from("user_roles").insert({
      user_id: userId,
      rol_id: 6,
      asignado_por: userId,
    });

    setSaving(false);
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo");
    router.push(returnTo ?? "/");
  };

  const inp: React.CSSProperties = {
    width: "100%", border: "0.5px solid #b5d4f4", borderRadius: 10,
    padding: "11px 14px", fontSize: 14, color: "#1a2b3c",
    background: "#fff", outline: "none", marginTop: 4,
    boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#4a6278",
    display: "block", marginBottom: 2,
  };
  const field: React.CSSProperties = { marginBottom: 16 };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg,#c8e8fa 0%,#dff0fb 25%,#eef7fd 50%,#f7fbff 70%,#ffffff 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px", fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo_fondo_blanco.png" alt="Next In Faith" style={{ width: 120, marginBottom: 16 }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1a2b3c", lineHeight: 1.2 }}>
            Entérate primero de los<br />
            <span style={{ color: "#5bb8f5", fontStyle: "italic" }}>eventos católicos</span>
          </div>
          <div style={{ fontSize: 14, color: "#4a6278", marginTop: 10 }}>
            Crea tu cuenta y no te pierdas nada
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 24, padding: "36px 32px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(91,184,245,0.15), 0 0 0 1px rgba(91,184,245,0.12)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
            <div style={field}>
              <label style={lbl}>Nombre(s)</label>
              <input style={inp} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div style={field}>
              <label style={lbl}>Apellidos</label>
              <input style={inp} value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Tus apellidos" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={field}>
              <label style={lbl}>Edad</label>
              <input style={inp} type="number" min={1} max={99} value={edad} onChange={e => setEdad(e.target.value)} placeholder="Tu edad" />
            </div>
            <div style={field}>
              <label style={lbl}>Celular (opcional)</label>
              <input style={inp} type="tel" value={celular} onChange={e => setCelular(e.target.value)} placeholder="10 dígitos" />
            </div>
          </div>

          <div style={field}>
            <label style={lbl}>Correo electrónico</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>

          <div style={field}>
            <label style={lbl}>Contraseña</label>
            <div style={{ position: "relative" , width: "100%"}}>
              <input
                style={{ ...inp, paddingRight: 40 }}
                type={verPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                onClick={() => setVerPassword(!verPassword)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#7a96aa", padding: 0 }}>
                {verPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleRegistro}
            disabled={saving}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, fontSize: 15,
              fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              border: "none", background: saving ? "#a8d8f8" : "#5bb8f5",
              color: "#fff", letterSpacing: 0.3, marginTop: 4,
            }}>
            {saving ? "Creando cuenta..." : "Crear mi cuenta →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#7a96aa" }}>
            ¿Ya tienes cuenta?{" "}
            <a href="/login" style={{ color: "#185FA5", fontWeight: 600, textDecoration: "none" }}>
              Inicia sesión
            </a>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#7a96aa" }}>
          Sin spam. Solo eventos católicos que importan.
        </div>
      </div>
    </div>
  );
}
