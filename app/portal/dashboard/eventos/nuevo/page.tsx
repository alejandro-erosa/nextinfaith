"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { useUser } from "../../../../context/UserContext";

type Categoria = { id: number; nombre: string; parent_id: number | null; slug: string };
type CategoriaGrupo = { id: number; nombre: string; subcategorias: Categoria[] };
type Fecha = { fecha: string; hora_inicio: string; hora_fin: string };

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

const PERIODICIDAD_OPCIONES = [
  { value: "", label: "Selecciona..." },
  { value: "unica", label: "Única (no se repite)" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
  { value: "anual", label: "Anual" },
];

export default function NuevoEventoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  //Estatus del usuario en cuanto a Permisos
  const { userId, userRol, requiereAprobacion } = useUser();

  const [estadoPublicacion, setEstadoPublicacion] = useState("borrador");
  const [tabActual, setTabActual] = useState(0);
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [grupos, setGrupos] = useState<CategoriaGrupo[]>([]);
  const [slugMap, setSlugMap] = useState<Record<number, string>>({});
  const [nombreCatPadre, setNombreCatPadre] = useState("");

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
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState("");
  const [tienePrograma, setTienePrograma] = useState(false);
  const [tieneLocalidades, setTieneLocalidades] = useState(false);
  const [programaDescripcion, setProgramaDescripcion] = useState("");

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
  const [periodicidadRetiro, setPeriodicidadRetiro] = useState("");
  const [ponentes, setPonentes] = useState("");
  const [tematica, setTematica] = useState("");
  const [capacidadAforo, setCapacidadAforo] = useState("");
  const [disponibleOnline, setDisponibleOnline] = useState(false);
  const [urlTransmision, setUrlTransmision] = useState("");
  const [periodicidadConf, setPeriodicidadConf] = useState("");
  const [agencia, setAgencia] = useState("");
  const [incluyeVuelo, setIncluyeVuelo] = useState(false);
  const [incluyeHotel, setIncluyeHotel] = useState(false);
  const [incluyeGuia, setIncluyeGuia] = useState(false);
  const [duracionDias, setDuracionDias] = useState("");
  const [precioPorPersona, setPrecioPorPersona] = useState(0);

  useEffect(() => { cargarCategorias(); }, []);

  const cargarCategorias = async () => {
    const { data } = await supabase.from("categorias").select("id, nombre, parent_id, slug").eq("activo", true).order("orden");
    if (!data) return;
    const padres = data.filter((c: any) => !c.parent_id);
    const hijos = data.filter((c: any) => c.parent_id);
    setGrupos(padres.map((p: any) => ({ id: p.id, nombre: p.nombre, subcategorias: hijos.filter((h: any) => h.parent_id === p.id) })));
    const sm: Record<number, string> = {};
    data.forEach((c: any) => { sm[c.id] = c.slug ?? ""; });
    setSlugMap(sm);
  };

  const onCategoriaChange = (id: number) => {
    setCategoriaId(id);
    const grupo = grupos.find(g => g.subcategorias.some(s => s.id === id));
    setNombreCatPadre(grupo?.nombre ?? "");
  };

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

  const subirImagen = async (eventoIdParam: number): Promise<{ url: string | null; errorMsg: string }> => {
    if (!imagenFile) return { url: null, errorMsg: "" };
    setSubiendoImagen(true);
    const ext = imagenFile.name.split(".").pop();
    const path = `evento-${eventoIdParam}-${Date.now()}.${ext}`;
    const { error: errUp } = await supabase.storage.from("eventos").upload(path, imagenFile, { upsert: true });
    setSubiendoImagen(false);
    if (errUp) return { url: null, errorMsg: `Error al subir imagen: ${errUp.message}` };
    const { data } = supabase.storage.from("eventos").getPublicUrl(path);
    return { url: data.publicUrl, errorMsg: "" };
  };

  const reintentarSubidaImagen = async () => {
    if (!eventoId || !imagenFile) return;
    setErrorImagen("");
    const { url, errorMsg } = await subirImagen(eventoId);
    if (errorMsg) { setErrorImagen(errorMsg); return; }
    if (url) {
      await supabase.from("eventos").update({ url_imagen: url }).eq("id", eventoId);
      setImagenFile(null); setImagenPreview(""); setErrorImagen("");
    }
  };

  const guardarTab1 = async () => {
    if (!titulo.trim()) { setError("El título es obligatorio."); return; }
    if (!categoriaId) { setError("Selecciona una categoría."); return; }
    if (!ciudad.trim()) { setError("La ciudad es obligatoria."); return; }
    setSaving(true); setError(""); setErrorImagen("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sesión expirada."); setSaving(false); return; }

    const campos = {
      titulo, descripcion, categoria_id: categoriaId,
      ciudad, estado: estadoEvento, pais, venue, direccion, modalidad,
      costo_minimo: costoMinimo, url_evento: urlEvento || null,
      telefono_contacto: telefonoContacto || null,
      programa_descripcion: tienePrograma ? (programaDescripcion || null) : null,
      tiene_programa: tienePrograma, tiene_localidades: tieneLocalidades,
    };

    if (eventoId) {
      await supabase.from("eventos").update(campos).eq("id", eventoId);
      if (imagenFile) {
        const { url, errorMsg } = await subirImagen(eventoId);
        if (errorMsg) { setErrorImagen(errorMsg); }
        else if (url) { await supabase.from("eventos").update({ url_imagen: url }).eq("id", eventoId); setImagenFile(null); setImagenPreview(""); }
      }
    } else {
      const { data: ev, error: errEv } = await supabase.from("eventos").insert({
        ...campos, organizador_id: user.id, creado_por: user.id, estado_publicacion: "borrador", exposicion: "basica",
      }).select().single();
      if (errEv || !ev) { setError("Error al guardar: " + (errEv?.message ?? "")); setSaving(false); return; }
      setEventoId(ev.id);
      setEstadoPublicacion(ev.estado_publicacion ?? "borrador");
      if (imagenFile) {
        const { url, errorMsg } = await subirImagen(ev.id);
        if (errorMsg) { setErrorImagen(errorMsg); }
        else if (url) { await supabase.from("eventos").update({ url_imagen: url }).eq("id", ev.id); setImagenFile(null); setImagenPreview(""); }
      }
    }
    setSaving(false);
    setTabActual(1);
  };

  const guardarTab2 = async () => {
    if (!eventoId) { setError("Guarda la información general primero."); return; }
   // if (!fechas[0].fecha) { setError("Agrega al menos una fecha."); return; }   VAlidadción de tener al menos una fecha elimiada por Alejandro Erosa 2026 03 21 
    setSaving(true); setError("");
    await supabase.from("evento_fechas").delete().eq("evento_id", eventoId);
    await supabase.from("evento_fechas").insert(fechas.map(f => ({ evento_id: eventoId, fecha: f.fecha || null, hora_inicio: f.hora_inicio || null, hora_fin: f.hora_fin || null, activa: true })));
    const primeraFecha = fechas[0]; const ultimaFecha = fechas[fechas.length - 1];
    await supabase.from("eventos").update({ fecha_inicio: primeraFecha.fecha || null, fecha_fin: ultimaFecha.fecha || null, hora_inicio: primeraFecha.hora_inicio || null, venue: venue || null }).eq("id", eventoId);
    setSaving(false); setTabActual(2);
  };

  const guardarTab3 = async () => {
    if (!eventoId) { setError("Guarda la información general primero."); return; }
    setSaving(true); setError("");
    if (tipo === "concierto") {
      await supabase.from("ext_conciertos").delete().eq("evento_id", eventoId);
      await supabase.from("ext_conciertos").insert({ evento_id: eventoId, artistas, hora_apertura_puertas: horaApertura || null, edad_minima: edadMinima ? parseInt(edadMinima) : null, precio_general: precioGeneral, precio_vip: precioVip, tiene_zona_familiar: tieneZonaFamiliar });
    }
    if (tipo === "retiro") {
      await supabase.from("ext_retiros").delete().eq("evento_id", eventoId);
      await supabase.from("ext_retiros").insert({ evento_id: eventoId, cupo_maximo: cupoMaximo ? parseInt(cupoMaximo) : null, precio_completo: precioCompleto, incluye_hospedaje: incluyeHospedaje, incluye_alimentacion: incluyeAlimentacion, facilitador: facilitador || null, requiere_inscripcion_previa: requiereInscripcion, periodicidad: periodicidadRetiro || null });
    }
    if (tipo === "conferencia") {
      await supabase.from("ext_conferencias").delete().eq("evento_id", eventoId);
      await supabase.from("ext_conferencias").insert({ evento_id: eventoId, ponentes, tematica, capacidad_aforo: capacidadAforo ? parseInt(capacidadAforo) : null, disponible_online: disponibleOnline, url_transmision: urlTransmision || null, periodicidad: periodicidadConf || null });
    }
    if (tipo === "peregrinacion") {
      await supabase.from("ext_peregrinaciones").delete().eq("evento_id", eventoId);
      await supabase.from("ext_peregrinaciones").insert({ evento_id: eventoId, agencia: agencia || null, incluye_vuelo: incluyeVuelo, incluye_hotel: incluyeHotel, incluye_guia_espiritual: incluyeGuia, duracion_dias: duracionDias ? parseInt(duracionDias) : null, precio_por_persona: precioPorPersona, cupo_maximo: cupoMaximo ? parseInt(cupoMaximo) : null });
    }
    setSaving(false); setTabActual(3);
  };
  
  const enviarARevision = async () => {
    if (!eventoId) return;
    setSaving(true);
    await supabase.from("eventos")
      .update({ estado_publicacion: "en_revision" })
      .eq("id", eventoId);
    setEstadoPublicacion("en_revision");
    setSaving(false);
  };

  const finalizar = () => { if (eventoId) router.push(`/portal/dashboard/eventos/${eventoId}`); };
  const agregarFecha = () => setFechas([...fechas, fechaVacia()]);
  const quitarFecha = (i: number) => setFechas(fechas.filter((_, idx) => idx !== i));
  const actualizarFecha = (i: number, campo: keyof Fecha, valor: string) => { const n = [...fechas]; n[i] = { ...n[i], [campo]: valor }; setFechas(n); };

  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: "#4a6278", marginBottom: 4, display: "block" };
  const inp: React.CSSProperties = { width: "100%", border: "0.5px solid #c8d8e8", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#1a2b3c", background: "#fff", outline: "none" };
  const card: React.CSSProperties = { background: "#fff", border: "0.5px solid #c8d8e8", borderRadius: 12, padding: 16, marginBottom: 16 };
  const cardT: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: "#4a6278", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" };
  const g2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const g3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };
  const chk: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg,#1a3a6b,#1a9b8c)", borderRadius: 2, marginBottom: 20 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#1a2b3c" }}>Nuevo evento</div>
          <div style={{ fontSize: 12, color: "#7a9ab0", marginTop: 2 }}>Completa las pestañas en orden. Cada una se guarda por separado.</div>
        </div>
        <button onClick={() => router.back()} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>← Volver</button>
      </div>

      <div style={{ display: "flex", borderBottom: "0.5px solid #c8d8e8", marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <div key={i} style={{ padding: "8px 16px", fontSize: 13, cursor: "pointer", color: tabActual === i ? "#1a3a6b" : "#4a6278", borderBottom: tabActual === i ? "2px solid #1a3a6b" : "2px solid transparent", fontWeight: tabActual === i ? 500 : 400, marginBottom: -0.5 }}>{t}</div>
        ))}
      </div>

      {error && <div style={{ padding: "10px 14px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 13, color: "#A32D2D", marginBottom: 16 }}>{error}</div>}

      {/* PESTAÑA 1 */}
      {tabActual === 0 && (
        <>
          <div style={card}>
            <div style={cardT}>Información principal</div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Título del evento *</label>
              <input style={inp} value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nombre oficial del evento" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Categoría *</label>
              <select style={inp} value={categoriaId} onChange={e => onCategoriaChange(Number(e.target.value))}>
                <option value="">Selecciona una categoría</option>
                {grupos.map(g => (
                  <optgroup key={g.id} label={g.nombre}>
                    {g.subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
              {nombreCatPadre && <div style={{ fontSize: 11, color: "#7a9ab0", marginTop: 4 }}>Categoría padre: {nombreCatPadre}</div>}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Descripción</label>
              <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe el evento..." />
            </div>
          </div>

          <div style={card}>
            <div style={cardT}>Ubicación</div>
            <div style={{ ...g3, marginBottom: 12 }}>
              <div><label style={lbl}>Ciudad *</label><input style={inp} value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ciudad" /></div>
              <div><label style={lbl}>Estado</label><input style={inp} value={estadoEvento} onChange={e => setEstadoEvento(e.target.value)} placeholder="Estado" /></div>
              <div><label style={lbl}>País</label><input style={inp} value={pais} onChange={e => setPais(e.target.value)} /></div>
            </div>
            <div style={g2}>
              <div><label style={lbl}>Venue / Sede</label><input style={inp} value={venue} onChange={e => setVenue(e.target.value)} placeholder="Nombre del lugar" /></div>
              <div><label style={lbl}>Dirección</label><input style={inp} value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Dirección completa" /></div>
            </div>
          </div>

          <div style={card}>
            <div style={cardT}>Formato, costo y contacto</div>
            <div style={{ ...g3, marginBottom: 12 }}>
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
            <div>
              <label style={lbl}>Teléfono de contacto del evento</label>
              <input style={{ ...inp, maxWidth: 260 }} value={telefonoContacto} onChange={e => setTelefonoContacto(e.target.value)} placeholder="Ej. 52 55 1234 5678" />
              <div style={{ fontSize: 11, color: "#7a9ab0", marginTop: 4 }}>Número visible al público para información o venta de boletos de este evento específico.</div>
            </div>
          </div>

          <div style={card}>
            <div style={cardT}>Imagen del evento</div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div onClick={() => fileRef.current?.click()} style={{ width: 160, height: 120, borderRadius: 8, flexShrink: 0, cursor: "pointer", border: errorImagen ? "1.5px solid #F09595" : "0.5px dashed #b5d4f4", background: "#dff0fb", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {imagenPreview ? <img src={imagenPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 11, color: "#4a6278", textAlign: "center", padding: 8 }}>Clic para seleccionar imagen</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#4a6278", marginBottom: 8 }}>Proporción recomendada: 4:3. Formatos: JPG, PNG, WEBP.</div>
                <button onClick={() => fileRef.current?.click()} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>{imagenFile ? "Cambiar imagen" : "Seleccionar imagen"}</button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImagenChange} />
                {errorImagen && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 8, fontSize: 12, color: "#A32D2D" }}>
                    <div style={{ marginBottom: 6 }}>{errorImagen}</div>
                    {eventoId && imagenFile && <button onClick={reintentarSubidaImagen} disabled={subiendoImagen} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", border: "none", background: "#A32D2D", color: "#fff", opacity: subiendoImagen ? 0.6 : 1 }}>{subiendoImagen ? "Subiendo..." : "Reintentar subida"}</button>}
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
            <button onClick={guardarTab1} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>{saving ? "Guardando..." : "Guardar y continuar →"}</button>
          </div>
        </>
      )}

      {/* PESTAÑA 2 */}
      {tabActual === 1 && (
        <>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={cardT}>Fechas del evento</div>
              <button onClick={agregarFecha} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "0.5px solid #1a3a6b", background: "#fff", color: "#1a3a6b" }}>+ Agregar fecha</button>
            </div>
            {fechas.map((f, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: "0.5px solid #e8f0f8" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#4a6278" }}>Fecha {i + 1}</span>
                  {fechas.length > 1 && <button onClick={() => quitarFecha(i)} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", border: "0.5px solid #F09595", background: "#FCEBEB", color: "#A32D2D" }}>Quitar</button>}
                </div>
                <div style={{ ...g3, marginBottom: 8 }}>
                  <div><label style={lbl}>Fecha *</label><input style={inp} type="date" value={f.fecha} onChange={e => actualizarFecha(i, "fecha", e.target.value)} /></div>
                  <div><label style={lbl}>Hora inicio</label><input style={inp} type="time" value={f.hora_inicio} onChange={e => actualizarFecha(i, "hora_inicio", e.target.value)} /></div>
                  <div><label style={lbl}>Hora fin</label><input style={inp} type="time" value={f.hora_fin} onChange={e => actualizarFecha(i, "hora_fin", e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 32 }}>
            <button onClick={() => setTabActual(0)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>← Anterior</button>
            <button onClick={guardarTab2} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>{saving ? "Guardando..." : "Guardar y continuar →"}</button>
          </div>
        </>
      )}

      {/* PESTAÑA 3 */}
      {tabActual === 2 && (
        <>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#dff0fb", borderRadius: 8, fontSize: 13, color: "#185FA5" }}>
            Completando detalles para: <strong>{subcatNombre}</strong> — {TIPO_LABEL[tipo]}
          </div>

          {tipo === "concierto" && (
            <div style={card}>
              <div style={cardT}>Detalles del concierto</div>
              <div style={{ marginBottom: 12 }}><label style={lbl}>Artistas (separados por coma)</label><input style={inp} value={artistas} onChange={e => setArtistas(e.target.value)} placeholder="Artista 1, Artista 2" /></div>
              <div style={{ ...g3, marginBottom: 12 }}>
                <div><label style={lbl}>Apertura de puertas</label><input style={inp} type="time" value={horaApertura} onChange={e => setHoraApertura(e.target.value)} /></div>
                <div><label style={lbl}>Precio general (MXN)</label><input style={inp} type="number" min={0} value={precioGeneral} onChange={e => setPrecioGeneral(Number(e.target.value))} /></div>
                <div><label style={lbl}>Precio VIP (MXN)</label><input style={inp} type="number" min={0} value={precioVip} onChange={e => setPrecioVip(Number(e.target.value))} /></div>
              </div>
              <div style={g2}>
                <div><label style={lbl}>Edad mínima</label><input style={inp} type="number" min={0} value={edadMinima} onChange={e => setEdadMinima(e.target.value)} placeholder="Sin restricción" /></div>
                <div style={chk}><input type="checkbox" id="zf" checked={tieneZonaFamiliar} onChange={e => setTieneZonaFamiliar(e.target.checked)} style={{ width: 16, height: 16 }} /><label htmlFor="zf" style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>Tiene zona familiar</label></div>
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
                  {PERIODICIDAD_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { id: "hosp", label: "Incluye hospedaje", val: incluyeHospedaje, set: setIncluyeHospedaje },
                  { id: "alim", label: "Incluye alimentación", val: incluyeAlimentacion, set: setIncluyeAlimentacion },
                  { id: "insc", label: "Requiere inscripción previa", val: requiereInscripcion, set: setRequiereInscripcion },
                ].map(c => (
                  <div key={c.id} style={chk}><input type="checkbox" id={c.id} checked={c.val} onChange={e => c.set(e.target.checked)} style={{ width: 16, height: 16 }} /><label htmlFor={c.id} style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>{c.label}</label></div>
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
                    {PERIODICIDAD_OPCIONES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={lbl}>URL transmisión online</label><input style={inp} value={urlTransmision} onChange={e => setUrlTransmision(e.target.value)} placeholder="https://..." /></div>
              <div style={chk}><input type="checkbox" id="online" checked={disponibleOnline} onChange={e => setDisponibleOnline(e.target.checked)} style={{ width: 16, height: 16 }} /><label htmlFor="online" style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>Disponible en línea</label></div>
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
                  <div key={c.id} style={chk}><input type="checkbox" id={c.id} checked={c.val} onChange={e => c.set(e.target.checked)} style={{ width: 16, height: 16 }} /><label htmlFor={c.id} style={{ fontSize: 13, color: "#1a2b3c", cursor: "pointer" }}>{c.label}</label></div>
                ))}
              </div>
            </div>
          )}

          {tipo === "general" && (
            <div style={card}><div style={{ fontSize: 13, color: "#4a6278", textAlign: "center", padding: 24 }}>Esta categoría no requiere campos adicionales.</div></div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 32 }}>
            <button onClick={() => setTabActual(1)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>← Anterior</button>
            <button onClick={guardarTab3} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#1a3a6b", color: "#fff", opacity: saving ? 0.6 : 1 }}>{saving ? "Guardando..." : "Guardar y continuar →"}</button>
          </div>
        </>
      )}

      {/* PESTAÑA 4 */}
      {tabActual === 3 && (
        <>
        <div style={{ fontSize: 11, color: "red" }}>
          eventoId: {eventoId ?? "null"} | estado: {estadoPublicacion}
        </div>
        <div style={card}>
          <div style={cardT}>Corresponsales</div>
            <div style={{ fontSize: 13, color: "#4a6278", textAlign: "center", padding: 24 }}>
              La asignación de corresponsales estará disponible próximamente.<br />
              <span style={{ fontSize: 12, color: "#7a9ab0" }}>Puedes finalizar el evento y asignar corresponsales desde el detalle del evento.</span>
            </div>
          </div>

          {(estadoPublicacion === "borrador" || estadoPublicacion === "rechazado") ? (
          <div style={card}>
            <div style={cardT}>Estado del evento</div>
              <div style={{ fontSize: 13, color: "#4a6278", marginBottom: 16 }}>
                El evento está en <strong>{estadoPublicacion}</strong>. ¿Deseas enviarlo a revisión para su publicación?
              </div>
              <button
                onClick={enviarARevision}
                disabled={saving}
                style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#e8a020", color: "#fff", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Enviando..." : "Enviar a revisión"}
              </button>
            </div>
            ) : estadoPublicacion === "en_revision" ? (
            <div style={{ ...card, background: "#dff0fb", border: "0.5px solid #b5d4f4" }}>
              <div style={{ fontSize: 13, color: "#185FA5" }}>✓ Evento enviado a revisión. Un administrador lo revisará próximamente.</div>
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 32 }}>
              <button onClick={() => setTabActual(2)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "0.5px solid #c8d8e8", background: "#fff", color: "#1a2b3c" }}>← Anterior</button>
              <button onClick={finalizar} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none", background: "#0F6E56", color: "#fff" }}>Finalizar y ver evento →</button>
            </div>
          </>
          )}
        </div>
        );
      }
