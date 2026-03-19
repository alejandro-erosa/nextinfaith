"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const CATEGORIAS = [
  { id: 1, nombre: "Retiros" },
  { id: 2, nombre: "Conciertos y Alabanza" },
  { id: 3, nombre: "Conferencias" },
  { id: 4, nombre: "Peregrinaciones" },
  { id: 5, nombre: "Eventos Juveniles" },
  { id: 6, nombre: "Eventos Masivos" },
];

type Fecha = { fecha: string; hora_inicio: string; hora_fin: string; ciudad: string; estado: string; venue: string };

const fechaVacia = (): Fecha => ({ fecha: "", hora_inicio: "", hora_fin: "", ciudad: "", estado: "", venue: "" });

export default function NuevoEventoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Campos base
  const [titulo, setTitulo] = useState("Concierto Martín Valverde — Gira 2026");
  const [descripcion, setDescripcion] = useState("Concierto del cantautor católico Martín Valverde como parte de su gira conmemorativa por 45 años de trayectoria en la música católica.");
  const [categoriaId, setCategoriaId] = useState(2);
  const [ciudad, setCiudad] = useState("Tampico");
  const [estado, setEstado] = useState("Tamaulipas");
  const [pais, setPais] = useState("México");
  const [venue, setVenue] = useState("Auditorio Municipal de Tampico");
  const [direccion, setDireccion] = useState("");
  const [modalidad, setModalidad] = useState("presencial");
  const [costoMinimo, setCostoMinimo] = useState(150);
  const [urlEvento, setUrlEvento] = useState("");

  // Fechas múltiples
  const [fechas, setFechas] = useState<Fecha[]>([
    { fecha: "2026-03-20", hora_inicio: "20:30", hora_fin: "", ciudad: "Tampico", estado: "Tamaulipas", venue: "Auditorio Municipal de Tampico" }
  ]);

  // Campos ext_conciertos
  const [artistas, setArtistas] = useState("Martín Valverde");
  const [horaApertura, setHoraApertura] = useState("19:00");
  const [edadMinima, setEdadMinima] = useState("");
  const [precioGeneral, setPrecioGeneral] = useState(150);
  const [precioVip, setPrecioVip] = useState(250);
  const [tieneZonaFamiliar, setTieneZonaFamiliar] = useState(false);

  const agregarFecha = () => setFechas([...fechas, fechaVacia()]);
  const quitarFecha = (i: number) => setFechas(fechas.filter((_, idx) => idx !== i));
  const actualizarFecha = (i: number, campo: keyof Fecha, valor: string) => {
    const nuevas = [...fechas];
    nuevas[i] = { ...nuevas[i], [campo]: valor };
    setFechas(nuevas);
  };

  const guardar = async () => {
    if (!titulo.trim()) { setError("El título es obligatorio."); return; }
    if (!ciudad.trim()) { setError("La ciudad es obligatoria."); return; }
    if (fechas.length === 0) { setError("Agrega al menos una fecha."); return; }

    setSaving(true);
    setError("");

    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sesión expirada. Vuelve a iniciar sesión."); setSaving(false); return; }

    // 2. Insertar evento base
    const primeraFecha = fechas[0];
    const { data: evento, error: errEvento } = await supabase
      .from("eventos")
      .insert({
        titulo,
        descripcion,
        categoria_id: categoriaId,
        organizador_id: user.id,
        ciudad,
        estado,
        pais,
        venue,
        direccion,
        fecha_inicio: primeraFecha.fecha || null,
        fecha_fin: fechas[fechas.length - 1].fecha || null,
        hora_inicio: primeraFecha.hora_inicio || null,
        hora_fin: primeraFecha.hora_fin || null,
        modalidad,
        costo_minimo: costoMinimo,
        url_evento: urlEvento || null,
        estado_publicacion: "borrador",
        exposicion: "basica",
        revisado_por: null,
      })
      .select()
      .single();

    if (errEvento || !evento) {
      setError("Error al guardar el evento: " + (errEvento?.message ?? "desconocido"));
      setSaving(false);
      return;
    }

    // 3. Insertar fechas múltiples
    if (fechas.length > 0) {
      const fechasInsert = fechas.map((f) => ({
        evento_id: evento.id,
        fecha: f.fecha || null,
        hora_inicio: f.hora_inicio || null,
        hora_fin: f.hora_fin || null,
        activa: true,
      }));
      await supabase.from("evento_fechas").insert(fechasInsert);
    }

    // 4. Insertar ext_conciertos si aplica
    if (categoriaId === 2) {
      await supabase.from("ext_conciertos").insert({
        evento_id: evento.id,
        artistas,
        hora_apertura_puertas: horaApertura || null,
        edad_minima: edadMinima ? parseInt(edadMinima) : null,
        precio_general: precioGeneral,
        precio_vip: precioVip,
        tiene_zona_familiar: tieneZonaFamiliar,
      });
    }

    router.push(`/portal/dashboard/eventos/${evento.id}`);
  };

  // Estilos reutilizables
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#4a6278", marginBottom: 4, display: "block" };
  const input: React.CSSProperties = { width: "100%", border: "0.5px solid #c8d8e8", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none" };
  const card: React.CSSProperties = { background: "#fff", border: "0.5px solid #c8d8e8", borderRadius: 12, padding: 16, marginBottom: 16 };
  const cardTitle: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: "#4a6278", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" };
  const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#4a6278", marginBottom: 10 }}>
        <span style={{ color: "#1a6b8c", cursor: "pointer" }} onClick={() => router.push("/portal/dashboard")}>Eventos</span>
        {" / "}Nuevo evento
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: "#1a2b3c" }}>Nuevo evento</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/portal/dashboard")}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
            Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
            style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Guardando..." : "Guardar evento"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Información principal */}
      <div style={card}>
        <div style={cardTitle}>Información principal</div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>Título *</label>
          <input style={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nombre del evento" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>Descripción</label>
          <textarea style={{ ...input, minHeight: 80, resize: "vertical" }} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción del evento" />
        </div>
        <div style={grid3}>
          <div>
            <label style={label}>Categoría *</label>
            <select style={input} value={categoriaId} onChange={(e) => setCategoriaId(Number(e.target.value))}>
              {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Modalidad</label>
            <select style={input} value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
          <div>
            <label style={label}>Costo mínimo (MXN)</label>
            <input style={input} type="number" min={0} value={costoMinimo} onChange={(e) => setCostoMinimo(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div style={card}>
        <div style={cardTitle}>Ubicación principal</div>
        <div style={{ ...grid3, marginBottom: 12 }}>
          <div>
            <label style={label}>Ciudad *</label>
            <input style={input} value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
          </div>
          <div>
            <label style={label}>Estado</label>
            <input style={input} value={estado} onChange={(e) => setEstado(e.target.value)} />
          </div>
          <div>
            <label style={label}>País</label>
            <input style={input} value={pais} onChange={(e) => setPais(e.target.value)} />
          </div>
        </div>
        <div style={grid2}>
          <div>
            <label style={label}>Venue</label>
            <input style={input} value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Nombre del lugar" />
          </div>
          <div>
            <label style={label}>Dirección</label>
            <input style={input} value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección completa" />
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={cardTitle as React.CSSProperties}>Fechas y funciones</span>
          <button onClick={agregarFecha}
            style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a3a6b", cursor: "pointer" }}>
            + Agregar fecha
          </button>
        </div>
        {fechas.map((f, i) => (
          <div key={i} style={{ background: "#f5f9fd", borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#1a3a6b" }}>Fecha {i + 1}</span>
              {fechas.length > 1 && (
                <button onClick={() => quitarFecha(i)}
                  style={{ fontSize: 11, color: "#A32D2D", background: "none", border: "none", cursor: "pointer" }}>
                  Quitar
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={label}>Fecha *</label>
                <input style={input} type="date" value={f.fecha} onChange={(e) => actualizarFecha(i, "fecha", e.target.value)} />
              </div>
              <div>
                <label style={label}>Hora inicio</label>
                <input style={input} type="time" value={f.hora_inicio} onChange={(e) => actualizarFecha(i, "hora_inicio", e.target.value)} />
              </div>
              <div>
                <label style={label}>Hora fin</label>
                <input style={input} type="time" value={f.hora_fin} onChange={(e) => actualizarFecha(i, "hora_fin", e.target.value)} />
              </div>
            </div>
            <div style={grid2}>
              <div>
                <label style={label}>Ciudad de esta función</label>
                <input style={input} value={f.ciudad} onChange={(e) => actualizarFecha(i, "ciudad", e.target.value)} placeholder="Ciudad" />
              </div>
              <div>
                <label style={label}>Venue de esta función</label>
                <input style={input} value={f.venue} onChange={(e) => actualizarFecha(i, "venue", e.target.value)} placeholder="Venue" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detalles concierto — solo si categoría es Conciertos */}
      {categoriaId === 2 && (
        <div style={card}>
          <div style={cardTitle}>Detalles del concierto</div>
          <div style={{ marginBottom: 12 }}>
            <label style={label}>Artistas (separados por coma)</label>
            <input style={input} value={artistas} onChange={(e) => setArtistas(e.target.value)} placeholder="Artista 1, Artista 2" />
          </div>
          <div style={{ ...grid3, marginBottom: 12 }}>
            <div>
              <label style={label}>Apertura de puertas</label>
              <input style={input} type="time" value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} />
            </div>
            <div>
              <label style={label}>Precio general (MXN)</label>
              <input style={input} type="number" min={0} value={precioGeneral} onChange={(e) => setPrecioGeneral(Number(e.target.value))} />
            </div>
            <div>
              <label style={label}>Precio preferente / VIP (MXN)</label>
              <input style={input} type="number" min={0} value={precioVip} onChange={(e) => setPrecioVip(Number(e.target.value))} />
            </div>
          </div>
          <div style={grid2}>
            <div>
              <label style={label}>Edad mínima (dejar vacío si no aplica)</label>
              <input style={input} type="number" min={0} value={edadMinima} onChange={(e) => setEdadMinima(e.target.value)} placeholder="Sin restricción" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 20 }}>
              <input type="checkbox" id="zonaFamiliar" checked={tieneZonaFamiliar} onChange={(e) => setTieneZonaFamiliar(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }} />
              <label htmlFor="zonaFamiliar" style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>Tiene zona familiar</label>
            </div>
          </div>
        </div>
      )}

      {/* Enlace externo */}
      <div style={card}>
        <div style={cardTitle}>Enlace externo</div>
        <label style={label}>Sitio oficial del evento</label>
        <input style={input} value={urlEvento} onChange={(e) => setUrlEvento(e.target.value)} placeholder="https://..." />
      </div>

      {/* Botones finales */}
      {error && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingBottom: 32 }}>
        <button onClick={() => router.push("/portal/dashboard")}
          style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
          Cancelar
        </button>
        <button onClick={guardar} disabled={saving}
          style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar evento"}
        </button>
      </div>
    </div>
  );
}
