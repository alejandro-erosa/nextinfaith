"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../../lib/supabase";
import { useUser } from "../../../../../context/UserContext";

type Categoria = { id: number; nombre: string; parent_id: number | null; slug: string };
type CategoriaGrupo = { id: number; nombre: string; subcategorias: Categoria[] };
type Fecha = { id?: number; fecha: string; hora_inicio: string; hora_fin: string; };

const fechaVacia = (): Fecha => ({ fecha: "", hora_inicio: "", hora_fin: "" });

const detectarTipo = (slug: string) => {
  if (!slug) return "general";
  if (slug.includes("concierto") || slug.includes("coro") || slug.includes("oracion") || slug.includes("festival") || slug.includes("musical")) return "concierto";
  if (slug.includes("retiro") || slug.includes("campamento") || slug.includes("encuentro") || slug.includes("adoracion") || slug.includes("hora-santa") || slug.includes("vigilia")) return "retiro";
  if (slug.includes("congreso") || slug.includes("taller") || slug.includes("seminario") || slug.includes("cumbre") || slug.includes("foro") || slug.includes("diplomado") || slug.includes("escuela")) return "conferencia";
  if (slug.includes("peregrinacion") || slug.includes("santuario") || slug.includes("internacional") || slug.includes("viaje")) return "peregrinacion";
  return "general";
};

const TIPO_LABEL: Record<string, string> = {
  concierto: "Concierto / Evento musical",
  retiro: "Retiro / Encuentro espiritual",
  conferencia: "Conferencia / Congreso",
  peregrinacion: "Peregrinación / Viaje católico",
  general: "Evento general",
};

