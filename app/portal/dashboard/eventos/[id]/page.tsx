"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Evento = {
  id: number;
  titulo: string;
  descripcion: string;
  ciudad: string;
  estado: string;
  pais: string;
  venue: string;
  direccion: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
  costo_minimo: number;
  url_imagen: string;
  url_evento: string;
  estado_publicacion: string;
  exposicion: string;
  created_at: string;
  updated_at: string;
  categorias: { id: number; nombre: string } | null;
  profiles: { nombre: string; apellido: string } | null;
  revisado: { nombre: string; apellido: string } | null;
};

type Fecha = { id: number; fecha: string; hora_inicio: string; hora_fin: string };
type Artista = { artistas: string; hora_apertura_puertas: string; edad_minima: number; precio_general: number; precio_vip: number; tiene_zona_familiar: boolean };
type Zona = { id: number; nombre: string; es_numerado: boolean; capacidad_total: number };
type TicketType = { id: number; zone_id: number; nombre: string; precio: number; stock_limite: number; fecha_limite: string };
type Corresponsal = { id: number; nombre: string; ciudad: string; segmento: string; sexo: string; estado_corresponsal: string };

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

const BADGE_COBERTURA: Record<string, { bg: string; color: string }> = {
  asignado:     { bg: "#FAEEDA", color: "#854F0B" },
  en_cobertura: { bg: "#dff0fb", color: "#185FA5" },
  completado:   { bg: "#E1F5EE", color: "#0F6E56" },
};

