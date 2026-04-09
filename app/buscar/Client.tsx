"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Suspense } from "react";

type Evento = {
  id: number;
  titulo: string;
  url_imagen: string | null;
  ciudades: { nombre: string; estado: string } | null;
  fecha_inicio: string | null;
  costo_minimo: number | null;
  exposicion: string;
  categorias: { nombre: string } | null;
};

type Categoria = { id: number; nombre: string; slug: string };

function EventosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ciudades, setCiudades] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState(searchParams?.get("q") ?? "");
  const [categoriaSlug, setCategoriaSlug] = useState(searchParams?.get("categoria") ?? "");
  const [ciudadId, setCiudadId] = useState<number | "">(() => {
    const raw = searchParams?.get("ciudad");
    return raw ? Number(raw) : "";
  });
  const [fecha, setFecha] = useState(searchParams?.get("fecha") ?? "");

  useEffect(() => {
    cargarFiltros();
  }, []);

  useEffect(() => {
    buscar();
  }, [categoriaSlug, ciudadId, fecha]);

  const cargarFiltros = async () => {
    const { data: cats } = await supabase
      .from("categorias")
      .select("id, nombre, slug")
      .is("parent_id", null)
      .eq("activo", true)
      .order("orden");
    if (cats) setCategorias(cats);

    const { data: ciu } = await supabase
      .from("ciudades")
      .select("id, nombre")
      .order("nombre");
    if (ciu) setCiudades(ciu);
  };

  const buscar = async () => {
    setLoading(true);

    let catIds: number[] = [];

    if (categoriaSlug) {
      const { data: catPadre } = await supabase
        .from("categorias")
        .select("id")
        .eq("slug", categoriaSlug)
        .single();

      if (catPadre) {
        const { data: hijos } = await supabase
          .from("categorias")
          .select("id")
          .eq("parent_id", catPadre.id);
        catIds = [catPadre.id, ...(hijos?.map((h: any) => h.id) ?? [])];
      }
    }

    let query = supabase
      .from("eventos")
      .select("id, titulo, url_imagen, ciudad_id, ciudades(nombre, estado), fecha_inicio, costo_minimo, exposicion, categorias(nombre)")
      .eq("estado_publicacion", "publicado")
  //    .or("fecha_inicio.gte." + new Date().toISOString().split("T")[0] + ",fecha_inicio.is.null")  TRae los ultimos eventos
      .order("fecha_inicio", { ascending: true, nullsFirst: false })
      .limit(12);

    if (catIds.length > 0) query = query.in("categoria_id", catIds);
    if (ciudadId) query = query.eq("ciudad_id", ciudadId);
    if (fecha) query = query.eq("fecha_inicio", fecha);
    if (busqueda.trim()) query = query.ilike("titulo", `%${busqueda.trim()}%`);

    const { data } = await query;
    setEventos((data as any) ?? []);
    setLoading(false);
  };

  const actualizarURL = (params: Record<string, string>) => {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.categoria) p.set("categoria", params.categoria);
    if (params.ciudad) p.set("ciudad", params.ciudad);
    if (params.fecha) p.set("fecha", params.fecha);
    router.push("/buscar?" + p.toString());
  };

  const handleBuscar = () => {
    actualizarURL({ q: busqueda, categoria: categoriaSlug, ciudad: ciudadId ? String(ciudadId) : "", fecha });
    buscar();
  };

  const inp: React.CSSProperties = {
    border: "0.5px solid #b5d4f4", borderRadius: 10, padding: "10px 14px",
    fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none", width: "100%",
  };

  const PLACEHOLDER = "https://placehold.co/400x300/1a3a6b/ffffff?text=Sin+imagen";

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
        <a href="/login" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textDecoration: "none", fontWeight: 600 }}>
          Iniciar sesión
        </a>
      </nav>

      {/* BUSCADOR */}
      <div style={{ background: "linear-gradient(135deg, #1a3a6b 0%, #1a6b8c 100%)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 20, textAlign: "center" }}>
            Encuentra tu próximo evento católico
          </h1>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>Buscar</label>
              <input style={inp} placeholder="Nombre del evento..." value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleBuscar()} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>Categoría</label>
              <select style={inp} value={categoriaSlug} onChange={e => setCategoriaSlug(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map(c => <option key={c.id} value={c.slug}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>Ciudad</label>
              <select style={inp} value={ciudadId} onChange={e => setCiudadId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Todas</option>
                {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 4 }}>Fecha</label>
              <input style={inp} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <button onClick={handleBuscar} style={{
              background: "#e8a020", color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
            }}>
              Buscar →
            </button>
          </div>
        </div>
      </div>

      {/* RESULTADOS */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#4a6278", fontSize: 14, padding: 40 }}>Cargando eventos...</div>
        ) : eventos.length === 0 ? (
          <div style={{ textAlign: "center", color: "#4a6278", fontSize: 14, padding: 60 }}>
            No encontramos eventos con esos filtros.<br />
            <span style={{ fontSize: 12, color: "#7a96aa" }}>Intenta con otros criterios de búsqueda.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {eventos.map(ev => (
              <a key={ev.id} href={`/buscar/${ev.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#fff", borderRadius: 16, overflow: "hidden",
                  border: "0.5px solid #c8d8e8", transition: "transform 0.15s",
                }}>
                  <div style={{ position: "relative", paddingTop: "75%" }}>
                    <img
                      src={ev.url_imagen ?? PLACEHOLDER}
                      alt={ev.titulo}
                      style={{ position: "absolute", inset: 0, width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
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
                      {(ev.ciudades as any)?.nombre ?? ""}{ev.fecha_inicio ? ` · ${new Date(ev.fecha_inicio + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </div>
                    {ev.exposicion === "completa" && ev.costo_minimo !== null && (
                      <div style={{ fontSize: 13, color: "#1a9b8c", fontWeight: 600, marginTop: 6 }}>
                        {ev.costo_minimo === 0 ? "Gratuito" : `Desde $${ev.costo_minimo.toLocaleString("es-MX")} MXN`}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventosPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#4a6278" }}>Cargando...</div>}>
      <EventosContent />
    </Suspense>
  );
}
