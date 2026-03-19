"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Evento = {
  id: number;
  titulo: string;
  ciudad: string;
  fecha_inicio: string;
  modalidad: string;
  costo_minimo: number;
  estado_publicacion: string;
  exposicion: string;
  categoria: { nombre: string } | null;
  organizador: { nombre: string; apellido: string } | null;
};

const BADGE_ESTADO: Record<string, { bg: string; color: string }> = {
  publicado:   { bg: "#E1F5EE", color: "#0F6E56" },
  en_revision: { bg: "#FAEEDA", color: "#854F0B" },
  borrador:    { bg: "#F1EFE8", color: "#5F5E5A" },
  rechazado:   { bg: "#FCEBEB", color: "#A32D2D" },
  cancelado:   { bg: "#F1EFE8", color: "#888780" },
};

const BADGE_EXPO: Record<string, { bg: string; color: string }> = {
  completa: { bg: "#dff0fb", color: "#185FA5" },
  basica:   { bg: "#F1EFE8", color: "#5F5E5A" },
};

function Badge({ value, map }: { value: string; map: Record<string, { bg: string; color: string }> }) {
  const style = map[value] ?? { bg: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
      background: style.bg, color: style.color,
    }}>
      {value.replace("_", " ")}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroExpo, setFiltroExpo] = useState("");
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    const cerrar = () => setMenuAbierto(null);
    document.addEventListener("click", cerrar);
    return () => document.removeEventListener("click", cerrar);
  }, []);

  const cargarEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("eventos")
      .select(`
        id, titulo, ciudad, fecha_inicio, modalidad, costo_minimo,
        estado_publicacion, exposicion,
        categorias ( nombre ),
        profiles ( nombre, apellido )
      `)
      .order("fecha_inicio", { ascending: true });

    if (!error && data) {
      const mapped = data.map((e: any) => ({
        ...e,
        categoria: e.categorias ?? null,
        organizador: e.profiles ?? null,
      }));
      setEventos(mapped);
    }
    setLoading(false);
  };

  const eventosFiltrados = eventos.filter((e) => {
    const okEstado = !filtroEstado || e.estado_publicacion === filtroEstado;
    const okExpo = !filtroExpo || e.exposicion === filtroExpo;
    return okEstado && okExpo;
  });

  const formatFecha = (fecha: string) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  };

  const accionEvento = async (id: number, accion: string) => {
    setMenuAbierto(null);
    if (accion === "ver") {
      router.push(`/portal/dashboard/eventos/${id}`);
      return;
    }
    if (accion === "aprobar") {
      await supabase.from("eventos").update({ estado_publicacion: "publicado" }).eq("id", id);
    }
    if (accion === "rechazar") {
      await supabase.from("eventos").update({ estado_publicacion: "rechazado" }).eq("id", id);
    }
    if (accion === "basica") {
      await supabase.from("eventos").update({ exposicion: "basica" }).eq("id", id);
    }
    if (accion === "completa") {
      await supabase.from("eventos").update({ exposicion: "completa" }).eq("id", id);
    }
    await cargarEventos();
  };

  const col = (w: string): React.CSSProperties => ({
    padding: "10px 12px", fontSize: 12, color: "#1a2b3c",
    borderBottom: "0.5px solid #e8f0f8", verticalAlign: "middle",
    width, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  });

  const th = (w: string): React.CSSProperties => ({
    padding: "9px 12px", fontSize: 11, fontWeight: 500, color: "#4a6278",
    background: "#f5f9fd", borderBottom: "0.5px solid #c8d8e8",
    textAlign: "left", width,
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: "#1a2b3c" }}>Eventos</span>
        <button
          onClick={() => router.push("/portal/dashboard/eventos/nuevo")}
          style={{ background: "#1a3a6b", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
          + Nuevo evento
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ fontSize: 12, padding: "5px 8px", border: "0.5px solid #c8d8e8", borderRadius: 8, background: "#fff", color: "#1a2b3c", cursor: "pointer" }}>
          <option value="">Todos los estados</option>
          <option value="publicado">Publicado</option>
          <option value="en_revision">En revisión</option>
          <option value="borrador">Borrador</option>
          <option value="rechazado">Rechazado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select value={filtroExpo} onChange={(e) => setFiltroExpo(e.target.value)}
          style={{ fontSize: 12, padding: "5px 8px", border: "0.5px solid #c8d8e8", borderRadius: 8, background: "#fff", color: "#1a2b3c", cursor: "pointer" }}>
          <option value="">Toda exposición</option>
          <option value="completa">Completa</option>
          <option value="basica">Básica</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", border: "0.5px solid #c8d8e8", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#4a6278" }}>Cargando eventos...</div>
        ) : eventosFiltrados.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#4a6278" }}>No hay eventos que coincidan con los filtros.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={th("22%")}>Título</th>
                <th style={th("13%")}>Categoría</th>
                <th style={th("10%")}>Ciudad</th>
                <th style={th("11%")}>Fecha inicio</th>
                <th style={th("14%")}>Organizador</th>
                <th style={th("10%")}>Exposición</th>
                <th style={th("12%")}>Estado</th>
                <th style={{ ...th("8%"), textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventosFiltrados.map((e) => (
                <tr key={e.id}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "#f5f9fd")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                  <td style={{ ...col("22%"), fontWeight: 500 }} title={e.titulo}>{e.titulo}</td>
                  <td style={col("13%")}>{e.categoria?.nombre ?? "—"}</td>
                  <td style={col("10%")}>{e.ciudad}</td>
                  <td style={col("11%")}>{formatFecha(e.fecha_inicio)}</td>
                  <td style={col("14%")} title={e.organizador ? `${e.organizador.nombre} ${e.organizador.apellido}` : "—"}>
                    {e.organizador ? `${e.organizador.nombre} ${e.organizador.apellido}` : "—"}
                  </td>
                  <td style={col("10%")}>
                    <Badge value={e.exposicion ?? "basica"} map={BADGE_EXPO} />
                  </td>
                  <td style={col("12%")}>
                    <Badge value={e.estado_publicacion} map={BADGE_ESTADO} />
                  </td>
                  <td style={{ ...col("8%"), textAlign: "center", position: "relative" }}>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); setMenuAbierto(menuAbierto === e.id ? null : e.id); }}
                      style={{ background: "none", border: "0.5px solid #c8d8e8", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 14, color: "#4a6278" }}>
                      ⋯
                    </button>
                    {menuAbierto === e.id && (
                      <div style={{
                        position: "absolute", right: 8, top: 32, background: "#fff",
                        border: "0.5px solid #c8d8e8", borderRadius: 8, zIndex: 10,
                        minWidth: 160, boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                      }} onClick={(ev) => ev.stopPropagation()}>
                        {[
                          { key: "ver", label: "Ver detalle" },
                          { key: "aprobar", label: "Aprobar" },
                          { key: "rechazar", label: "Rechazar" },
                          { key: "completa", label: "Exposición completa" },
                          { key: "basica", label: "Exposición básica" },
                        ].map((a) => (
                          <div key={a.key}
                            onClick={() => accionEvento(e.id, a.key)}
                            style={{
                              padding: "8px 12px", fontSize: 12, cursor: "pointer",
                              color: a.key === "rechazar" ? "#A32D2D" : "#1a2b3c"
                            }}
                            onMouseEnter={(ev) => (ev.currentTarget.style.background = "#f5f9fd")}
                            onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                            {a.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
