# NEXT IN FAITH - DICCIONARIO DE DATOS MAESTRO v2.0
[cite_start]**Estado:** Final (Integra Módulos de Eventos, Ticketing, Lugares y Afiliados) [cite: 4, 17]
[cite_start]**Plataforma:** Supabase (PostgreSQL) [cite: 5, 10]
[cite_start]**Responsable Técnico:** Alex Erosa [cite: 6]

---

## 1. ECOSISTEMA DE USUARIOS, ROLES Y ATRIBUCIÓN
Gestiona la identidad y el motor de comisiones para corresponsales e influencers.

### Tabla: profiles
[cite_start]*Propósito: Extiende la autenticación de Supabase con datos de negocio.* [cite: 24]
- **id (UUID):** PK. [cite_start]Referencia a auth.users.id. [cite: 25]
- [cite_start]**nombre / apellido (TEXT):** Datos personales. [cite: 25]
- [cite_start]**ciudad / estado / pais (TEXT):** Ubicación para segmentación. [cite: 25]
- [cite_start]**fecha_nacimiento (DATE):** Para filtros de edad. [cite: 25]
- [cite_start]**foto_url (TEXT):** Avatar del usuario. [cite: 25]
- [cite_start]**activo (BOOLEAN):** Soft delete (default true). [cite: 25]

### Tabla: roles
[cite_start]*Propósito: Catálogo de permisos (super_admin, admin, editor, moderador, organizador, usuario).* [cite: 27, 28, 29]
- [cite_start]**id (SERIAL):** PK. [cite: 28]
- [cite_start]**nombre (TEXT):** Identificador técnico. [cite: 28]

### Tabla: referral_codes
*Propósito: Motor de atribución para que corresponsales e influencers tengan impacto medible.*
- **id (SERIAL):** PK.
- **owner_id (UUID):** FK a profiles.id.
- **codigo (TEXT):** Único (ej: "FE2026").
- **porcentaje_comision (DECIMAL):** Para futuras negociaciones de pago.

---

## 2. ECOSISTEMA DE EVENTOS (NÚCLEO)
[cite_start]Contiene la información base y las extensiones por categoría. [cite: 35, 36]

### Tabla: eventos
[cite_start]*Propósito: Tabla maestra con campos comunes.* [cite: 42]
- [cite_start]**id (SERIAL):** PK. [cite: 43]
- [cite_start]**titulo / descripcion (TEXT):** Información pública. [cite: 43]
- [cite_start]**categoria_id (INTEGER):** FK a categorias.id. [cite: 43]
- [cite_start]**organizador_id (UUID):** FK a profiles.id. [cite: 43]
- [cite_start]**venue / direccion (TEXT):** Ubicación física. [cite: 43]
- [cite_start]**fecha_inicio / fecha_fin (DATE):** Temporalidad. [cite: 43]
- [cite_start]**costo_minimo (DECIMAL):** Para filtros de búsqueda (0 si es gratuito). [cite: 43]
- [cite_start]**estado_publicacion (TEXT):** (borrador, en_revisión, publicado, rechazado). [cite: 43]

### Tablas de Extensión (Bloque 7)
[cite_start]*Propósito: Campos específicos por tipo de evento para mantener la limpieza de la DB.* [cite: 89, 93]
- [cite_start]**ext_retiros:** cupo_maximo, incluye_hospedaje, facilitador. [cite: 96]
- [cite_start]**ext_conciertos:** artistas, hora_apertura, zona_familiar. [cite: 99]
- [cite_start]**ext_peregrinaciones:** agencia, incluye_vuelo, duracion_dias. [cite: 105]
- [cite_start]**ext_conferencias / juveniles / masivos:** Ponentes, rangos de edad, diócesis. [cite: 102, 108, 111]

---

## 3. ECOSISTEMA DE INVENTARIO Y TICKETING (ESTILO EVENTBRITE)
[cite_start]Lógica para manejar desde entradas generales hasta asientos numerados. [cite: 16, 112]

### Tabla: event_zones
*Propósito: Divide el lugar en secciones (VIP, Oro, General).*
- **id (SERIAL):** PK.
- **evento_id (INTEGER):** FK a eventos.id.
- **nombre (TEXT):** Ej: "Planta Alta".
- **es_numerado (BOOLEAN):** Si es TRUE, requiere tabla 'seats'. Si es FALSE, es entrada general.
- **capacidad_total (INTEGER):** Límite de aforo de la zona.

### Tabla: seats
*Propósito: Detalle físico de cada asiento (solo si la zona es numerada).*
- **id (SERIAL):** PK.
- **zone_id (INTEGER):** FK a event_zones.id.
- **fila (TEXT) / numero (TEXT):** Coordenadas del asiento.
- **estado (TEXT):** (disponible, reservado, vendido).

### Tabla: ticket_types
*Propósito: Precios por segmento (Adulto mayor, Ministro, Early Bird).*
- **id (SERIAL):** PK.
- **zone_id (INTEGER):** FK a event_zones.id.
- **nombre (TEXT):** Ej: "Descuento Ministro".
- **precio (DECIMAL):** Costo aplicado.
- **requiere_validacion (BOOLEAN):** Para segmentos que necesitan probar su rol.

---

## 4. ECOSISTEMA DE LUGARES Y RESEÑAS (ESTILO TRIPADVISOR)
[cite_start]Permite calificar hoteles, restaurantes y el evento mismo. [cite: 48, 49]

### Tabla: places
*Propósito: Catálogo de Puntos de Interés (POI) independientes de los eventos.*
- **id (SERIAL):** PK.
- **tipo (TEXT):** (hotel, restaurante, parroquia).
- **nombre / ubicacion / foto_url (TEXT):** Datos del lugar.

### Tabla: event_recommendations
*Propósito: Vincula lugares con eventos específicos (Hoteles recomendados).*
- **evento_id (INTEGER):** FK a eventos.id.
- **place_id (INTEGER):** FK a places.id.
- **nota_organizador (TEXT):** Recomendación editorial.

### Tabla: resenas
[cite_start]*Propósito: Sistema de calificación universal.* [cite: 51]
- [cite_start]**id (SERIAL):** PK. [cite: 52]
- [cite_start]**user_id (UUID):** FK a profiles.id. [cite: 52]
- [cite_start]**evento_id (INTEGER):** NULL si se califica un lugar. [cite: 52]
- **place_id (INTEGER):** NULL si se califica un evento.
- [cite_start]**calificacion (INTEGER):** 1 a 5 estrellas. [cite: 52]
- [cite_start]**comentario (TEXT):** Opinión del usuario. [cite: 52]

---

## 5. ECOSISTEMA SAAS Y PUBLICIDAD
[cite_start]Monetización B2B. [cite: 78, 115]

- [cite_start]**organizadores:** Perfil institucional verificado. [cite: 118]
- [cite_start]**paquetes_saas:** Catálogo de suscripciones (Básico, Pro). [cite: 121]
- [cite_start]**suscripciones:** Estado de pago de los organizadores. [cite: 124]
- [cite_start]**campanas_publicitarias:** Banners geolocalizados por ciudad/estado. [cite: 83, 84]