function Badge({ value, map }: { value: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[value] ?? { bg: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #c8d8e8", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "#4a6278", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, color: "#7a9ab0" }}>{label}</span>
      <span style={{ fontSize: 13, color: color ?? "#1a2b3c" }}>{value ?? "—"}</span>
    </div>
  );
}

function Btn({ label, onClick, variant = "default" }: { label: string; onClick: () => void; variant?: "default" | "success" | "danger" }) {
  const styles: Record<string, React.CSSProperties> = {
    default:  { background: "#fff", color: "#1a2b3c", border: "0.5px solid #c8d8e8" },
    success:  { background: "#0F6E56", color: "#fff", border: "0.5px solid #0F6E56" },
    danger:   { background: "#FCEBEB", color: "#A32D2D", border: "0.5px solid #F09595" },
  };
  return (
    <button onClick={onClick} style={{ ...styles[variant], padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

export default function EventoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [tab, setTab] = useState("general");
  const [evento, setEvento] = useState<Evento | null>(null);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [artista, setArtista] = useState<Artista | null>(null);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [corresponsales, setCorresponsales] = useState<Corresponsal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) cargarEvento();
  }, [id]);

  const cargarEvento = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("eventos")
      .select(`*, categorias(id,nombre), profiles!organizador_id(nombre,apellido), revisado:profiles!revisado_por(nombre,apellido)`)
      .eq("id", id)
      .single();
    if (data) setEvento(data);

    const [fData, aData, zData, tData, cData] = await Promise.all([
      supabase.from("evento_fechas").select("*").eq("evento_id", id).order("fecha"),
      supabase.from("ext_conciertos").select("*").eq("evento_id", id).single(),
      supabase.from("event_zones").select("*").eq("evento_id", id),
      supabase.from("ticket_types").select("*"),
      supabase.from("corresponsales").select("id,nombre,ciudad,segmento,sexo,estado_corresponsal"),
    ]);

    if (fData.data) setFechas(fData.data);
    if (aData.data) setArtista(aData.data);
    if (zData.data) setZonas(zData.data);
    if (tData.data) setTickets(tData.data);
    if (cData.data) setCorresponsales(cData.data.filter((c: Corresponsal) => c.estado_corresponsal === "activo"));
    setLoading(false);
  };

  const cambiarEstado = async (nuevoEstado: string) => {
    await supabase.from("eventos").update({ estado_publicacion: nuevoEstado }).eq("id", id);
    await cargarEvento();
  };

  const cambiarExposicion = async (nueva: string) => {
    await supabase.from("eventos").update({ exposicion: nueva }).eq("id", id);
    await cargarEvento();
  };

  const formatFecha = (f: string) => f ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const formatMXN = (n: number) => n != null ? `$${n.toLocaleString("es-MX")} MXN` : "—";

  const tabs = ["general", "programa", "asientos", "corresponsales"];
  const tabLabels: Record<string, string> = { general: "General", programa: "Programa", asientos: "Asientos", corresponsales: "Corresponsales" };

  if (loading) return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />
      <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#4a6278" }}>Cargando evento...</div>
    </div>
  );

  if (!evento) return (
    <div style={{ padding: 24 }}>
      <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#A32D2D" }}>Evento no encontrado.</div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />

      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#4a6278", marginBottom: 10 }}>
        <span style={{ color: "#1a6b8c", cursor: "pointer" }} onClick={() => router.push("/portal/dashboard")}>Eventos</span>
        {" / "}{evento.titulo}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: "#1a2b3c" }}>{evento.titulo}</span>
          <Badge value={evento.estado_publicacion} map={BADGE_ESTADO} />
          <Badge value={evento.exposicion ?? "basica"} map={BADGE_EXPO} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#4a6278" }}>
            {evento.categorias?.nombre} · {evento.ciudad}, {evento.estado} · Creado {formatFecha(evento.created_at)}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Rechazar" onClick={() => cambiarEstado("rechazado")} variant="danger" />
            <Btn label={evento.exposicion === "completa" ? "Bajar a básica" : "Subir a completa"}
              onClick={() => cambiarExposicion(evento.exposicion === "completa" ? "basica" : "completa")} />
            <Btn label="Aprobar" onClick={() => cambiarEstado("publicado")} variant="success" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "0.5px solid #c8d8e8", marginBottom: 20 }}>
        {tabs.map((t) => (
          <div key={t} onClick={() => setTab(t)} style={{
            padding: "8px 16px", fontSize: 13, cursor: "pointer",
            color: tab === t ? "#1a3a6b" : "#4a6278",
            borderBottom: tab === t ? "2px solid #1a3a6b" : "2px solid transparent",
            fontWeight: tab === t ? 500 : 400,
            marginBottom: -0.5,
          }}>
            {tabLabels[t]}
          </div>
        ))}
      </div>

      {/* Tab: General */}
      {tab === "general" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 16 }}>
          <div>
            <Card title="Información principal">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Título" value={evento.titulo} />
                <Field label="Categoría" value={evento.categorias?.nombre} />
                <Field label="Modalidad" value={evento.modalidad} />
                <Field label="Costo mínimo" value={formatMXN(evento.costo_minimo)} />
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Descripción" value={evento.descripcion} />
                </div>
              </div>
            </Card>
            <Card title="Fechas y sedes">
              {fechas.length === 0 ? (
                <div style={{ fontSize: 12, color: "#7a9ab0" }}>Sin fechas registradas.</div>
              ) : fechas.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "9px 0", borderBottom: "0.5px solid #e8f0f8" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#1a3a6b", minWidth: 110 }}>{formatFecha(f.fecha)}</span>
                  <span style={{ fontSize: 12, color: "#1a2b3c", flex: 1 }}>{evento.ciudad}, {evento.estado}</span>
                  <span style={{ fontSize: 12, color: "#4a6278" }}>{evento.venue} · {f.hora_inicio}</span>
                </div>
              ))}
            </Card>
            <Card title="Organizador">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Nombre" value={evento.profiles ? `${evento.profiles.nombre} ${evento.profiles.apellido}` : "—"} />
                <Field label="Revisado por" value={evento.revisado ? `${evento.revisado.nombre} ${evento.revisado.apellido}` : "—"} />
                <Field label="Última actualización" value={formatFecha(evento.updated_at)} />
              </div>
            </Card>
          </div>
          <div>
            <Card title="Imagen del evento">
              {evento.url_imagen ? (
                <img src={evento.url_imagen} alt={evento.titulo} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8 }} />
              ) : (
                <div style={{ width: "100%", height: 110, background: "#dff0fb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#4a6278", border: "0.5px solid #b5d4f4" }}>
                  Sin imagen cargada
                </div>
              )}
            </Card>
            <Card title="Enlace externo">
              <Field label="Sitio oficial" value={
                evento.url_evento
                  ? <a href={evento.url_evento} target="_blank" rel="noreferrer" style={{ color: "#1a6b8c", fontSize: 12 }}>{evento.url_evento}</a>
                  : "—"
              } />
            </Card>
            <Card title="Control editorial">
              <Field label="Estado publicación" value={<Badge value={evento.estado_publicacion} map={BADGE_ESTADO} />} />
              <div style={{ marginTop: 8 }}>
                <Field label="Exposición" value={<Badge value={evento.exposicion ?? "basica"} map={BADGE_EXPO} />} />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Programa */}
      {tab === "programa" && (
        <div>
          <Card title="Artistas y ministerios">
            {artista?.artistas ? (
              artista.artistas.split(",").map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "0.5px solid #e8f0f8" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2b3c" }}>{a.trim()}</div>
                  </div>
                  <Badge value={i === 0 ? "principal" : "invitado"} map={{ principal: { bg: "#dff0fb", color: "#185FA5" }, invitado: { bg: "#F1EFE8", color: "#5F5E5A" } }} />
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: "#7a9ab0" }}>Sin artistas registrados.</div>
            )}
          </Card>
          {artista && (
            <Card title="Detalles del concierto">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Field label="Apertura de puertas" value={artista.hora_apertura_puertas ?? "—"} />
                <Field label="Edad mínima" value={artista.edad_minima ? `${artista.edad_minima} años` : "Sin restricción"} />
                <Field label="Zona familiar" value={artista.tiene_zona_familiar ? "Disponible" : "No disponible"} color={artista.tiene_zona_familiar ? "#0F6E56" : undefined} />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Asientos */}
      {tab === "asientos" && (
        <div>
          <Card title="Zonas y precios">
            {zonas.length === 0 ? (
              <div style={{ fontSize: 12, color: "#7a9ab0" }}>Sin zonas registradas.</div>
            ) : zonas.map((z) => {
              const zTickets = tickets.filter((t) => t.zone_id === z.id);
              return (
                <div key={z.id} style={{ padding: "9px 0", borderBottom: "0.5px solid #e8f0f8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1a2b3c", minWidth: 90 }}>{z.nombre}</span>
                    <span style={{ fontSize: 12, color: "#4a6278", flex: 1 }}>
                      Capacidad: {z.capacidad_total?.toLocaleString()} · {z.es_numerado ? "Numerado" : "Aforo general"}
                    </span>
                  </div>
                  {zTickets.map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, paddingLeft: 12 }}>
                      <span style={{ fontSize: 12, color: "#4a6278", flex: 1 }}>
                        {t.nombre}{t.fecha_limite ? ` · Vence ${formatFecha(t.fecha_limite)}` : ""}{t.stock_limite ? ` · Stock: ${t.stock_limite}` : ""}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#1a3a6b" }}>{formatMXN(t.precio)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Tab: Corresponsales */}
      {tab === "corresponsales" && (
        <div>
          <Card title="Corresponsales activos">
            {corresponsales.length === 0 ? (
              <div style={{ fontSize: 12, color: "#7a9ab0", textAlign: "center", padding: 24 }}>No hay corresponsales activos registrados.</div>
            ) : corresponsales.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid #e8f0f8" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1a9b8c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 500, color: "#fff", flexShrink: 0 }}>
                  {c.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2b3c" }}>{c.nombre}</div>
                  <div style={{ fontSize: 11, color: "#4a6278" }}>{c.segmento} · {c.sexo} · {c.ciudad}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Badge value={c.estado_corresponsal} map={BADGE_COBERTURA} />
                </div>
              </div>
            ))}
          </Card>
          <Card title="Contenido generado">
            <div style={{ textAlign: "center", padding: 28, color: "#7a9ab0", fontSize: 13 }}>
              Aún no hay contenido subido para este evento.
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
