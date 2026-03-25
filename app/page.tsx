"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "./lib/supabase";

type CategoriaPadre = {
  id: number;
  nombre: string;
  slug: string;
};

type EventoCarrusel = {
  id: number;
  titulo: string;
  url_imagen: string | null;
};

const COLORES = [
  "#1a3a6b", "#1a9b8c", "#4aa8d8", "#e8a020", "#1a6b8c", "#2d6a2d"
];

export default function Home() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuarioNombre, setUsuarioNombre] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<CategoriaPadre[]>([]);
  const [eventosMap, setEventosMap] = useState<Record<number, EventoCarrusel>>({});
  const carruselRef = useRef<HTMLDivElement>(null);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSlug, setCategoriaSlug] = useState("");
  const [ciudadHome, setCiudadHome] = useState("");
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [proximosEventos, setProximosEventos] = useState<any[]>([]);

  useEffect(() => {
    verificarSesion();
    cargarCarrusel();
    cargarFiltrosHome();
    cargarProximosEventos();
  }, [])

  const cargarProximosEventos = async () => {
    const { data } = await supabase
      .from("eventos")
      .select("id, titulo, url_imagen, ciudad, fecha_inicio, categorias(nombre)")
      .eq("estado_publicacion", "publicado")
      .or("fecha_inicio.gte." + new Date().toISOString().split("T")[0] + ",fecha_inicio.is.null")
      .order("fecha_inicio", { ascending: true, nullsFirst: false })
      .limit(12);
    if (data) setProximosEventos(data);
  };

  const cargarFiltrosHome = async () => {
    const { data: cats } = await supabase
      .from("categorias")
      .select("id, nombre, slug")
      .is("parent_id", null)
      .eq("activo", true)
      .order("orden");
    if (cats) setCategorias(cats);
  
     const { data: ciu } = await supabase
      .from("eventos")
      .select("ciudad")
      .eq("estado_publicacion", "publicado")
      .not("ciudad", "is", null);
    if (ciu) {
      const unicas = [...new Set(ciu.map((e: any) => e.ciudad).filter(Boolean))].sort();
      setCiudades(unicas as string[]);
    }
  };
  
  const irABuscar = () => {
    const p = new URLSearchParams();
    if (busqueda.trim()) p.set("q", busqueda.trim());
    if (categoriaSlug) p.set("categoria", categoriaSlug);
    if (ciudadHome) p.set("ciudad", ciudadHome);
    window.location.href = "/buscar?" + p.toString();
  };

  const verificarSesion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", user.id)
      .single();
    if (perfil?.nombre) setUsuarioNombre(perfil.nombre);
  };

  const cargarCarrusel = async () => {
    const { data: cats } = await supabase
      .from("categorias")
      .select("id, nombre, slug")
      .is("parent_id", null)
      .eq("activo", true)
      .order("orden");

    if (!cats) return;
    setCategorias(cats);

    const hijoIds = await supabase
      .from("categorias")
      .select("id, parent_id")
      .not("parent_id", "is", null)
      .eq("activo", true);

    if (!hijoIds.data) return;

    const mapa: Record<number, EventoCarrusel> = {};

    for (const cat of cats) {
      const hijos = hijoIds.data
        .filter((h: any) => h.parent_id === cat.id)
        .map((h: any) => h.id);

      const catIds = [cat.id, ...hijos];

      const { data: eventos } = await supabase
        .from("eventos")
        .select("id, titulo, url_imagen, fecha_inicio")
        .eq("estado_publicacion", "publicado")
        .in("categoria_id", catIds)
     //   .or("fecha_inicio.gte." + new Date().toISOString().split("T")[0] + ",fecha_inicio.is.null")    Trae el ultimo evento o el más cercano proximo
        .order("fecha_inicio", { ascending: true, nullsFirst: false })
        .limit(1);

      if (eventos && eventos.length > 0) {
        mapa[cat.id] = {
          id: eventos[0].id,
          titulo: eventos[0].titulo,
          url_imagen: eventos[0].url_imagen,
        };
      }
    }

    setEventosMap(mapa);
  };

  const scroll = (dir: "left" | "right") => {
    const el = carruselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuarioNombre(null);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Nunito', sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        background: "linear-gradient(90deg, #1a3a6b 0%, #1a6b8c 100%)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo_transparente.png" alt="Next In Faith" style={{ width: 44, height: 44 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Next In Faith</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {usuarioNombre ? (
              <>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Hola, {usuarioNombre}</span>
                <button onClick={handleLogout} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer" }}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <a href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textDecoration: "none", fontWeight: 600 }}>Iniciar sesión</a>
                <a href="/registro" style={{ fontSize: 13, background: "#e8a020", color: "#fff", padding: "7px 18px", borderRadius: 99, textDecoration: "none", fontWeight: 700 }}>Regístrate</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* BUSCADOR + HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", paddingTop: 64,
      }}>
        <img src="/background.jpg" alt="Evento católico"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,58,107,0.75), rgba(0,0,0,0.45), rgba(26,107,140,0.65))" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff", padding: "0 24px", width: "100%", maxWidth: 860 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>
            Plataforma católica de eventos
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>
            Entérate primero de los<br />
            <span style={{ color: "#5bb8f5", fontStyle: "italic" }}>eventos católicos</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.8)", marginBottom: 36, maxWidth: 500, margin: "0 auto 36px" }}>
            Retiros, conciertos, conferencias, peregrinaciones y más.
          </p>

          {/* BUSCADOR */}
          <div style={{
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
            border: "0.5px solid rgba(255,255,255,0.25)", borderRadius: 16,
            padding: "20px 24px", marginBottom: 24,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>Buscar evento</label>
                <input
                  style={{ width: "100%", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none" }}
                  placeholder="Nombre del evento..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && irABuscar()}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>Categoría</label>
                <select
                  style={{ width: "100%", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none" }}
                  value={categoriaSlug}
                  onChange={e => setCategoriaSlug(e.target.value)}
                >
                  <option value="">Todas</option>
                  {categorias.map(c => <option key={c.id} value={c.slug}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>Ciudad</label>
                <select
                  style={{ width: "100%", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none" }}
                  value={ciudadHome}
                  onChange={e => setCiudadHome(e.target.value)}
                >
                  <option value="">Todas</option>
                  {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button
                onClick={irABuscar}
                style={{ background: "#e8a020", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                Buscar →
              </button>
            </div>
          </div>

          <a href="#eventos" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "12px 28px", borderRadius: 99, fontSize: 14, fontWeight: 600, textDecoration: "none", border: "0.5px solid rgba(255,255,255,0.3)" }}>
            Ver todos los eventos ↓
          </a>
        </div>
      </section>

      {/* CARRUSEL */}
      <section id="eventos" style={{ padding: "64px 24px", background: "linear-gradient(170deg, #1a3a6b 0%, #1a6b8c 40%, #4aa8d8 75%, #dff0fb 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 8 }}>
            Descubre eventos católicos
          </h2>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.75)", marginBottom: 36, fontSize: 15 }}>
            Encuentra lo que mueve tu fe
          </p>

          <div style={{ position: "relative" }}>
            {/* Flecha izquierda */}
            <button onClick={() => scroll("left")} style={{
              position: "absolute", left: -20, top: "50%", transform: "translateY(-50%)",
              zIndex: 10, background: "#fff", border: "none", borderRadius: "50%",
              width: 40, height: 40, fontSize: 18, cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center"
            }}>‹</button>

            {/* Tarjetas */}
            <div ref={carruselRef} style={{
              display: "flex", gap: 20, overflowX: "auto", paddingBottom: 8,
              scrollbarWidth: "none", scrollSnapType: "x mandatory",
            }}>
              {categorias.map((cat, i) => {
                const evento = eventosMap[cat.id];
                return (
                  <a key={cat.id} href={`/buscar?categoria=${cat.slug}`} style={{
                    flexShrink: 0, width: 220, height: 280, borderRadius: 16,
                    overflow: "hidden", position: "relative", textDecoration: "none",
                    scrollSnapAlign: "start", backgroundColor: COLORES[i % COLORES.length],
                    display: "block",
                  }}>
                    {evento?.url_imagen && (
                      <img src={evento.url_imagen} alt={evento.titulo}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 16 }}>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.3, margin: 0 }}>{cat.nombre}</p>
                      {evento ? (
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 4 }}>{evento.titulo}</p>
                      ) : (
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 4 }}>Próximamente →</p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Flecha derecha */}
            <button onClick={() => scroll("right")} style={{
              position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)",
              zIndex: 10, background: "#fff", border: "none", borderRadius: "50%",
              width: 40, height: 40, fontSize: 18, cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center"
            }}>›</button>
          </div>
        </div>
      </section>

      {/* 12 PRÓXIMOS EVENTOS */}
      <section id="eventos" style={{ padding: "56px 24px", background: "#f0f6fb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1a2b3c", marginBottom: 6 }}>
            Próximos eventos
          </h2>
          <p style={{ fontSize: 14, color: "#7a96aa", marginBottom: 28 }}>
            Los eventos más cercanos de toda la plataforma
          </p>
          {proximosEventos.length === 0 ? (
            <div style={{ textAlign: "center", color: "#7a96aa", fontSize: 14, padding: 40 }}>
              Próximamente nuevos eventos
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {proximosEventos.map(ev => (
                <a key={ev.id} href={`/buscar/${ev.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#fff", borderRadius: 16, overflow: "hidden",
                    border: "0.5px solid #c8d8e8",
                  }}>
                    <div style={{ position: "relative", paddingTop: "75%" }}>
                      <img
                        src={ev.url_imagen ?? "https://placehold.co/400x300/1a3a6b/ffffff?text=Sin+imagen"}
                        alt={ev.titulo}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 11, color: "#4aa8d8", fontWeight: 600, marginBottom: 4 }}>
                        {(ev.categorias as any)?.nombre ?? ""}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2b3c", marginBottom: 6, lineHeight: 1.3 }}>
                        {ev.titulo}
                      </div>
                      <div style={{ fontSize: 12, color: "#7a96aa" }}>
                        {ev.ciudad}{ev.fecha_inicio ? ` · ${new Date(ev.fecha_inicio + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <a href="/buscar" style={{
              background: "#1a3a6b", color: "#fff", padding: "12px 28px",
              borderRadius: 99, fontSize: 14, fontWeight: 700, textDecoration: "none"
            }}>
              Ver todos los eventos →
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}