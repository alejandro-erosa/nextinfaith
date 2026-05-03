# ADENDUM — SEO | 10 de Abril 2026
*Complemento a 20260410_Bitacora.md*

---

## SEO — Estado actual y plan de implementación

### Estado actual
Sin ninguna implementación de SEO. No hay metadatos, Open Graph, sitemap ni robots.txt.

---

### Capa 1 — Técnico (Beto implementa, una sola vez)

| Tarea | Descripción | Horas Beto estimadas |
|---|---|---|
| Metadatos estáticos | `<title>` y `<description>` en páginas fijas: home, /buscar, /login, /registro | 1 hr |
| Metadatos dinámicos | `<title>` y `<description>` generados por evento en `/buscar/[id]`. Ejemplo: "Retiro Ignaciano — Campeche, 29 Mar 2026 — Next In Faith" | 2 hrs |
| Open Graph | Imágenes y títulos correctos cuando se comparte un link en WhatsApp, Facebook, Twitter. Crítico — el 80% del tráfico de NIF vendrá por compartir links | 2 hrs |
| `sitemap.xml` dinámico | Generado automáticamente con todos los eventos publicados. Se actualiza con cada nuevo evento | 2 hrs |
| `robots.txt` | Indica a Google qué páginas indexar (público) y cuáles no (dashboard interno) | 0.5 hr |
| Datos estructurados (Schema.org) | Marcar eventos con schema `Event` — Google puede mostrar el evento directamente en resultados de búsqueda con fecha, lugar y precio | 3-4 hrs |

**Total Capa 1: 10-11 horas de Beto**

---

### Capa 2 — Contenido (equipo editorial, trabajo continuo)

| Elemento | Descripción |
|---|---|
| Títulos de eventos | Deben incluir palabras clave reales: tipo de evento + ciudad + año. Ejemplo: "Retiro Espiritual Ignaciano Campeche 2026" en lugar de "EJERCICIOS ESPIRITUALES IGNACIO DE LOYOLA" |
| Descripciones completas | El campo `descripcion` del evento debe tener mínimo 150 palabras con palabras clave naturales |
| Nombres consistentes | Ya resuelto con normalización de ciudades |
| Imágenes con alt text | Toda imagen debe tener texto alternativo descriptivo |
| URLs amigables | Ya funcionan — `/buscar/[id]`. Pendiente: considerar URLs con slug en lugar de ID numérico |

---

### Palabras clave objetivo (México)

Búsquedas con alta intención y baja competencia actual:

- "retiros espirituales [ciudad]"
- "conciertos católicos México 2026"
- "peregrinaciones México 2026"
- "eventos católicos [ciudad]"
- "conferencias católicas México"
- "eventos juveniles católicos"
- "retiros para hombres [ciudad]"
- "eventos religiosos Mérida / Cancún / CDMX"

---

### Prioridad de implementación

| Prioridad | Tarea | Razón |
|---|---|---|
| 1 | Open Graph | El tráfico inicial vendrá por WhatsApp y redes. Si el link no se ve bien, no se comparte |
| 2 | Metadatos dinámicos por evento | Cada evento es una página indexable — es el núcleo del SEO de NIF |
| 3 | `sitemap.xml` | Google necesita saber qué páginas existen |
| 4 | Schema.org Event | Aparición directa en resultados de Google con fecha y lugar |
| 5 | `robots.txt` | Evita que Google indexe el dashboard interno |
| 6 | URLs con slug | Mejora legibilidad. `/buscar/retiro-ignaciano-campeche` vs `/buscar/8` |

---

### Nota sobre URLs con slug

Actualmente las URLs de eventos usan el ID numérico (`/buscar/8`). Para SEO es mejor usar un slug descriptivo (`/buscar/retiro-ignaciano-campeche-2026`). Esto requiere:
- Agregar campo `slug` a la tabla `eventos` en BD
- Generarlo automáticamente al crear el evento (título normalizado sin acentos ni espacios)
- Actualizar las rutas de Next.js

Es un cambio de schema — documentado como pendiente de análisis antes de implementar.

---

### Estimado total SEO

| Capa | Responsable | Esfuerzo |
|---|---|---|
| Técnico | Beto | 10-11 horas |
| Contenido inicial | Equipo editorial | 2-3 horas por evento bien documentado |
| Contenido continuo | Equipo editorial | Trabajo permanente |

**Recomendación:** Implementar Capa 1 completa antes de abrir a usuarios externos. Sin metadatos y Open Graph, compartir un evento en WhatsApp no genera confianza ni clics.

---

*Next In Faith | Adendum SEO | 10 de Abril 2026*
