"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { authGetUser, authSignIn, authUpdatePassword } from "../../context/UserContext";

export default function CambioClavePage() {
  const router = useRouter();
  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [claveConfirm, setClaveConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validar = () => {
    if (!claveActual) return "Ingresa tu clave actual.";
    if (claveNueva.length < 8) return "La clave nueva debe tener al menos 8 caracteres.";
    if (claveNueva === claveActual) return "La clave nueva debe ser diferente a la actual.";
    if (claveNueva !== claveConfirm) return "Las claves nuevas no coinciden.";
    return "";
  };

  const handleCambio = async () => {
    const errMsg = validar();
    if (errMsg) { setError(errMsg); return; }

    setLoading(true);
    setError("");

    // 1. Verificar sesión activa
    const { data: { user } } = await authGetUser();
    if (!user) { router.push("/portal"); return; }

    // 2. Re-autenticar con clave actual para verificarla
    const { error: errLogin } = await authSignIn(user.email!, claveActual);

    if (errLogin) {
      setError("La clave actual es incorrecta.");
      setLoading(false);
      return;
    }

    // 3. Actualizar clave
    const { error: errUpdate } = await authUpdatePassword(claveNueva);

    if (errUpdate) {
      setError("Error al actualizar la clave. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // 4. Marcar cambio_clave = false en profiles
    await supabase
      .from("profiles")
      .update({ cambio_clave: false })
      .eq("id", user.id);

    // 5. Redirigir al dashboard
    router.push("/portal/dashboard");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #e0e8f0",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    color: "#1a2b3c",
    outline: "none",
    marginTop: 4,
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(170deg, #1a3a6b 0%, #1a6b8c 40%, #4aa8d8 100%)",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "40px 40px",
        width: "100%",
        maxWidth: 420,
        margin: "0 24px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Image src="/logo_transparente.png" alt="Next In Faith" width={80} height={80} />
        </div>

        {/* Título */}
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#1a3a6b", textAlign: "center", marginBottom: 6 }}>
          Cambio de clave requerido
        </h1>
        <p style={{ fontSize: 13, color: "#4a6278", textAlign: "center", marginBottom: 28, lineHeight: 1.5 }}>
          Por seguridad debes establecer una clave personal antes de continuar.
        </p>

        {/* Formulario */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#1a3a6b" }}>Clave actual</label>
            <input
              type="password"
              placeholder="••••••••"
              value={claveActual}
              onChange={(e) => setClaveActual(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#1a3a6b" }}>Clave nueva</label>
            <input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={claveNueva}
              onChange={(e) => setClaveNueva(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#1a3a6b" }}>Confirmar clave nueva</label>
            <input
              type="password"
              placeholder="Repite la clave nueva"
              value={claveConfirm}
              onChange={(e) => setClaveConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCambio()}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: "#FCEBEB", border: "0.5px solid #F09595",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#A32D2D"
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleCambio}
            disabled={loading}
            style={{
              width: "100%",
              background: "#1a3a6b",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "13px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}>
            {loading ? "Actualizando..." : "Establecer nueva clave"}
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#7a9ab0", textAlign: "center", marginTop: 20 }}>
          ¿Problemas? Contacta al administrador del sistema.
        </p>
      </div>
    </main>
  );
}
