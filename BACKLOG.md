# Backlog — WaCommerce

> Plataforma SaaS multi-tenant que actúa como agente IA para construir catálogos
> inteligentes para comercios que **venden productos** o **agendan servicios**.
> (Rol/objetivo en `CLAUDE.md`.)

Prioridad de mayor (P0) a menor. Estado: ✅ hecho · 🟡 parcial · 🔴 sin empezar.

---

## ✅ P0 — Tipo de venta: Carrito (productos) vs Citas (servicios) — IMPLEMENTADO (2026-06-06)

> Hecho y verificado E2E: config (Settings → Tipo de venta), tabla `appointments`,
> flujo de reserva `/s/[slug]/agendar`, calendario `/app/catalogs/[id]/citas` (mes/semana
> con Tailwind) + modal con cambio de estado, Google Calendar best-effort (scope añadido
> en auth.ts), notificaciones WhatsApp. Detalle original abajo.

Permitir que cada catálogo opere en **uno de dos modos** (excluyentes): **venta de
productos** (carrito + checkout existente) o **agendamiento de servicios** (citas).

### 0.1 Configuración desde el catálogo
- En `Configuración` del catálogo: selector **Tipo de catálogo** = `products` | `appointments`
  (solo se puede elegir uno).
- **Texto configurable de los botones** de las tarjetas: ej. "Agregar al carrito" (modo
  productos) o "Agendar" (modo citas). Editable por el comerciante.
- **Modelo de datos:** nuevo enum `catalog_type` (`products`|`appointments`) + columna
  `catalogs.type` (default `products`). Los textos de botón y opciones de agendamiento
  viven en `catalogs.settings_json` (ej. `{ ctaLabel, booking: { slotMinutes, hours,
  bufferMin, services[] } }`). No requiere romper migraciones (aplicar DDL `IF NOT EXISTS`
  por psql; el journal de drizzle está desincronizado).

### 0.2 Storefront según el tipo
- Modo `products`: comportamiento actual (catálogo → carrito → checkout → orden).
- Modo `appointments`: las tarjetas son **servicios**; el CTA "Agendar" abre el flujo de
  reserva: elegir servicio → elegir fecha/hora (slots disponibles) → datos de contacto
  (nombre, teléfono) → confirmar. Crea una **appointment**, no una orden.

### 0.3 Citas — panel del comerciante (`/app/catalogs/[id]/citas`)
- **Calendario interactivo** (vista **mensual** y **semanal**) mostrando las `appointments`
  del catálogo.
- **Decisión técnica (documentar):** implementar la grilla con **Tailwind** (sin librerías
  pesadas) para mantener el bundle liviano y el control total del diseño, consistente con
  el resto del proyecto. *Alternativa documentada:* `react-big-calendar` si se necesita
  drag-and-drop avanzado o vista por recurso — evaluar costo/beneficio antes de adoptarla.
- **Click en una cita → modal** con detalle: **nombre, teléfono, servicio**, fecha/hora.
- Permitir **cambiar el status** a `cancelled` o `completed` (además de `pending`/`confirmed`).
- **Modelo de datos:** tabla `appointments` (`id`, `catalog_id` FK, `customer_json`
  {name, phone, email?}, `service` text, `start_at` ts, `end_at` ts, `status` enum
  `pending|confirmed|cancelled|completed`, `google_event_id` text nullable, `notes`,
  `created_at`, `updated_at`). Índices por `catalog_id` y `start_at`.

### 0.4 Sincronización con Google Calendar
- Reutilizar el **Google OAuth ya existente** (NextAuth, `auth.ts`) ampliando el scope a
  `https://www.googleapis.com/auth/calendar.events` y guardando access/refresh token del
  comerciante (tabla de tokens o `accounts`).
- Al **crear** una cita → crear evento en Google Calendar y guardar `google_event_id`.
- Al **cambiar status** (cancelled/completed) → reflejarlo en el evento (cancelar = borrar
  o marcar; completed = actualizar título/estado). Sincronización de ida; evaluar webhook
  push de Google para 2-vías en una iteración posterior.
- Documentar caveats (consentimiento de calendar, expiración de refresh token).

### 0.5 Notificaciones
- Reusar el sistema WhatsApp/email: al crear una cita, notificar al comercio y al cliente
  (plantilla "cita agendada"); recordatorios opcionales más adelante.