export default function EditarEventoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const fileRef = useRef<HTMLInputElement>(null);
  //Estatus del usuario en cuanto a Permisos
  const { userId, userRol, requiereAprobacion } = useUser();

  const [tabActual, setTabActual] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorImagen, setErrorImagen] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Categorías
  const [grupos, setGrupos] = useState<CategoriaGrupo[]>([]);
  const [slugMap, setSlugMap] = useState<Record<number, string>>({});
  const [nombreCatPadre, setNombreCatPadre] = useState("");

  //Estatus del evento
  const [estadoPublicacion, setEstadoPublicacion] = useState("borrador");

  // Pestaña 1
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [ciudad, setCiudad] = useState("");
  const [estadoEvento, setEstadoEvento] = useState("");
  const [pais, setPais] = useState("México");
  const [venue, setVenue] = useState("");
  const [direccion, setDireccion] = useState("");
  const [modalidad, setModalidad] = useState("presencial");
  const [costoMinimo, setCostoMinimo] = useState(0);
  const [urlEvento, setUrlEvento] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [imagenActual, setImagenActual] = useState("");
  const [tienePrograma, setTienePrograma] = useState(false);
  const [programaDescripcion, setProgramaDescripcion] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [tieneLocalidades, setTieneLocalidades] = useState(false);

  // Pestaña 2
  const [fechas, setFechas] = useState<Fecha[]>([fechaVacia()]);

  // Pestaña 3
  const [artistas, setArtistas] = useState("");
  const [horaApertura, setHoraApertura] = useState("");
  const [edadMinima, setEdadMinima] = useState("");
  const [precioGeneral, setPrecioGeneral] = useState(0);
  const [precioVip, setPrecioVip] = useState(0);
  const [tieneZonaFamiliar, setTieneZonaFamiliar] = useState(false);
  const [cupoMaximo, setCupoMaximo] = useState("");
  const [precioCompleto, setPrecioCompleto] = useState(0);
  const [incluyeHospedaje, setIncluyeHospedaje] = useState(false);
  const [incluyeAlimentacion, setIncluyeAlimentacion] = useState(false);
  const [facilitador, setFacilitador] = useState("");
  const [requiereInscripcion, setRequiereInscripcion] = useState(false);
  const [ponentes, setPonentes] = useState("");
  const [tematica, setTematica] = useState("");
  const [capacidadAforo, setCapacidadAforo] = useState("");
  const [disponibleOnline, setDisponibleOnline] = useState(false);
  const [urlTransmision, setUrlTransmision] = useState("");
  const [periodicidadConf, setPeriodicidadConf] = useState("");
  const [periodicidadRetiro, setPeriodicidadRetiro] = useState("");
  const [agencia, setAgencia] = useState("");
  const [incluyeVuelo, setIncluyeVuelo] = useState(false);
  const [incluyeHotel, setIncluyeHotel] = useState(false);
  const [incluyeGuia, setIncluyeGuia] = useState(false);
  const [duracionDias, setDuracionDias] = useState("");
  const [precioPorPersona, setPrecioPorPersona] = useState(0);



  useEffect(() => {
    cargarCategorias();
    cargarEvento();
  }, []);

  const cargarCategorias = async () => {
    const { data } = await supabase
      .from("categorias")
      .select("id, nombre, parent_id, slug")
      .eq("activo", true)
      .order("orden");
    if (!data) return;
    const padres = data.filter((c: any) => !c.parent_id);
    const hijos = data.filter((c: any) => c.parent_id);
    setGrupos(padres.map((p: any) => ({
      id: p.id, nombre: p.nombre,
      subcategorias: hijos.filter((h: any) => h.parent_id === p.id),
    })));
    const sm: Record<number, string> = {};
    data.forEach((c: any) => { sm[c.id] = c.slug ?? ""; });
    setSlugMap(sm);
  };

  const cargarEvento = async () => {
    setLoading(true);
    const { data: ev } = await supabase
      .from("eventos")
      .select("*")
      .eq("id", id)
      .single();

    if (!ev) { setError("Evento no encontrado."); setLoading(false); return; }

    // Pre-llenar pestaña 1
    setTitulo(ev.titulo ?? "");
    setDescripcion(ev.descripcion ?? "");
    setCategoriaId(ev.categoria_id ?? "");
    setCiudad(ev.ciudad ?? "");
    setEstadoEvento(ev.estado ?? "");
    setPais(ev.pais ?? "México");
    setVenue(ev.venue ?? "");
    setDireccion(ev.direccion ?? "");
    setModalidad(ev.modalidad ?? "presencial");
    setCostoMinimo(ev.costo_minimo ?? 0);
    setUrlEvento(ev.url_evento ?? "");
    setImagenActual(ev.url_imagen ?? "");
    setTienePrograma(ev.tiene_programa ?? false);
    setTieneLocalidades(ev.tiene_localidades ?? false);
    setTelefonoContacto(ev.telefono_contacto ?? "");
    setEstadoPublicacion(ev.estado_publicacion ?? "borrador");
    setProgramaDescripcion(ev.programa_descripcion ?? "");

    // Nombre categoría padre
    // Se resolverá cuando slugMap esté listo — se maneja en onCategoriaChange

    // Pre-llenar pestaña 2
    const { data: fData } = await supabase
      .from("evento_fechas")
      .select("*")
      .eq("evento_id", id)
      .order("fecha");
    if (fData && fData.length > 0) {
      setFechas(fData.map((f: any) => ({
        id: f.id,
        fecha: f.fecha ?? "",
        hora_inicio: f.hora_inicio ?? "",
        hora_fin: f.hora_fin ?? "",
      })));
    }

    // Pre-llenar pestaña 3 según tipo
    const slug = ev.categoria_id ? "" : ""; // se resolverá con slugMap
    const { data: extC } = await supabase.from("ext_conciertos").select("*").eq("evento_id", id).maybeSingle();
    if (extC) {
      setArtistas(extC.artistas ?? "");
      setHoraApertura(extC.hora_apertura_puertas ?? "");
      setEdadMinima(extC.edad_minima?.toString() ?? "");
      setPrecioGeneral(extC.precio_general ?? 0);
      setPrecioVip(extC.precio_vip ?? 0);
      setTieneZonaFamiliar(extC.tiene_zona_familiar ?? false);
    }
    const { data: extR } = await supabase.from("ext_retiros").select("*").eq("evento_id", id).maybeSingle();
    if (extR) {
      setCupoMaximo(extR.cupo_maximo?.toString() ?? "");
      setPrecioCompleto(extR.precio_completo ?? 0);
      setIncluyeHospedaje(extR.incluye_hospedaje ?? false);
      setIncluyeAlimentacion(extR.incluye_alimentacion ?? false);
      setFacilitador(extR.facilitador ?? "");
      setRequiereInscripcion(extR.requiere_inscripcion_previa ?? false);
      setPeriodicidadRetiro(extR.periodicidad ?? "");
    }
    const { data: extConf } = await supabase.from("ext_conferencias").select("*").eq("evento_id", id).maybeSingle();
    if (extConf) {
      setPonentes(extConf.ponentes ?? "");
      setTematica(extConf.tematica ?? "");
      setCapacidadAforo(extConf.capacidad_aforo?.toString() ?? "");
      setDisponibleOnline(extConf.disponible_online ?? false);
      setUrlTransmision(extConf.url_transmision ?? "");
      setPeriodicidadConf(extConf.periodicidad ?? "");
    }
    const { data: extP } = await supabase.from("ext_peregrinaciones").select("*").eq("evento_id", id).maybeSingle();
    if (extP) {
      setAgencia(extP.agencia ?? "");
      setIncluyeVuelo(extP.incluye_vuelo ?? false);
      setIncluyeHotel(extP.incluye_hotel ?? false);
      setIncluyeGuia(extP.incluye_guia_espiritual ?? false);
      setDuracionDias(extP.duracion_dias?.toString() ?? "");
      setPrecioPorPersona(extP.precio_por_persona ?? 0);
      setCupoMaximo(extP.cupo_maximo?.toString() ?? "");
    }

    setLoading(false);
  };

  const onCategoriaChange = (catId: number) => {
    setCategoriaId(catId);
    const grupo = grupos.find(g => g.subcategorias.some(s => s.id === catId));
    setNombreCatPadre(grupo?.nombre ?? "");
  };

  // Actualizar nombre cat padre cuando slugMap y categoriaId estén listos
  useEffect(() => {
    if (categoriaId && grupos.length > 0) {
      const grupo = grupos.find(g => g.subcategorias.some(s => s.id === categoriaId));
      setNombreCatPadre(grupo?.nombre ?? "");
    }
  }, [slugMap, categoriaId, grupos]);

  const slugActual = categoriaId ? (slugMap[categoriaId as number] ?? "") : "";
  const tipo = detectarTipo(slugActual);
  const subcatNombre = categoriaId ? grupos.flatMap(g => g.subcategorias).find(s => s.id === categoriaId)?.nombre ?? "" : "";
  const TABS = ["Información general", "Fechas y sedes", "Detalles", "Corresponsales"];

  const onImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenFile(file);
    setImagenPreview(URL.createObjectURL(file));
    setErrorImagen("");
  };

  const subirImagen = async (): Promise<{ url: string | null; errorMsg: string }> => {
    if (!imagenFile) return { url: null, errorMsg: "" };
    setSubiendoImagen(true);
    const ext = imagenFile.name.split(".").pop();
    const path = `evento-${id}-${Date.now()}.${ext}`;
    const { error: errUp } = await supabase.storage
      .from("eventos")
      .upload(path, imagenFile, { upsert: true });
    setSubiendoImagen(false);
    if (errUp) return { url: null, errorMsg: `Error al subir imagen: ${errUp.message}` };
    const { data } = supabase.storage.from("eventos").getPublicUrl(path);
    return { url: data.publicUrl, errorMsg: "" };
  };

  const reintentarSubidaImagen = async () => {
    if (!imagenFile) return;
    setErrorImagen("");
    const { url, errorMsg } = await subirImagen();
    if (errorMsg) { setErrorImagen(errorMsg); return; }
    if (url) {
      await supabase.from("eventos").update({ url_imagen: url }).eq("id", id);
      setImagenActual(url);
      setImagenFile(null);
      setImagenPreview("");
    }
  };

  // GUARDAR PESTAÑA 1
  const enviarARevision = async () => {
    setSaving(true);
    await supabase.from("eventos")
      .update({ estado_publicacion: "en_revision" })
      .eq("id", id);
    setEstadoPublicacion("en_revision");
    setSaving(false);
  };
  const guardarTab1 = async () => {
    if (!titulo.trim()) { setError("El título es obligatorio."); return; }
    if (!categoriaId) { setError("Selecciona una categoría."); return; }
    if (!ciudad.trim()) { setError("La ciudad es obligatoria."); return; }
    setSaving(true); setError(""); setErrorImagen("");

    await supabase.from("eventos").update({
      titulo, descripcion, categoria_id: categoriaId,
      ciudad, estado: estadoEvento, pais, venue, direccion, modalidad,
      costo_minimo: costoMinimo, url_evento: urlEvento || null,
      tiene_programa: tienePrograma, tiene_localidades: tieneLocalidades,
      telefono_contacto: telefonoContacto || null,
      programa_descripcion: tienePrograma ? (programaDescripcion || null) : null,
    }).eq("id", id);

    if (imagenFile) {
      const { url, errorMsg } = await subirImagen();
      if (errorMsg) {
        setErrorImagen(errorMsg);
      } else if (url) {
        await supabase.from("eventos").update({ url_imagen: url }).eq("id", id);
        setImagenActual(url);
        setImagenFile(null);
        setImagenPreview("");
      }
    }

    setSaving(false);
    setTabActual(1);
  };

  // GUARDAR PESTAÑA 2
  const guardarTab2 = async () => {
    if (!fechas[0].fecha) { setError("Agrega al menos una fecha."); return; }
    setSaving(true); setError("");

    await supabase.from("evento_fechas").delete().eq("evento_id", id);
    await supabase.from("evento_fechas").insert(
      fechas.map(f => ({
        evento_id: Number(id),
        fecha: f.fecha || null,
        hora_inicio: f.hora_inicio || null,
        hora_fin: f.hora_fin || null,
        activa: true,
      }))
    );

    const primeraFecha = fechas[0];
    const ultimaFecha = fechas[fechas.length - 1];
    await supabase.from("eventos").update({
      fecha_inicio: primeraFecha.fecha || null,
      fecha_fin: ultimaFecha.fecha || null,
      hora_inicio: primeraFecha.hora_inicio || null,
      venue: venue || null,
    }).eq("id", id);

    setSaving(false);
    setTabActual(2);
  };

  // GUARDAR PESTAÑA 3
  const guardarTab3 = async () => {
    setSaving(true); setError("");
    // Limpiar ext_* de otros tipos al guardar
    await supabase.from("ext_conciertos").delete().eq("evento_id", Number(id));
    await supabase.from("ext_retiros").delete().eq("evento_id", Number(id));
    await supabase.from("ext_conferencias").delete().eq("evento_id", Number(id));
    await supabase.from("ext_peregrinaciones").delete().eq("evento_id", Number(id));
    if (tipo === "concierto") {
      await supabase.from("ext_conciertos").delete().eq("evento_id", id);
      await supabase.from("ext_conciertos").insert({
        evento_id: Number(id), artistas,
        hora_apertura_puertas: horaApertura || null,
        edad_minima: edadMinima ? parseInt(edadMinima) : null,
        precio_general: precioGeneral, precio_vip: precioVip,
        tiene_zona_familiar: tieneZonaFamiliar,
      });
    }
    if (tipo === "retiro") {
      await supabase.from("ext_retiros").delete().eq("evento_id", id);
      await supabase.from("ext_retiros").insert({
        evento_id: Number(id),
        cupo_maximo: cupoMaximo ? parseInt(cupoMaximo) : null,
        precio_completo: precioCompleto,
        incluye_hospedaje: incluyeHospedaje,
        incluye_alimentacion: incluyeAlimentacion,
        facilitador: facilitador || null,
        requiere_inscripcion_previa: requiereInscripcion,
        periodicidad: periodicidadRetiro || null,
      });
    }
    if (tipo === "conferencia") {
      await supabase.from("ext_conferencias").delete().eq("evento_id", id);
      await supabase.from("ext_conferencias").insert({
        evento_id: Number(id), ponentes, tematica,
        capacidad_aforo: capacidadAforo ? parseInt(capacidadAforo) : null,
        disponible_online: disponibleOnline,
        url_transmision: urlTransmision || null,
        periodicidad: periodicidadConf || null,
      });
    }
    if (tipo === "peregrinacion") {
      await supabase.from("ext_peregrinaciones").delete().eq("evento_id", id);
      await supabase.from("ext_peregrinaciones").insert({
        evento_id: Number(id), agencia: agencia || null,
        incluye_vuelo: incluyeVuelo, incluye_hotel: incluyeHotel,
        incluye_guia_espiritual: incluyeGuia,
        duracion_dias: duracionDias ? parseInt(duracionDias) : null,
        precio_por_persona: precioPorPersona,
        cupo_maximo: cupoMaximo ? parseInt(cupoMaximo) : null,
      });
    }

    setSaving(false);
    setTabActual(3);
  };

  const finalizar = () => router.push(`/portal/dashboard/eventos/${id}`);

  const agregarFecha = () => setFechas([...fechas, fechaVacia()]);
  const quitarFecha = (i: number) => setFechas(fechas.filter((_, idx) => idx !== i));
  const actualizarFecha = (i: number, campo: keyof Fecha, valor: string) => {
    const n = [...fechas]; n[i] = { ...n[i], [campo]: valor }; setFechas(n);
  };

  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#4a6278", marginBottom: 4, display: "block" };
  const inp: React.CSSProperties = { width: "100%", border: "0.5px solid #c8d8e8", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none" };
  const card: React.CSSProperties = { background: "#fff", border: "0.5px solid #c8d8e8", borderRadius: 12, padding: 16, marginBottom: 16 };
  const cardT: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: "#4a6278", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" };
  const g2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const g3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };
  const chk: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };

  if (loading) return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />
      <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#4a6278" }}>Cargando evento...</div>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#1a2b3c" }}>Editar evento</div>
          <div style={{ fontSize: 12, color: "#7a9ab0", marginTop: 2 }}>Los cambios se guardan pestaña por pestaña.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
           <button
            onClick={() => router.push("/portal/dashboard")}
            style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
           Ir al dashboard
           </button>
        </div>
        <button onClick={() => router.push(`/portal/dashboard/eventos/${id}`)}
          style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
          ← Volver al detalle
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "0.5px solid #c8d8e8", marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <div key={i} onClick={() => setTabActual(i)} style={{
            padding: "8px 16px", fontSize: 13, cursor: "pointer",
            color: tabActual === i ? "#1a3a6b" : "#4a6278",
            borderBottom: tabActual === i ? "2px solid #1a3a6b" : "2px solid transparent",
            fontWeight: tabActual === i ? 500 : 400,
            marginBottom: -0.5,
          }}>{t}</div>
        ))}
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {(estadoPublicacion === "borrador" || estadoPublicacion === "rechazado") && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fff8ec", border: "0.5px solid #e8a020", borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: "#7a4f00" }}>
            Este evento está en <strong>{estadoPublicacion}</strong>. Puedes corregir lo necesario y enviarlo a revisión.
          </div>
          <button
            onClick={enviarARevision}
            disabled={saving}
            style={{ marginLeft: 16, padding: "6px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#e8a020", color: "#fff", opacity: saving ? 0.6 : 1, flexShrink: 0 }}>
            {saving ? "Enviando..." : "Enviar a revisión"}
          </button>
        </div>
      )}

      {estadoPublicacion === "en_revision" && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#dff0fb", border: "0.5px solid #b5d4f4", borderRadius: 8, fontSize: 13, color: "#185FA5" }}>
          ✓ Evento en revisión. Un administrador lo revisará próximamente.
        </div>
      )}


      {/* PESTAÑA 1 */}
      {tabActual === 0 && (
        <>
          <div style={card}>
            <div style={cardT}>Información principal</div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Título del evento *</label>
              <input style={inp} value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Categoría *</label>
              <select style={inp} value={categoriaId} onChange={e => onCategoriaChange(Number(e.target.value))}>
                <option value="">Selecciona una categoría</option>
                {grupos.map(g => (
                  <optgroup key={g.id} label={g.nombre}>
                    {g.subcategorias.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {nombreCatPadre && <div style={{ fontSize: 11, color: "#7a9ab0", marginTop: 4 }}>Categoría padre: {nombreCatPadre}</div>}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Descripción</label>
              <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
            </div>
          </div>

          <div style={card}>
            <div style={cardT}>Ubicación</div>
            <div style={{ ...g3, marginBottom: 12 }}>
              <div><label style={lbl}>Ciudad *</label><input style={inp} value={ciudad} onChange={e => setCiudad(e.target.value)} /></div>
              <div><label style={lbl}>Estado</label><input style={inp} value={estadoEvento} onChange={e => setEstadoEvento(e.target.value)} /></div>
              <div><label style={lbl}>País</label><input style={inp} value={pais} onChange={e => setPais(e.target.value)} /></div>
            </div>
            <div style={g2}>
              <div><label style={lbl}>Venue / Sede</label><input style={inp} value={venue} onChange={e => setVenue(e.target.value)} /></div>
              <div><label style={lbl}>Dirección</label><input style={inp} value={direccion} onChange={e => setDireccion(e.target.value)} /></div>
            </div>
          </div>

          <div style={card}>
            <div style={cardT}>Formato y costo</div>
            <div style={g3}>
              <div>
                <label style={lbl}>Modalidad</label>
                <select style={inp} value={modalidad} onChange={e => setModalidad(e.target.value)}>
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>
              <div><label style={lbl}>Costo mínimo (MXN)</label><input style={inp} type="number" min={0} value={costoMinimo} onChange={e => setCostoMinimo(Number(e.target.value))} /></div>
              <div><label style={lbl}>Sitio oficial del evento</label><input style={inp} value={urlEvento} onChange={e => setUrlEvento(e.target.value)} placeholder="https://..." /></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Teléfono de contacto del evento</label>
              <input style={{ ...inp, maxWidth: 260 }} value={telefonoContacto} onChange={e => setTelefonoContacto(e.target.value)} placeholder="Ej. 52 55 1234 5678" />
              <div style={{ fontSize: 11, color: "#7a9ab0", marginTop: 4 }}>Número visible al público para información o venta de boletos de este evento específico.</div>
            </div>
          </div>

          <div style={card}>
            <div style={cardT}>Imagen del evento</div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div onClick={() => fileRef.current?.click()} style={{
                width: 160, height: 120, borderRadius: 8, flexShrink: 0, cursor: "pointer",
                border: errorImagen ? "1.5px solid #F09595" : "0.5px dashed #b5d4f4",
                background: "#dff0fb", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {imagenPreview
                  ? <img src={imagenPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : imagenActual
                    ? <img src={imagenActual} alt="actual" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 11, color: "#4a6278", textAlign: "center", padding: 8 }}>Clic para seleccionar imagen</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                {imagenActual && !imagenPreview && (
                  <div style={{ fontSize: 11, color: "#0F6E56", marginBottom: 8 }}>✓ Imagen actual cargada</div>
                )}
                <div style={{ fontSize: 12, color: "#4a6278", marginBottom: 8 }}>Proporción recomendada: 4:3. Formatos: JPG, PNG, WEBP.</div>
                <button onClick={() => fileRef.current?.click()}
                  style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
                  {imagenFile ? "Cambiar imagen" : imagenActual ? "Reemplazar imagen" : "Seleccionar imagen"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImagenChange} />
                {errorImagen && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 12, color: "#A32D2D" }}>
                    <div style={{ marginBottom: 6 }}>{errorImagen}</div>
                    {imagenFile && (
                      <button onClick={reintentarSubidaImagen} disabled={subiendoImagen}
                        style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none", background: "#A32D2D", color: "#fff", opacity: subiendoImagen ? 0.6 : 1 }}>
                        {subiendoImagen ? "Subiendo..." : "Reintentar subida"}
                      </button>
                    )}
                  </div>
                )}
                {subiendoImagen && !errorImagen && <div style={{ marginTop: 8, fontSize: 12, color: "#1a9b8c" }}>Subiendo imagen...</div>}
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={cardT}>Configuración de pestañas</div>
            <div style={{ fontSize: 12, color: "#4a6278", marginBottom: 12 }}>Activa las pestañas adicionales que aplican a este evento.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={chk}>
                <input type="checkbox" id="tienePrograma" checked={tienePrograma} onChange={e => setTienePrograma(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="tienePrograma" style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>Tiene programa — agenda de sesiones, artistas o expositores</label>
              </div>
              {tienePrograma && (
                <div style={{ marginLeft: 24 }}>
                  <label style={lbl}>Descripción del programa</label>
                  <textarea style={{ ...inp, minHeight: 100, resize: "vertical" }} value={programaDescripcion} onChange={e => setProgramaDescripcion(e.target.value)} placeholder="Describe el programa, módulos, sesiones, maestros, horarios, etc." />
                </div>
              )}
              <div style={chk}>
                <input type="checkbox" id="tieneLocalidades" checked={tieneLocalidades} onChange={e => setTieneLocalidades(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="tieneLocalidades" style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>Tiene localidades — zonas, asientos o tipos de acceso con precio</label>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 32 }}>
            <button onClick={guardarTab1} disabled={saving}
              style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Guardando..." : "Guardar y continuar →"}
            </button>
          </div>
        </>
      )}

      {/* PESTAÑA 2 */}
      {tabActual === 1 && (
        <>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={cardT}>Fechas del evento</div>
              <button onClick={agregarFecha}
                style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #1a3a6b", background: "#fff", color: "#1a3a6b" }}>
                + Agregar fecha
              </button>
            </div>
            {fechas.map((f, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: "0.5px solid #e8f0f8" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#4a6278" }}>Fecha {i + 1}</span>
                  {fechas.length > 1 && (
                    <button onClick={() => quitarFecha(i)}
                      style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "0.5px solid #F09595", background: "#FCEBEB", color: "#A32D2D" }}>
                      Quitar
                    </button>
                  )}
                </div>
                <div style={{ ...g3, marginBottom: 8 }}>
                  <div><label style={lbl}>Fecha *</label><input style={inp} type="date" value={f.fecha} onChange={e => actualizarFecha(i, "fecha", e.target.value)} /></div>
                  <div><label style={lbl}>Hora inicio</label><input style={inp} type="time" value={f.hora_inicio} onChange={e => actualizarFecha(i, "hora_inicio", e.target.value)} /></div>
                  <div><label style={lbl}>Hora fin</label><input style={inp} type="time" value={f.hora_fin} onChange={e => actualizarFecha(i, "hora_fin", e.target.value)} /></div>
                </div>
                <div style={g3}>
                  <div><label style={lbl}>Ciudad</label><input style={inp} value={f.ciudad} onChange={e => actualizarFecha(i, "ciudad", e.target.value)} /></div>
                  <div><label style={lbl}>Estado</label><input style={inp} value={f.estado} onChange={e => actualizarFecha(i, "estado", e.target.value)} /></div>
                  <div><label style={lbl}>Venue / Sede</label><input style={inp} value={f.venue} onChange={e => actualizarFecha(i, "venue", e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 32 }}>
            <button onClick={() => setTabActual(0)}
              style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
              ← Anterior
            </button>
            <button onClick={guardarTab2} disabled={saving}
              style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Guardando..." : "Guardar y continuar →"}
            </button>
          </div>
        </>
      )}

      {/* PESTAÑA 3 */}
      {tabActual === 2 && (
        <>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#dff0fb", borderRadius: 8, fontSize: 13, color: "#185FA5" }}>
            Editando detalles para: <strong>{subcatNombre}</strong> — {TIPO_LABEL[tipo]}
          </div>

          {tipo === "concierto" && (
            <div style={card}>
              <div style={cardT}>Detalles del concierto</div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Artistas (separados por coma)</label>
                <input style={inp} value={artistas} onChange={e => setArtistas(e.target.value)} />
              </div>
              <div style={{ ...g3, marginBottom: 12 }}>
                <div><label style={lbl}>Apertura de puertas</label><input style={inp} type="time" value={horaApertura} onChange={e => setHoraApertura(e.target.value)} /></div>
                <div><label style={lbl}>Precio general (MXN)</label><input style={inp} type="number" min={0} value={precioGeneral} onChange={e => setPrecioGeneral(Number(e.target.value))} /></div>
                <div><label style={lbl}>Precio VIP (MXN)</label><input style={inp} type="number" min={0} value={precioVip} onChange={e => setPrecioVip(Number(e.target.value))} /></div>
              </div>
              <div style={g2}>
                <div><label style={lbl}>Edad mínima</label><input style={inp} type="number" min={0} value={edadMinima} onChange={e => setEdadMinima(e.target.value)} /></div>
                <div style={chk}>
                  <input type="checkbox" id="zf" checked={tieneZonaFamiliar} onChange={e => setTieneZonaFamiliar(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <label htmlFor="zf" style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>Tiene zona familiar</label>
                </div>
              </div>
            </div>
          )}

          {tipo === "retiro" && (
            <div style={card}>
              <div style={cardT}>Detalles del retiro / seminario</div>
              <div style={{ ...g3, marginBottom: 12 }}>
                <div><label style={lbl}>Cupo máximo</label><input style={inp} type="number" min={0} value={cupoMaximo} onChange={e => setCupoMaximo(e.target.value)} /></div>
                <div><label style={lbl}>Precio completo (MXN)</label><input style={inp} type="number" min={0} value={precioCompleto} onChange={e => setPrecioCompleto(Number(e.target.value))} /></div>
                <div><label style={lbl}>Facilitador espiritual</label><input style={inp} value={facilitador} onChange={e => setFacilitador(e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Periodicidad</label>
                <select style={{ ...inp, maxWidth: 260 }} value={periodicidadRetiro} onChange={e => setPeriodicidadRetiro(e.target.value)}>
                  <option value="">Selecciona...</option>
                  <option value="unica">Única (no se repite)</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { id: "hosp", label: "Incluye hospedaje", val: incluyeHospedaje, set: setIncluyeHospedaje },
                  { id: "alim", label: "Incluye alimentación", val: incluyeAlimentacion, set: setIncluyeAlimentacion },
                  { id: "insc", label: "Requiere inscripción previa", val: requiereInscripcion, set: setRequiereInscripcion },
                ].map(c => (
                  <div key={c.id} style={chk}>
                    <input type="checkbox" id={c.id} checked={c.val} onChange={e => c.set(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <label htmlFor={c.id} style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>{c.label}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tipo === "conferencia" && (
            <div style={card}>
              <div style={cardT}>Detalles de la conferencia / congreso / diplomado</div>
              <div style={{ marginBottom: 12 }}><label style={lbl}>Ponentes (separados por coma)</label><input style={inp} value={ponentes} onChange={e => setPonentes(e.target.value)} /></div>
              <div style={{ marginBottom: 12 }}><label style={lbl}>Temática central</label><input style={inp} value={tematica} onChange={e => setTematica(e.target.value)} /></div>
              <div style={{ ...g2, marginBottom: 12 }}>
                <div><label style={lbl}>Capacidad de aforo</label><input style={inp} type="number" min={0} value={capacidadAforo} onChange={e => setCapacidadAforo(e.target.value)} /></div>
                <div>
                  <label style={lbl}>Periodicidad</label>
                  <select style={inp} value={periodicidadConf} onChange={e => setPeriodicidadConf(e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option value="unica">Única (no se repite)</option>
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={lbl}>URL transmisión online</label><input style={inp} value={urlTransmision} onChange={e => setUrlTransmision(e.target.value)} placeholder="https://..." /></div>
              <div style={chk}>
                <input type="checkbox" id="online" checked={disponibleOnline} onChange={e => setDisponibleOnline(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="online" style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>Disponible en línea</label>
              </div>
            </div>
          )}

          {tipo === "peregrinacion" && (
            <div style={card}>
              <div style={cardT}>Detalles de la peregrinación</div>
              <div style={{ ...g3, marginBottom: 12 }}>
                <div><label style={lbl}>Agencia organizadora</label><input style={inp} value={agencia} onChange={e => setAgencia(e.target.value)} /></div>
                <div><label style={lbl}>Duración (días)</label><input style={inp} type="number" min={1} value={duracionDias} onChange={e => setDuracionDias(e.target.value)} /></div>
                <div><label style={lbl}>Precio por persona (MXN)</label><input style={inp} type="number" min={0} value={precioPorPersona} onChange={e => setPrecioPorPersona(Number(e.target.value))} /></div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { id: "vuelo", label: "Incluye vuelo", val: incluyeVuelo, set: setIncluyeVuelo },
                  { id: "hotel", label: "Incluye hotel", val: incluyeHotel, set: setIncluyeHotel },
                  { id: "guia", label: "Incluye guía espiritual", val: incluyeGuia, set: setIncluyeGuia },
                ].map(c => (
                  <div key={c.id} style={chk}>
                    <input type="checkbox" id={c.id} checked={c.val} onChange={e => c.set(e.target.checked)} style={{ width: 16, height: 16 }} />
                    <label htmlFor={c.id} style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>{c.label}</label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tipo === "general" && (
            <div style={card}>
              <div style={{ fontSize: 13, color: "#4a6278", textAlign: "center", padding: 24 }}>Esta categoría no requiere campos adicionales.</div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 32 }}>
            <button onClick={() => setTabActual(1)}
              style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
              ← Anterior
            </button>
            <button onClick={guardarTab3} disabled={saving}
              style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Guardando..." : "Guardar y continuar →"}
            </button>
          </div>
        </>
      )}

      {/* PESTAÑA 4 */}
      {tabActual === 3 && (
      <>
        <div style={card}>
         <div style={cardT}>Corresponsales</div>
          <div style={{ fontSize: 13, color: "#4a6278", textAlign: "center", padding: 24 }}>
            La asignación de corresponsales se gestiona desde el detalle del evento.<br />
            <span style={{ fontSize: 12, color: "#7a9ab0" }}>Finaliza la edición y regresa al detalle para gestionar corresponsales.</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 32 }}>
          <button onClick={() => setTabActual(2)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>← Anterior</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => router.push("/portal/dashboard")}
              style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>
              Ir al dashboard
            </button>
            <button
              onClick={finalizar}
              style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#0F6E56", color: "#fff" }}>
              Ver evento →
            </button>
          </div>
        </div>
      </>
      )}
    </div>
  );
}
