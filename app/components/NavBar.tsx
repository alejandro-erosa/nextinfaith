"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { authGetUser, authSignOut } from "../context/UserContext";

export default function NavBar() {
  const router = useRouter();
  const [usuarioNombre, setUsuarioNombre] = useState<string | null>(null);
  const [rolId, setRolId] = useState<number | null>(null);

  useEffect(() => {
    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    const { data: { user } } = await authGetUser();
    if (!user) return;
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", user.id)
      .single();
    if (perfil?.nombre) setUsuarioNombre(perfil.nombre);
    const { data: rol } = await supabase
      .from("user_roles")
      .select("rol_id")
      .eq("user_id", user.id)
      .single();
    if (rol?.rol_id) setRolId(rol.rol_id);
  };

  const handleLogout = async () => {
    await authSignOut();
    setUsuarioNombre(null);
    setRolId(null);
    router.push("/");
  };

  const esInterno = rolId !== null && rolId >= 1 && rolId <= 5;

  return (
    <nav style={{
      position: "fixed", top: 0, width: "100%", zIndex: 100,
      background: "#fff",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      borderBottom: "0.5px solid #e0e8f0",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Image src="/logo_negro.png" alt="Next In Faith" width={120} height={48} style={{ objectFit: "contain" }} />
        </a>

        {/* Links y acciones */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/" style={{ fontSize: 13, color: "#1a3a6b", textDecoration: "none", fontWeight: 600 }}>Inicio</a>
          <a href="/buscar" style={{ fontSize: 13, color: "#1a3a6b", textDecoration: "none", fontWeight: 600 }}>Eventos</a>

          {usuarioNombre ? (
            <>
              {esInterno && (
                <a href="/portal/dashboard" style={{ fontSize: 13, color: "#1a3a6b", textDecoration: "none", fontWeight: 600 }}>
                  Mi Dashboard
                </a>
              )}
              <span style={{ fontSize: 13, color: "#4a6278" }}>Hola, {usuarioNombre}</span>
              <button onClick={handleLogout} style={{
                fontSize: 13, color: "#fff", background: "#1a3a6b",
                border: "none", borderRadius: 99, padding: "7px 16px",
                cursor: "pointer", fontWeight: 600
              }}>
                Salir
              </button>
            </>
          ) : (
            <>
              <a href="/login" style={{ fontSize: 13, color: "#1a3a6b", textDecoration: "none", fontWeight: 600 }}>
                Iniciar sesión
              </a>
              <a href="/registro" style={{
                fontSize: 13, background: "#e8a020", color: "#fff",
                padding: "7px 18px", borderRadius: 99, textDecoration: "none", fontWeight: 700
              }}>
                Regístrate
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}