**Archivos previstos:** `db/schema.ts` (+enum/tabla/migración), settings del catálogo,
`lib/actions/appointments.ts`, `app/(app)/app/catalogs/[id]/citas/` (page + calendar +
modal), `lib/google/calendar.ts`, flujo de reserva en `app/(storefront)/s/[slug]/...`,
ajuste de `product-card`/CTA por `catalog.type`.

---

## 🔴 P1 — Pagos del comerciante: MercadoPago y PayPal (Fase 7)
Hoy solo Stripe + "pagar al recibir". Faltan MercadoPago y PayPal (no instalados). Alto
impacto en ventas LatAm. Incluye webhooks de pago → actualizar orden.

## 🟡 P2 — Dominio propio + white-label (Fase 14)
Existe `settings/domain` y `lib/domain/handler.ts`. Falta verificación CNAME + SSL
automático y ocultar marca propia en plan Pro+.

## 🔴 P3 — Herramientas gratis + menú "Recursos" (Fase 11)
`/tools`: generador link WhatsApp, calculadora de margen, QR de menú, descripciones IA,
nombres de negocio, biografías + dropdown "Recursos". Lead-gen SEO.

## 🔴 P4 — Guías SEO por industria + comparativas (Fase 12)
Plantilla MDX + `/como-vender/[slug]` (10-20 landings) + `/guides/[slug]`. Tráfico orgánico.

## 🔴 P5 — Agencias / multi-cliente (Fase 13)
Modo agencia: panel multi-cliente, switcher, facturación consolidada, white-label, roles
(`agency_owner`/`operator`/`client_owner`), plantillas reusables. Bloque grande; solo si
hay demanda B2B.

## 🟡 P6 — i18n (Fase 15) — BASE + SELECTOR (2026-06-27)
Se quitó `next-intl` (estaba 100% huérfano) y en su lugar se montó un **i18n ligero propio**
(sin routing por locale): idioma en cookie `NEXT_LOCALE` + Context cliente (`lib/i18n/`) +
`<html lang>` en el root layout + mensajes en `messages/{es,en}.json`. Se agregó un
**selector ES|EN** (`components/i18n/language-switcher.tsx`) en los **tres headers**
(marketing/app/storefront) y se tradujeron sus textos. Verificado E2E (toggle, cookie,
persistencia en recarga vía SSR).
**Público 100% traducido (ES/EN):** landing, los tres headers, login/signup, banner de
cookies, /plans y /agencies — incluyendo los datos de `lib/pricing.ts` (planes, features,
tabla comparativa y monedas), que se movieron a `messages` y se leen con `tRaw`.
**Pendiente (incremental):** dashboard del comercio (/app), flujo de tienda (storefront) y
emails/WhatsApp. Si hiciera falta SEO multi-idioma, evaluar routing por locale.

## 🟡 P7 — Producción / observabilidad (Fase 17)
Sin Sentry; monitoreo casero. Falta doc de operación.

---

## 🧹 Deuda técnica (tareas cortas, bajo riesgo)
- Limpiar basura en la raíz del repo: `server.log`, `oauth-error-output.log`, `argo.txt.`,
  `full_navigation.js`, `navigate_home.js`, `open_visible.mjs`, `show_design_*.js`,
  `FINAL_SUMMARY_PHASES_1_2_3_4.txt` → mover a `scripts/` o borrar + `.gitignore`.
- `architecture.md` aún dice "Domicilios" (la marca ya es **WaCommerce**) — actualizar.
- CSP `img-src` sin `blob:` → la miniatura de previsualización del archivo en el escáner no
  se ve (no afecta la extracción). Añadir `blob:` a `img-src`.
- Plantillas WhatsApp `pedido_recibido` / `nuevo_pedido_tienda`: verificar aprobación en Meta.

---

## ✅ Hecho recientemente (fuera del plan original)
Rebrand WaCommerce · WhatsApp Cloud API (notificaciones + bot + plantillas) · Escáner de
menú multi-proveedor con recorte de fotos reales · Variantes de producto (color/talla:
detección por escáner editable, configuración manual con imagen por color/talla, selector
en tienda, registro en la orden) · Borrado en bloque de productos.
