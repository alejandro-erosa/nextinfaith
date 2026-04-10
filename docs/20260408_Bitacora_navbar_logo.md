# NEXT IN FAITH
## Bitácora de Sesión | 8 de Abril 2026
*NavBar global, logo nuevo, password recovery*

Responsable: Alex Erosa  
Documento: 20260408_Bitacora_navbar_logo

---

## 1. Trabajo realizado en esta sesión

| Tarea | Descripción | Estado |
|---|---|---|
| Diagnóstico usuario Marifer | Verificación en Supabase de las 3 capas: Auth, profiles y user_roles. Todo correcto | ✅ Completado |
| Diagnóstico password recovery | El enlace apuntaba a localhost porque Site URL en Supabase tenía `http://localhost:3000` | ✅ Diagnosticado |
| Corrección Site URL Supabase | Cambiado a `https://nextinfaith.com` | ✅ Completado |
| Selección logo nuevo | Evaluados 3 logos. Seleccionado `next_in_faith_6.png` — fondo transparente, trazo negro | ✅ Completado |
| Renombrado de logos en public/ | Logos renombrados sin espacios para uso web seguro | ✅ Completado |
| NavBar global — componente | Creado `app/components/NavBar.tsx` con lógica de sesión y roles | ✅ Completado |
| NavBar global — layout raíz | Insertado en `app/layout.tsx` con `paddingTop: 68` en wrapper | ✅ Completado |
| NavBar eliminado del home | Removido el NavBar hardcodeado de `app/Client.tsx` | ✅ Completado |
| Favicon actualizado | Cambiado de `logo_transparente.png` a `logo_negro.png` en metadata | ✅ Completado |
| Build y deploy | `npm run build` exitoso (exit code 0). Deploy publicado en Netlify | ✅ Completado |
| Evaluación bugs y mejoras | Lista de 9 solicitudes de usuarios clasificada por prioridad | ✅ Completado |

---

## 2. Cosas nuevas que salieron en esta sesión

| Tema | Detalle |
|---|---|
| Dominio real activo | El sitio corre en `nextinfaith.com`, no en `nextinfaith.netlify.app` |
| Página `/auth/recovery` inexistente | El flujo de password recovery llega al home porque no hay página que procese el token de Supabase. Pendiente crítico para onboarding de Marifer |
| Logo pequeño en NavBar | Las dimensiones `width=120 height=48` resultan insuficientes visualmente. Ajuste pendiente |
| NavBar aplica a todas las páginas | Decisión tomada: el NavBar público se muestra también en el dashboard interno — permite navegar al home desde cualquier pantalla |
| Solicitudes de usuarios documentadas | Archivo `bugs_o_mejoras.txt` recibido con 9 items evaluados y clasificados |

---

## 3. Decisiones de diseño tomadas

| Decisión | Razón |
|---|---|
| NavBar con fondo blanco (Opción B) | Consistencia en todas las páginas. El logo negro funciona sobre blanco sin necesitar versión alternativa |
| NavBar en layout raíz, no por página | Una sola implementación aplica a todas las rutas automáticamente |
| Logo negro sobre fondo transparente | `logo_negro.png` (ex `next_in_faith_6.png`) es el único con fondo transparente — estándar para web |
| "Mi Dashboard" solo para roles internos | Roles 1-5 ven el link al dashboard. Rol 6 (usuario público) no lo ve |

---

## 4. Archivos modificados

| Archivo | Acción | Detalle |
|---|---|---|
| `app/components/NavBar.tsx` | CREADO | Componente NavBar global con lógica de sesión y roles |
| `app/layout.tsx` | MODIFICADO | Importa y renderiza `<NavBar />`. Wrapper con `paddingTop: 68` |
| `app/Client.tsx` (home) | MODIFICADO | Eliminado bloque `<nav>` hardcodeado. Ajustado `paddingTop` del hero |
| `public/logo_negro.png` | NUEVO | Logo nuevo fondo transparente — usado en NavBar y favicon |
| `public/logo_blanco.png` | NUEVO | Logo blanco para uso futuro (ej. footer oscuro) |
| `public/logo_negro_solido.png` | NUEVO | Variante con fondo negro sólido — no usada actualmente |
| `public/logo_negro_outline.png` | NUEVO | Variante outline — no usada actualmente |

---

## 5. Bugs y mejoras evaluados

| # | Item | Clasificación | Estado |
|---|---|---|---|
| 1 | Olvidé mi contraseña en login | 🔴 PRIORITARIA | Pendiente — ligado a `/auth/recovery` |
| 2 | NavBar global con links a Inicio y Dashboard | 🔴 PRIORITARIA | ✅ Resuelto en esta sesión |
| 3 | Logo nuevo | 🔴 PRIORITARIA | ✅ Resuelto en esta sesión |
| 4 | Ciudades como listbox estándar | 🟡 IMPORTANTE | Pendiente |
| 5 | Modalidad en búsqueda (presencial/en línea/híbrido) | 🟡 IMPORTANTE | Pendiente — requiere análisis de schema |
| 6 | Cropper de imagen con previsualización | 🟢 DESEABLE | Pendiente — nice to have |
| 7 | Evento en múltiples categorías | 🟢 DESEABLE | Pendiente — cambio de schema |
| 8 | Múltiples fechas con fecha de fin por inicio | 🟢 DESEABLE | Pendiente — análisis requerido |
| 9 | Logo NIF en pantallas sin navbar (login) | 🔴 PRIORITARIA | ✅ Resuelto — NavBar ahora aparece en todas las páginas |

---

## 6. Pendientes para próxima sesión

| # | Tarea | Prioridad |
|---|---|---|
| 1 | Implementar `app/auth/recovery/page.tsx` | ALTA — bloqueante para onboarding de Marifer |
| 2 | Agregar link "Olvidé mi contraseña" en `/login` | ALTA — ligado al recovery |
| 3 | Ajustar tamaño del logo en NavBar | ALTA — visual |
| 4 | Verificar Redirect URLs en Supabase apuntan a `nextinfaith.com` | ALTA |
| 5 | Ciudades como listbox estándar en formulario de evento | MEDIA |
| 6 | Modalidad en búsqueda (presencial/en línea/híbrido) | MEDIA — requiere análisis de schema |
| 7 | Evento en múltiples categorías | BAJA — cambio de schema |
| 8 | Múltiples fechas con fecha de fin por inicio | BAJA — análisis requerido |
| 9 | Cropper de imagen en subida de evento | BAJA — nice to have |

---

## 7. Comandos de referencia

| Acción | Comando |
|---|---|
| Iniciar servidor local | `npm run dev` |
| Ver en navegador | `http://localhost:3000` |
| Build local | `npm run build` |
| Publicar en Netlify | `git add . && git commit -m "mensaje" && git push` |

---

*Next In Faith | Donde la fe cobra vida | 8 de Abril 2026*
