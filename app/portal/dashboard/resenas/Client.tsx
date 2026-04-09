"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Resena = {
  id: number;
  calificacion: number;
  comentario: string | null;
  estado: string;
  created_at: string;
  evento_id: number;
  eventos: { titulo: string } | null;
  profiles: { nombre: string | null; apellido: string | null } | null;
};

export default function ResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"pendiente" | "aprobada" | "rechazada">("pendiente");
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("resenas")
      .select("id, calificacion, comentario, estado, created_at, evento_id, eventos(titulo), profiles!resenas_user_id_fkey(nombre, apellido)")
      .eq("estado", filtro)
      .order("created_at", { ascending: false });
    setResenas((data as any) ?? []);
    setLoading(false);
  }, [filtro]);

  useEffect(() => { cargar(); }, [filtro, cargar]);

  const cambiarEstado = async (id: number, nuevoEstado: "aprobada" | "rechazada") => {
    setProcesando(id);
    await supabase.from("resenas").update({ estado: nuevoEstado }).eq("id", id);
    setResenas(prev => prev.filter(r => r.id !== id));
    setProcesando(null);
  };

  const ESTRELLAS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  const FILTROS: { key: "pendiente" | "aprobada" | "rechazada"; label: string; color: string }[] = [
    { key: "pendiente", label: "Pendientes", color: "#e8a020" },
    { key: "aprobada", label: "Aprobadas", color: "#0F6E56" },
    { key: "rechazada", label: "Rechazadas", color: "#A32D2D" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#1a2b3c" }}>Reseñas</div>
        <div style={{ fontSize: 12, color: "#7a9ab0", marginTop: 2 }}>Modera las reseñas enviadas por usuarios</div>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {FILTROS.map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)} style={{
            padding: "7px 18px", borderRadius: 99, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: `1px solid ${f.color}`,
            background: filtro === f.key ? f.color : "#fff",
            color: filtro === f.key ? "#fff" : f.color,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#4a6278", fontSize: 14, padding: 40 }}>Cargando...</div>
      ) : resenas.length === 0 ? (
        <div style={{ textAlign: "center", color: "#7a96aa", fontSize: 14, padding: 60 }}>
          No hay reseñas {filtro === "pendiente" ? "pendientes" : filtro === "aprobada" ? "aprobadas" : "rechazadas"}.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {resenas.map(r => (
            <div key={r.id} style={{
              background: "#fff", borderRadius: 12, border: "0.5px solid #c8d8e8", padding: "16px 20px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  {/* Evento */}
                  <div style={{ fontSize: 11, color: "#4aa8d8", fontWeight: 600, marginBottom: 4 }}>
                    {(r.eventos as any)?.titulo ?? `Evento #${r.evento_id}`}
                  </div>
                  {/* Usuario y calificación */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2b3c" }}>
                      {(r.profiles as any)?.nombre ?? "Usuario"} {(r.profiles as any)?.apellido ?? ""}
                    </span>
                    <span style={{ color: "#e8a020", fontSize: 13 }}>{ESTRELLAS(r.calificacion)}</span>
                  </div>
                  {/* Comentario */}
                  {r.comentario && (
                    <p style={{ fontSize: 13, color: "#4a6278", lineHeight: 1.6, margin: 0 }}>{r.comentario}</p>
                  )}
                  <div style={{ fontSize: 11, color: "#7a96aa", marginTop: 8 }}>
                    {new Date(r.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>

                {/* ACCIONES */}
                {filtro === "pendiente" && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => cambiarEstado(r.id, "aprobada")}
                      disabled={procesando === r.id}
                      style={{
                        padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", border: "none", background: "#0F6E56", color: "#fff",
                        opacity: procesando === r.id ? 0.6 : 1,
                      }}>
                      Aprobar
                    </button>
                    <button
                      onClick={() => cambiarEstado(r.id, "rechazada")}
                      disabled={procesando === r.id}
                      style={{
                        padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                        cursor: "pointer", border: "none", background: "#A32D2D", color: "#fff",
                        opacity: procesando === r.id ? 0.6 : 1,
                      }}>
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
