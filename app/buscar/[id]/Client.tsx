"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Evento = {
  id: number;
  titulo: string;
  descripcion: string | null;
  url_imagen: string | null;
  ciudades: { nombre: string; estado: string; paises: { nombre: string } | null } | null;
  direccion: string | null;
  venue: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  costo_minimo: number | null;
  url_evento: string | null;
  telefono_contacto: string | null;
  modalidades: { clave: string } | null;
  exposicion: string;
  categorias: { nombre: string } | null;
};

type Fecha = {
  id: number;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
};

type Resena = {
  id: number;
  calificacion: number;
  comentario: string | null;
  created_at: string;
  profiles: { nombre: string | null; apellido: string | null } | null;
};

export default function DetalleEventoPublico() {
  const params = useParams();
  const id = params?.id as string;
  const [evento, setEvento] = useState<Evento | null>(null);
  const [fechas, setFechas] = useState<Fecha[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEvento();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [id]);


  const cargarEvento = async () => {
    setLoading(true);
    const { data: ev } = await supabase
      .from("eventos")
      .select("id, titulo, descripcion, url_imagen, ciudad_id, ciudades(nombre, estado, paises(nombre)), direccion, venue, fecha_inicio, fecha_fin, costo_minimo, url_evento, telefono_contacto, modalidad_id, modalidades(clave), exposicion, categorias(nombre)")
      .eq("id", Number(id))
      .eq("estado_publicacion", "publicado")
      .single();

    if (!ev) { setLoading(false); return; }
    setEvento(ev as any);

    const { data: fs } = await supabase
      .from("evento_fechas")
      .select("id, fecha, hora_inicio, hora_fin")
      .eq("evento_id", Number(id))
      .order("fecha", { ascending: true });
    if (fs) setFechas(fs);

    const { data: rs } = await supabase
      .from("resenas")
      .select("id, calificacion, comentario, created_at, profiles!resenas_user_id_fkey(nombre, apellido)")
      .eq("evento_id", Number(id))
      .eq("estado", "aprobada")
      .order("created_at", { ascending: false });
    if (rs) setResenas(rs as any);

    setLoading(false);
  };

  const promedioCalificacion = resenas.length > 0
    ? (resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length).toFixed(1)
    : null;

  const enviarResena = async () => {
    if (calificacion === 0) { setError("Selecciona una calificación."); return; }
    if (!comentario.trim()) { setError("Escribe un comentario."); return; }
    setEnviando(true); setError("");

    const { error: errR } = await supabase.from("resenas").insert({
      evento_id: Number(id),
      user_id: usuario.id,
      calificacion,
      comentario: comentario.trim(),
      estado: "pendiente",
    });

    if (errR) { setError("Error al enviar la reseña."); setEnviando(false); return; }
    setEnviado(true); setEnviando(false);
    setCalificacion(0); setComentario("");
  };

  const formatFecha = (f: string) =>
    new Date(f + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const formatHora = (h: string) =>
    h.substring(0, 5);

  const returnTo = encodeURIComponent(`/buscar/${id}`);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ color: "#4a6278", fontSize: 14 }}>Cargando evento...</div>
    </div>
  );

  if (!evento) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ color: "#4a6278", fontSize: 14 }}>Evento no encontrado.</div>
    </div>
  );

  const inp: React.CSSProperties = {
    width: "100%", border: "0.5px solid #b5d4f4", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f6fb", fontFamily: "'Nunito', sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{
        background: "linear-gradient(90deg, #1a3a6b 0%, #1a6b8c 100%)",
        padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo_transparente.png" alt="Next In Faith" style={{ width: 36, height: 36 }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Next In Faith</span>
        </a>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {usuario ? (
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Hola, {usuario.email}</span>
          ) : (
            <>
              <a href={`/login?returnTo=${returnTo}`} style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textDecoration: "none", fontWeight: 600 }}>Iniciar sesión</a>
              <a href={`/registro?returnTo=${returnTo}`} style={{ fontSize: 13, background: "#e8a020", color: "#fff", padding: "7px 18px", borderRadius: 99, textDecoration: "none", fontWeight: 700 }}>Regístrate</a>
            </>
          )}
        </div>
      </nav>

      {/* IMAGEN HERO */}
      <div style={{ background: "#1a3a6b", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
        <img
          src={evento.url_imagen ?? "https://placehold.co/800x600/1a3a6b/ffffff?text=Next+In+Faith"}
          alt={evento.titulo}
          style={{ width: "35%", aspectRatio: "4/3", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
          <div style={{ fontSize: 12, color: "#5bb8f5", fontWeight: 600, marginBottom: 6 }}>
            {(evento.categorias as any)?.nombre}
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
            {evento.titulo}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>

        {/* DATOS PRINCIPALES */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #c8d8e8", padding: "24px", marginBottom: 20 }}>

          {/* Calificación promedio */}
          {promedioCalificacion && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#e8a020" }}>{promedioCalificacion}</span>
              <span style={{ fontSize: 20, color: "#e8a020" }}>{"★".repeat(Math.round(Number(promedioCalificacion)))}</span>
              <span style={{ fontSize: 13, color: "#7a96aa" }}>({resenas.length} {resenas.length === 1 ? "reseña" : "reseñas"})</span>
            </div>
          )}

          {/* Info básica */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#7a96aa", marginBottom: 2 }}>CIUDAD</div>
              <div style={{ fontSize: 14, color: "#1a2b3c", fontWeight: 500 }}>
                {(evento.ciudades as any)?.nombre ?? "—"}{(evento.ciudades as any)?.estado ? `, ${(evento.ciudades as any).estado}` : ""}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#7a96aa", marginBottom: 2 }}>MODALIDAD</div>
              <div style={{ fontSize: 14, color: "#1a2b3c", fontWeight: 500, textTransform: "capitalize" }}>
                {(evento.modalidades as any)?.clave ?? "—"}
              </div>
            </div>
            {evento.telefono_contacto && (
              <div>
                <div style={{ fontSize: 11, color: "#7a96aa", marginBottom: 2 }}>CONTACTO</div>
                <div style={{ fontSize: 14, color: "#1a2b3c", fontWeight: 500 }}>
                  {evento.telefono_contacto}
                </div>
              </div>
            )}
            {evento.exposicion === "completa" && evento.costo_minimo !== null && (
              <div>
                <div style={{ fontSize: 11, color: "#7a96aa", marginBottom: 2 }}>PRECIO</div>
                <div style={{ fontSize: 14, color: "#1a9b8c", fontWeight: 700 }}>
                  {evento.costo_minimo === 0 ? "Gratuito" : `Desde $${evento.costo_minimo.toLocaleString("es-MX")} MXN`}
                </div>
              </div>
            )}
            {evento.exposicion === "completa" && evento.direccion && (
              <div>
                <div style={{ fontSize: 11, color: "#7a96aa", marginBottom: 2 }}>DIRECCIÓN</div>
                <div style={{ fontSize: 14, color: "#1a2b3c", fontWeight: 500 }}>
                  {evento.venue ? `${evento.venue} — ` : ""}{evento.direccion}
                </div>
              </div>
            )}
          </div>

          {/* Link de registro solo en completa */}
          {evento.exposicion === "completa" && evento.url_evento && (
            <div style={{ marginTop: 20 }}>
              <a href={evento.url_evento} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-block", background: "#e8a020", color: "#fff",
                padding: "12px 28px", borderRadius: 99, fontSize: 14, fontWeight: 700, textDecoration: "none"
              }}>
                Registrarme / Comprar boleto →
              </a>
            </div>
          )}
        </div>

        {/* DESCRIPCIÓN */}
        {evento.descripcion && (
          <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #c8d8e8", padding: "24px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4a6278", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Acerca del evento</div>
            <p style={{ fontSize: 14, color: "#1a2b3c", lineHeight: 1.75, margin: 0 }}>{evento.descripcion}</p>
          </div>
        )}

        {/* FECHAS */}
        {fechas.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #c8d8e8", padding: "24px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4a6278", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fechas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fechas.map(f => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f0f6fb", borderRadius: 8 }}>
                  <span style={{ fontSize: 18 }}>📅</span>
                  <div>
                    <div style={{ fontSize: 14, color: "#1a2b3c", fontWeight: 500 }}>
                      {f.fecha ? formatFecha(f.fecha) : "Fecha por confirmar"}
                    </div>
                    {(f.hora_inicio || f.hora_fin) && (
                      <div style={{ fontSize: 12, color: "#7a96aa", marginTop: 2 }}>
                        {f.hora_inicio ? formatHora(f.hora_inicio) : ""}
                        {f.hora_fin ? ` — ${formatHora(f.hora_fin)}` : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESEÑAS */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #c8d8e8", padding: "24px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#4a6278", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Reseñas {resenas.length > 0 ? `(${resenas.length})` : ""}
          </div>

          {resenas.length === 0 ? (
            <div style={{ fontSize: 14, color: "#7a96aa", marginBottom: 16 }}>
              Sé el primero en reseñar este evento.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {resenas.map(r => (
                <div key={r.id} style={{ borderBottom: "0.5px solid #e8f0f8", paddingBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2b3c" }}>
                      {(r.profiles as any)?.nombre ?? "Usuario"} {(r.profiles as any)?.apellido ?? ""}
                    </div>
                    <div style={{ color: "#e8a020", fontSize: 14 }}>
                      {"★".repeat(r.calificacion)}{"☆".repeat(5 - r.calificacion)}
                    </div>
                  </div>
                  {r.comentario && (
                    <p style={{ fontSize: 13, color: "#4a6278", lineHeight: 1.6, margin: 0 }}>{r.comentario}</p>
                  )}
                  <div style={{ fontSize: 11, color: "#7a96aa", marginTop: 6 }}>
                    {new Date(r.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FORMULARIO DE RESEÑA */}
          {!usuario ? (
            <div style={{ background: "#f0f6fb", borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#4a6278", marginBottom: 14 }}>
                ¿Asististe a este evento? Comparte tu experiencia.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <a href={`/login?returnTo=${returnTo}`} style={{ background: "#1a3a6b", color: "#fff", padding: "10px 22px", borderRadius: 99, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Iniciar sesión
                </a>
                <a href={`/registro?returnTo=${returnTo}`} style={{ background: "#e8a020", color: "#fff", padding: "10px 22px", borderRadius: 99, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Registrarme
                </a>
              </div>
            </div>
          ) : enviado ? (
            <div style={{ background: "#E1F5EE", border: "0.5px solid #5DCAA5", borderRadius: 12, padding: "16px", textAlign: "center", fontSize: 14, color: "#0F6E56" }}>
              ✓ Tu reseña fue enviada y está pendiente de aprobación. ¡Gracias!
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2b3c", marginBottom: 12 }}>Escribe tu reseña</div>

              {/* ESTRELLAS */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setCalificacion(n)} style={{
                    fontSize: 28, background: "none", border: "none", cursor: "pointer",
                    color: n <= calificacion ? "#e8a020" : "#c8d8e8", padding: 0,
                  }}>
                    ★
                  </button>
                ))}
              </div>

              <textarea
                style={{ ...inp, minHeight: 90, resize: "vertical", marginBottom: 12 }}
                placeholder="Cuéntanos tu experiencia..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
              />

              {error && (
                <div style={{ padding: "8px 12px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button onClick={enviarResena} disabled={enviando} style={{
                background: "#1a3a6b", color: "#fff", border: "none", borderRadius: 10,
                padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: enviando ? "not-allowed" : "pointer",
                opacity: enviando ? 0.6 : 1,
              }}>
                {enviando ? "Enviando..." : "Enviar reseña"}
              </button>
            </div>
          )}
        </div>

        {/* VOLVER */}
        <div style={{ textAlign: "center", paddingBottom: 32 }}>
          <a href="/buscar" style={{ fontSize: 13, color: "#4a6278", textDecoration: "none" }}>
            ← Ver más eventos
          </a>
        </div>
      </div>
    </div>
  );
}
