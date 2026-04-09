"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabase";

type Evento = {
  id: number;
  titulo: string;
  ciudades: { nombre: string } | null;
  fecha_inicio: string;
  modalidades: { clave: string } | null;
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

  const [busqueda, setBusqueda] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroExpo, setFiltroExpo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    cargarEventos();
  }, []);

  useEffect(() => {
    const cerrar = () => { setMenuAbierto(null); setMenuPos(null); };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  const cargarEventos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("eventos")
      .select(`
        id, titulo, ciudad_id, ciudades(nombre), fecha_inicio, modalidad_id, modalidades(clave), costo_minimo,
        estado_publicacion, exposicion,
        categorias ( nombre ),
        profiles!organizador_id ( nombre, apellido )
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
    const texto = busqueda.toLowerCase();
    const ciudadNombre = e.ciudades?.nombre ?? "";
    const okBusqueda = !busqueda ||
      e.titulo.toLowerCase().includes(texto) ||
      ciudadNombre.toLowerCase().includes(texto);
    const okCiudad = !filtroCiudad ||
      ciudadNombre.toLowerCase().includes(filtroCiudad.toLowerCase());
    const okEstado = !filtroEstado || e.estado_publicacion === filtroEstado;
    const okExpo = !filtroExpo || e.exposicion === filtroExpo;
    const okDesde = !fechaDesde || (e.fecha_inicio && e.fecha_inicio >= fechaDesde);
    const okHasta = !fechaHasta || (e.fecha_inicio && e.fecha_inicio <= fechaHasta);
    return okBusqueda && okCiudad && okEstado && okExpo && okDesde && okHasta;
  });

  const limpiarFiltros = () => {
    setBusqueda(""); setFiltroCiudad(""); setFiltroEstado("");
    setFiltroExpo(""); setFechaDesde(""); setFechaHasta("");
  };

  const hayFiltrosActivos = busqueda || filtroCiudad || filtroEstado || filtroExpo || fechaDesde || fechaHasta;

  const formatFecha = (fecha: string) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  };

  const accionEvento = async (id: number, accion: string) => {
    setMenuAbierto(null);
    setMenuPos(null);
    if (accion === "editar") { router.push(`/portal/dashboard/eventos/${id}/editar`); return; }
    if (accion === "ver") { router.push(`/portal/dashboard/eventos/${id}`); return; }
    if (accion === "aprobar") await supabase.from("eventos").update({ estado_publicacion: "publicado" }).eq("id", id);
    if (accion === "rechazar") await supabase.from("eventos").update({ estado_publicacion: "rechazado" }).eq("id", id);
    if (accion === "basica") await supabase.from("eventos").update({ exposicion: "basica" }).eq("id", id);
    if (accion === "completa") await supabase.from("eventos").update({ exposicion: "completa" }).eq("id", id);
    await cargarEventos();
  };

  const inp: React.CSSProperties = {
    fontSize: 12, padding: "5px 8px", border: "0.5px solid #c8d8e8",
    borderRadius: 8, background: "#fff", color: "#1a2b3c", outline: "none",
  };

  const cols = ["22%", "13%", "10%", "11%", "14%", "10%", "12%", "8%"];
  const colHeaders = ["Título", "Categoría", "Ciudad", "Fecha inicio", "Capturado por", "Exposición", "Estado", "Acciones"];

  const cellStyle = (i: number, extra?: React.CSSProperties): React.CSSProperties => ({
    width: cols[i], minWidth: 0, padding: "10px 12px", fontSize: 12, color: "#1a2b3c",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    display: "flex", alignItems: "center",
    ...extra,
  });

  const headerCellStyle = (i: number): React.CSSProperties => ({
    width: cols[i], minWidth: 0, padding: "9px 12px",
    fontSize: 11, fontWeight: 500, color: "#4a6278",
    overflow: "hidden", whiteSpace: "nowrap",
    display: "flex", alignItems: "center",
    ...(i === 7 ? { justifyContent: "center" } : {}),
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: "#1a2b3c" }}>Eventos</span>
        <button
          onClick={() => router.push("/portal/dashboard/eventos/nuevo")}
          style={{ background: "#1a3a6b", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
          + Nuevo evento
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ background: "#fff", border: "0.5px solid #c8d8e8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: "#7a9ab0", display: "block", marginBottom: 4 }}>Buscar por nombre</label>
            <input style={{ ...inp, width: "100%" }} placeholder="Nombre del evento..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7a9ab0", display: "block", marginBottom: 4 }}>Ciudad</label>
            <input style={{ ...inp, width: "100%" }} placeholder="Ciudad..."
              value={filtroCiudad} onChange={e => setFiltroCiudad(e.target.value)} list="ciudades-list" />
            <datalist id="ciudades-list">
              {[...new Set(eventos.map(e => e.ciudades?.nombre).filter(Boolean))].sort().map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 11, color: "#7a9ab0", display: "block", marginBottom: 4 }}>Fecha desde</label>
            <input type="date" style={inp} value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7a9ab0", display: "block", marginBottom: 4 }}>Fecha hasta</label>
            <input type="date" style={inp} value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7a9ab0", display: "block", marginBottom: 4 }}>Estado</label>
            <select style={{ ...inp, cursor: "pointer" }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="publicado">Publicado</option>
              <option value="en_revision">En revisión</option>
              <option value="borrador">Borrador</option>
              <option value="rechazado">Rechazado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#7a9ab0", display: "block", marginBottom: 4 }}>Exposición</label>
            <select style={{ ...inp, cursor: "pointer" }} value={filtroExpo} onChange={e => setFiltroExpo(e.target.value)}>
              <option value="">Todas</option>
              <option value="completa">Completa</option>
              <option value="basica">Básica</option>
            </select>
          </div>
          {hayFiltrosActivos && (
            <button onClick={limpiarFiltros}
              style={{ ...inp, cursor: "pointer", color: "#A32D2D", border: "0.5px solid #F09595", background: "#FCEBEB", alignSelf: "flex-end" }}>
              Limpiar filtros
            </button>
          )}
          <div style={{ marginLeft: "auto", alignSelf: "flex-end", fontSize: 12, color: "#7a9ab0" }}>
            {eventosFiltrados.length} de {eventos.length} eventos
          </div>
        </div>
      </div>

      {/* Listado */}
      <div style={{ background: "#fff", border: "0.5px solid #c8d8e8", borderRadius: 12 }}>

        {/* Header */}
        <div style={{ display: "flex", background: "#f5f9fd", borderBottom: "0.5px solid #c8d8e8", borderRadius: "12px 12px 0 0" }}>
          {colHeaders.map((h, i) => (
            <div key={i} style={headerCellStyle(i)}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#4a6278" }}>Cargando eventos...</div>
        ) : eventosFiltrados.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#4a6278" }}>
            No hay eventos que coincidan con los filtros.
            {hayFiltrosActivos && (
              <span style={{ color: "#1a6b8c", cursor: "pointer", marginLeft: 8 }} onClick={limpiarFiltros}>
                Limpiar filtros
              </span>
            )}
          </div>
        ) : (
          eventosFiltrados.map((e, idx) => (
            <div key={e.id}
              style={{
                display: "flex", alignItems: "stretch",
                borderBottom: idx === eventosFiltrados.length - 1 ? "none" : "0.5px solid #e8f0f8",
                cursor: "pointer",
                borderRadius: idx === eventosFiltrados.length - 1 ? "0 0 12px 12px" : undefined,
              }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "#f5f9fd")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>

              <div style={{ ...cellStyle(0), fontWeight: 500 }} title={e.titulo}>{e.titulo}</div>
              <div style={cellStyle(1)}>{e.categoria?.nombre ?? "—"}</div>
              <div style={cellStyle(2)}>{e.ciudades?.nombre ?? "—"}</div>
              <div style={cellStyle(3)}>{formatFecha(e.fecha_inicio)}</div>
              <div style={cellStyle(4)} title={e.organizador ? `${e.organizador.nombre} ${e.organizador.apellido}` : "—"}>
                {e.organizador ? `${e.organizador.nombre} ${e.organizador.apellido}` : "—"}
              </div>
              <div style={cellStyle(5)}>
                <Badge value={e.exposicion ?? "basica"} map={BADGE_EXPO} />
              </div>
              <div style={cellStyle(6)}>
                <Badge value={e.estado_publicacion} map={BADGE_ESTADO} />
              </div>
              <div style={{ ...cellStyle(7), justifyContent: "center" }}>
                <button
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                    setMenuAbierto(menuAbierto === e.id ? null : e.id);
                  }}
                  style={{ background: "none", border: "0.5px solid #c8d8e8", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 14, color: "#4a6278" }}>
                  ⋯
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Portal — menú fuera del árbol DOM para evitar clipping */}
      {mounted && menuAbierto !== null && menuPos && createPortal(
        <div
          onMouseDown={(ev) => ev.stopPropagation()}
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            background: "#fff",
            border: "0.5px solid #c8d8e8",
            borderRadius: 8,
            zIndex: 9999,
            minWidth: 160,
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}>
          {[
            { key: "editar", label: "Editar evento" },
            { key: "ver", label: "Ver detalle" },
            { key: "aprobar", label: "Aprobar" },
            { key: "rechazar", label: "Rechazar" },
            { key: "completa", label: "Exposición completa" },
            { key: "basica", label: "Exposición básica" },
          ].map((a) => (
            <div key={a.key}
              onClick={() => accionEvento(menuAbierto, a.key)}
              style={{
                padding: "8px 12px", fontSize: 12, cursor: "pointer",
                color: a.key === "rechazar" ? "#A32D2D" : "#1a2b3c",
              }}
              onMouseEnter={(ev) => (ev.currentTarget.style.background = "#f5f9fd")}
              onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
              {a.label}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
