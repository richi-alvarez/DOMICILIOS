# Architecture — Plataforma SaaS de catálogos (marca: **WaCommerce**)

> Plataforma SaaS para crear catálogos / menús digitales con pedidos por WhatsApp.
> Inspirada en la idea de negocio de mareaalcalina.com, pero con **marca, textos,
> imágenes, íconos y paleta propios**. No se copia contenido original.

---

## 0. Reglas del proyecto

- **No reutilizar** textos, imágenes, logotipos ni nombre "Marea Alcalina".
- Todas las ilustraciones/íconos serán generados o tomados de libretas libres
  (Lucide, Heroicons, Undraw, Unsplash con licencia).
- Copys redactados desde cero en español neutro.
- Paleta y tipografía distintas (ver §2).
- El usuario aprueba **fase por fase** antes de avanzar a la siguiente.

---

## 1. Alcance funcional (lo que replicamos)

Módulos núcleo del SaaS:

1. **Sitio público de marketing** — home, planes, agencias, landings por vertical
   (catálogo digital / menú digital / proveedores).
2. **Autenticación** — email + Google OAuth, recuperación de contraseña, términos.
3. **Panel del comerciante (dashboard)** — gestión de catálogos, productos,
   categorías, bloques visuales, personalización visual, dominio, idioma,
   colaboradores.
4. **Catálogo público del comerciante** (tienda multitenant) — vitrina de
   productos, carrito, checkout que dispara pedido por WhatsApp / email.
5. **Pagos** — integración con pasarela (Stripe, PayPal, MercadoPago, método
   manual/transferencia).
6. **Pedidos e inventario** — listado de pedidos, estados, stock, descuentos.
7. **Analítica** — visitas, conversiones, productos top.
8. **Generador de catálogo con IA** — a partir de descripción del negocio.
9. **Reconocimiento de imágenes con IA** — autollenar producto desde foto.
10. **QR y enlaces** — generador QR del catálogo, enlaces cortos.
11. **Panel de agencia** — multi-cuenta, gestión de clientes (ver §7.A).
12. **Herramientas gratuitas (lead-gen SEO)** — generador WhatsApp link,
    calculadora de margen, generador de QR menú, descripciones con IA, nombres
    de negocio, biografías (ver §7.R).
13. **Guías por industria/país** — 30+ landings SEO (/como-vender/:slug) +
    comparativas/tutoriales en `/guides/:slug` (ver §7.R).
14. **Suscripciones y facturación** — planes Gratis / Basic / Pro / Business /
    Agency, con selector anual/mensual y multi-moneda (USD, MXN, COP, BRL,
    CAD, CLP, CRC, EUR, PEN).
15. **Páginas legales** — Términos, Privacidad, Uso aceptable.
16. **Blog** (subdominio externo, fase final).

---

## 2. Identidad visual propuesta (cambiar si quieres)

- **Nombre**: `WaCommerce` (marca definitiva).
- **Paleta sugerida**: primario coral `#FF6B57`, secundario azul noche `#0B1F3A`,
  acento verde lima `#9BE14A`, neutros cálidos. (Diferente del turquesa/cyan
  original.)
- **Tipografía**: `Inter` para UI, `Sora` para títulos.
- **Logo**: isotipo geométrico distinto (p. ej. una onda+bolsa), generado aparte.

---

## 3. Stack técnico

- **Framework**: Next.js 15 (App Router, Server Actions).
- **UI**: Tailwind CSS v4 + shadcn/ui + Radix primitives.
- **Icons/Media**: Lucide, Unsplash (licencia), imágenes propias.
- **DB**: PostgreSQL (Supabase o Neon).
- **ORM**: Drizzle.
- **Auth**: Auth.js (NextAuth) con Credentials + Google.
- **Storage**: Supabase Storage / S3 para imágenes de productos.
- **Pagos**: Stripe (plataforma), MercadoPago y PayPal (comerciante).
- **IA**: Claude API (Anthropic) para generación de catálogos, descripciones,
  reconocimiento de imágenes; con caché de prompts.
- **Email transaccional**: Resend.
- **Colas / background**: Inngest o cron de Vercel.
- **Despliegue**: Vercel + Neon/Supabase.
- **i18n**: next-intl (es/en/pt/fr).
- **Testing UI**: Playwright.
- **Monorepo**: una sola app Next.js por ahora; separar packages si crece.

---

## 4. Arquitectura de alto nivel

```
┌─────────────────────────── Next.js App ────────────────────────────┐
│  (public)       (auth)         (dashboard)         (storefront)     │
│   home,          login,         /app/*              /s/[slug]/*     │
│   planes,        signup,        panel admin         tienda pública  │
│   tools, guides  oauth          del comerciante     del comerciante │
└─────────────────────────────────────────────────────────────────────┘
          │              │                 │                │
          ▼              ▼                 ▼                ▼
    Edge/SSG        Auth.js         Server Actions      ISR + cache
          │              │                 │                │
          └──────────────┴────────┬────────┴────────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │   Postgres (Drizzle)     │
                    ├──────────────────────────┤
                    │ Storage (S3/Supabase)    │
                    ├──────────────────────────┤
                    │ Stripe (billing SaaS)    │
                    ├──────────────────────────┤
                    │ Claude API (IA)          │
                    ├──────────────────────────┤
                    │ Resend (email)           │
                    └──────────────────────────┘
```

Multitenancy: cada comerciante = `tenant`. Subdominio `slug.dominio.com` o
path `/s/:slug`. Pagos/facturación del SaaS separados de los pagos del
comerciante (que son hacia su propia pasarela).

---

## 5. Modelo de datos (borrador)

Tablas principales:

- `users` — id, email, name, image, password_hash, locale, created_at.
- `accounts` — providers OAuth (Auth.js).
- `sessions`.
- `organizations` — id, owner_user_id, name, type (`merchant`|`agency`), plan_id,
  stripe_customer_id, status.
- `memberships` — user ↔ organization ↔ role (`owner`|`admin`|`editor`|`viewer`).
- `plans` — id, code, prices_json, limits_json (max_products, max_catalogs, etc.).
- `subscriptions` — org_id, plan_id, interval, current_period_end, status.
- `catalogs` — id, org_id, slug, name, domain, theme_json, settings_json,
  language, currency, published_at.
- `categories` — id, catalog_id, parent_id, name, position.
- `products` — id, catalog_id, category_id, name, description, price, compare_at,
  stock, sku, images_json, variants_json, active, position.
- `blocks` — id, catalog_id, type (`hero`|`gallery`|`testimonials`|...),
  position, config_json.
- `orders` — id, catalog_id, customer_json, items_json, totals_json, delivery_type,
  payment_method, payment_status, status, whatsapp_sent_at.
- `payment_methods` — id, catalog_id, provider (`stripe`|`paypal`|`mercadopago`|
  `manual`), credentials_json (cifrado), enabled.
- `analytics_events` — id, catalog_id, type, product_id, session_id, meta, ts.
- `assets` — id, org_id, url, kind, size.
- `invites` — id, org_id, email, role, token, expires_at.
- `audit_log` — quién, qué, cuándo.

Índices por `slug`, `catalog_id`, `org_id`.

---

## 6. Rutas (mapa)

Público:
- `/` home
- `/plans` precios (toggle anual/mensual + selector moneda)
- `/agencies` landing agencias
- `/digitalcatalog`, `/digitalmenu` landings verticales
- `/tools` índice de herramientas
- `/tools/whatsapp-link-generator`
- `/tools/product-description-generator`
- `/tools/profit-margin-calculator`
- `/tools/business-name-generator`
- `/tools/qr-code-menu-generator`
- `/tools/biography-generator`
- `/como-vender` índice de guías
- `/como-vender/[slug]` guía por vertical/país
- `/guides/[slug]` comparativas/listados
- `/terms`, `/privacy`, `/aup`

Auth:
- `/login`, `/signup`, `/password_forgot`, `/password_reset`, `/verify`

App (privado):
- `/app` selector de catálogos / overview
- `/app/catalogs/:id/edit` editor de bloques
- `/app/catalogs/:id/products`
- `/app/catalogs/:id/categories`
- `/app/catalogs/:id/orders`
- `/app/catalogs/:id/analytics`
- `/app/catalogs/:id/settings` (dominio, idioma, pagos, entregas)
- `/app/team` colaboradores
- `/app/billing` plan y facturación
- `/app/agency` (solo si type=agency) panel multi-cliente

Storefront (público del comerciante):
- `/s/[slug]` home del catálogo
- `/s/[slug]/c/[category]`
- `/s/[slug]/p/[product]`
- `/s/[slug]/checkout`
- `/s/[slug]/order/[id]`

API/Webhooks:
- `/api/webhooks/stripe`
- `/api/webhooks/mercadopago`
- `/api/ai/*`

---

## 7. Fases de entrega

Cada fase termina con **demo funcional y checklist aprobado** antes de pasar
a la siguiente.

### Fase 0 — Fundaciones (1 sesión)
- [ ] `package.json`, Next.js 15, Tailwind, shadcn/ui, ESLint, Prettier.
- [ ] Estructura de carpetas (`app/`, `components/`, `lib/`, `db/`, `emails/`).
- [ ] Layout base con header + footer placeholder.
- [ ] Paleta, tipografía, tokens de diseño.
- [ ] Página 404, 500, loading skeleton.
- [ ] Readme + `.env.example`.

### Fase 1 — Sitio de marketing público (1–2 sesiones)
- [ ] Home con hero, grilla de features, sección "cómo funciona", testimonios,
      CTA final.
- [ ] Header con menú **Recursos** (dropdown de 4 columnas: Herramientas,
      Guías por industria, Comparativas, Blog). Ver §7.R.
- [ ] `/plans` con toggle mensual/anual, selector de moneda (USD/COP/MXN/…),
      4 cards + Agency, tabla de comparación, FAQ.
- [ ] `/agencies` (ver §7.A): hero, planes, **calculadora de inversión** con
      slider 5–300 catálogos, tabla comparativa, badge "SIN COMISIONES",
      video, 4 casos de uso, beneficios, FAQ agencia, CTA demo.
- [ ] `/digitalcatalog` y `/digitalmenu` landings.
- [ ] `/proveedores-chinos` landing SEO.
- [ ] Footer con todas las secciones (Producto, Herramientas, Guías,
      Información, Soporte, Redes).
- [ ] Páginas legales estáticas (MDX).
- [ ] SEO: metadata, sitemap, robots, OG images.
- [ ] Cookie banner básico.

### Fase 2 — Autenticación (1 sesión)
- [ ] `/signup`, `/login`, `/password_forgot`, `/password_reset`.
- [ ] Auth.js con Credentials + Google.
- [ ] Email de verificación y reset (Resend).
- [ ] Middleware de rutas protegidas (`/app/*`).
- [ ] Creación automática de `organization` al registro.

### Fase 3 — Dashboard base y catálogos (2 sesiones)
- [ ] `/app` con lista de catálogos + crear catálogo.
- [ ] CRUD de catálogo (slug, nombre, idioma, moneda, logo, portada).
- [ ] CRUD de categorías (drag-and-drop reorder).
- [ ] CRUD de productos (imágenes múltiples, variantes simples, stock, SKU).
- [ ] Subida de imágenes a storage.
- [ ] Publicar / despublicar catálogo.

### Fase 4 — Storefront público (1–2 sesiones)
- [ ] `/s/[slug]` con vitrina y bloques renderizados.
- [ ] Listado por categoría, búsqueda, filtros.
- [ ] Ficha de producto con galería, variantes, cantidad.
- [ ] Carrito (cliente, persistido en localStorage).
- [ ] Checkout → datos del cliente, tipo de entrega, método de pago.
- [ ] Envío de pedido por `wa.me` (link pre-rellenado con resumen).
- [ ] Confirmación y número de orden.
- [ ] Tema/bloques responsivos y accesibles.

### Fase 5 — Pedidos, inventario y entregas (1 sesión)
- [ ] `/app/catalogs/:id/orders` listado + detalle + estados.
- [ ] Descuentos de stock automáticos.
- [ ] Configuración de entregas: recoger, domicilio, comer en sitio, zonas,
      horarios, tarifa de envío.
- [ ] Notificaciones (email + WhatsApp-click al comerciante).

### Fase 6 — Constructor visual de bloques (1–2 sesiones)
- [ ] Editor drag-and-drop de bloques en `/app/catalogs/:id/edit`.
- [ ] Bloques: hero, galería, producto destacado, testimonios, FAQ, CTA
      WhatsApp, mapa, formulario, redes sociales, countdown, banner,
      categorías grid, lista de productos, texto rico, HTML embed, video.
- [ ] Previsualización en tiempo real.

### Fase 7 — Pagos del comerciante (1 sesión)
- [ ] Conexión Stripe / MercadoPago / PayPal del comerciante.
- [ ] Método manual (transferencia/efectivo).
- [ ] Webhook de pagos → actualizar pedido.

### Fase 8 — Suscripciones SaaS (1 sesión)
- [ ] Integración Stripe para cobrar al comerciante su plan.
- [ ] `/app/billing`, upgrade/downgrade, cambio anual↔mensual.
- [ ] Gating por plan (límites de productos, catálogos, colaboradores).
- [ ] Webhooks Stripe.

### Fase 9 — Analítica (1 sesión)
- [ ] Tracking propio (page view, add_to_cart, begin_checkout, order_placed).
- [ ] Dashboard con gráficas (ingresos, top productos, conversión, fuentes).

### Fase 10 — IA (1–2 sesiones)
- [ ] Generador de catálogo inicial a partir de prompt del negocio.
- [ ] Generador de descripciones de productos.
- [ ] Reconocimiento de imágenes → campos autocompletados.
- [ ] Generador de biografías, nombres de negocio.
- [ ] Caché de prompts con Anthropic.

### Fase 11 — Herramientas gratis + menú Recursos (1 sesión)
Ver §7.R.
- [ ] `/tools` índice con 6 herramientas.
- [ ] Generador de link de WhatsApp (`/tools/whatsapp-link-generator`) con
      selector de país, validación de teléfono, mensaje pre-rellenado, QR y
      copy al portapapeles.
- [ ] Generador de descripciones con IA (3 variantes).
- [ ] Calculadora de margen de ganancia.
- [ ] Generador de nombres de negocio con IA.
- [ ] Generador de QR para menú (personalización de color/logo, export PNG/SVG).
- [ ] Generador de biografías con IA.
- [ ] Dropdown "Recursos" en header con 4 columnas.
- [ ] Schema SEO (`SoftwareApplication`, `FAQPage`) + metadata por tool.

### Fase 12 — Guías SEO por industria y comparativas (1 sesión)
Ver §7.R.
- [ ] Plantilla MDX (TOC sticky, breadcrumb, checklist, FAQ, CTA).
- [ ] `/como-vender` índice.
- [ ] 10–20 guías seeds `/como-vender/[slug]` (ropa, comida, pasteles, café,
      joyería, zapatos, cosméticos, etc.), con variantes por país (MX/CO/AR).
- [ ] `/guides` índice y `/guides/[slug]` (Comparativa, Versus, Tutorial,
      Restaurantes).
- [ ] Schema SEO (`HowTo`, `FAQPage`) y sitemap dinámico.

### Fase 13 — Agencias & multi-cliente (1–2 sesiones)
Ver §7.A para detalle completo.
- [ ] Modo agencia: `organizations.type = 'agency'` con hijos (clientes).
- [ ] Switcher de contexto entre clientes en el dashboard.
- [ ] Crear cliente (auto-crea organization + catálogo + invita owner).
- [ ] Roles `agency_owner`, `agency_operator`, `client_owner`.
- [ ] Plantillas de catálogo reusables entre clientes.
- [ ] Actualización masiva de productos (CSV / multi-catálogo).
- [ ] Facturación consolidada (una suscripción, N catálogos con escalones
      Starter / Professional / Agency Growth).
- [ ] White-label storefront y emails.
- [ ] Códigos de descuento cruzados.
- [ ] Flujo "Agendar demo" con Cal.com (equivalente a Zeeg).

### Fase 14 — Dominio propio y white-label (1 sesión)
- [ ] Conectar dominio del comerciante (CNAME).
- [ ] Verificación, SSL automático (Vercel).
- [ ] Ocultar marca propia en plan Pro+.

### Fase 15 — i18n y multi-moneda completa (1 sesión)
- [ ] Traducciones es/en/pt.
- [ ] Selector de moneda y formateo por locale en todo el stack.

### Fase 16 — Pulido, accesibilidad, performance (1 sesión)
- [ ] Lighthouse ≥ 90 en todas las rutas públicas.
- [ ] Auditoría a11y (focus, contraste, aria).
- [ ] Imágenes optimizadas (next/image + blur placeholder).
- [ ] Tests Playwright de flujos críticos.

### Fase 17 — Despliegue productivo (1 sesión)
- [ ] Vercel + Neon/Supabase + dominios.
- [ ] Variables de entorno y secretos.
- [ ] Monitoreo (Sentry), logs, uptime.
- [ ] Documentación de operación.

---

## 7.A — Detalle de la sección **Agencias**

Landing y módulo de producto pensado para agencias de marketing, distribuidores
multi-marca y cadenas con varias sucursales.

**Bloques de la landing `/agencies`:**
1. Hero: "Crea y gestiona múltiples catálogos desde un solo panel" + CTA
   "Agenda una demo" (integrar Cal.com / Zeeg).
2. **Planes de crecimiento** (Starter / Professional / Agency Growth) con
   **calculadora de inversión**:
   - Slider de cantidad de catálogos (5 / 20 / 50 / 100 / 200 / 300).
   - Toggle mensual / anual.
   - Selector multi-moneda (USD, MXN, BRL, CAD, CLP, COP, CRC, EUR, PEN).
   - Cálculo: `precio_total = base + (catalogos_extra × precio_unitario)`
     con descuentos por volumen y por pago anual.
3. Tabla **Feature comparison** (Gratis / Business / Agency Growth) agrupada
   por: Pedidos y Pagos · Productos · Catálogos · Marca y Dominio · Bloques y
   Diseño · Idioma y Colaboración · Funciones para Agencias.
4. Badge "SIN COMISIONES SOBRE VENTAS" (diferenciador clave).
5. Video "¿Cómo funciona?" (embed).
6. **Casos de uso reales** (4 cards): agencia con N restaurantes · marca
   con varias líneas · distribuidor B2B · restaurante multi-sucursal.
7. **Beneficios clave**: gestión multi-catálogo, pagos integrados, ingresos
   recurrentes para la agencia, white-label, actualización masiva.
8. FAQ específica de agencias.
9. CTA final + agendar demo.

**Módulo funcional en dashboard (`/app/agency`):**
- Listado de `organizations` (clientes) con estado, plan y catálogos.
- Crear cliente → genera organization + catálogo inicial + invita owner.
- Cambio rápido de contexto (switcher de cliente).
- Plantillas de catálogo reusables entre clientes.
- Actualización masiva de productos (CSV / seleccionar varios catálogos).
- Facturación consolidada a la agencia (una suscripción, N catálogos).
- White-label: ocultar marca propia y usar la de la agencia en storefront y
  emails.
- Códigos de descuento cruzados.
- Roles: `agency_owner`, `agency_operator`, `client_owner`.

**Data model impacto:**
- `organizations.type = 'agency'` puede tener `child_organizations` (clientes).
- Tabla `agency_clients` (agency_org_id, client_org_id, joined_at).
- `subscriptions` de tipo `agency` cuentan N catálogos bajo un solo pago.

---

## 7.R — Detalle del menú **Recursos**

"Recursos" es el menú desplegable del header que agrupa todo el contenido
SEO/lead-gen. No requiere login.

**Estructura del dropdown (agrupado en 4 columnas):**

1. **Herramientas gratuitas** → `/tools`
   - Generador de link de WhatsApp → `/tools/whatsapp-link-generator`
     (inputs: código país, teléfono, mensaje; output: enlace `wa.me` + QR + copy).
   - Generador de descripciones de producto con IA →
     `/tools/product-description-generator` (3 variantes por prompt).
   - Calculadora de margen de ganancia → `/tools/profit-margin-calculator`
     (costo, precio, margen %, utilidad).
   - Generador de nombres de negocio con IA →
     `/tools/business-name-generator`.
   - Generador de QR para menú → `/tools/qr-code-menu-generator`
     (sube URL, personaliza color/logo, descarga PNG/SVG).
   - Generador de biografías con IA → `/tools/biography-generator`.

2. **Guías por industria / país** → `/como-vender` (índice) y
   `/como-vender/[slug]` (30+ landings).
   Categorías: Comida (pasteles, comida, rápida, café, salsas, botanas,
   tamales, saludable) · Moda (ropa, zapatos, joyería, lencería, accesorios) ·
   Belleza (cosméticos) · Otros (artesanías, café). Con variantes por país:
   MX (default) / CO / AR.

3. **Guías y comparativas** → `/guides` (índice) y `/guides/[slug]`
   Tipos: `Comparativa`, `Versus`, `Tutorial`, `Restaurantes`.
   Ej.: mejor plataforma WhatsApp · plataforma A vs plataforma B · tienda en
   línea gratis · menú digital QR + WhatsApp.

4. **Blog** → subdominio externo `blog.*` (fase final; contenido editorial).

**Extras de la sección Recursos:**
- `/digitalcatalog` y `/digitalmenu` — landings verticales (accesibles también
  desde Recursos).
- `/proveedores-chinos` — landing SEO de directorio/guía.
- FAQ propia en cada herramienta y guía.
- Sitemap dinámico que incluya todas las guías/tools.
- Cada tool + guía lleva schema.org (`FAQPage`, `HowTo`, `SoftwareApplication`).

**Plantilla de herramienta (pattern):**
- Hero con título + bullet de beneficios.
- Formulario a la izquierda, preview en vivo a la derecha.
- Acción copy / descargar / compartir.
- FAQ debajo.
- CTA al producto principal ("crea tu catálogo").
- Cross-links a otras 2–3 herramientas relacionadas.

**Plantilla de guía (pattern, MDX):**
- Hero con breadcrumb + categoría + fecha actualización.
- TOC lateral sticky.
- Secciones: intro · paso a paso · tabla comparativa · checklist descargable ·
  FAQ · CTA.
- Autor + fecha + tiempo de lectura.

---

## 8. Cómo vamos a trabajar (proceso)

1. Te muestro el checklist de la **fase actual** al arrancar cada sesión.
2. Construyo lo listado y lo muestro en local (o capturas).
3. Revisas, me das ajustes, los aplico.
4. Marcamos la fase como **aprobada** y pasamos a la siguiente.
5. Todo lo decidido se refleja aquí en `architecture.md`.

---

## 9. Variables de entorno esperadas (referencia)

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLIC_KEY=
MERCADOPAGO_ACCESS_TOKEN=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 10. Riesgos y decisiones abiertas

- **Presupuesto IA**: Claude API tiene costo; activar caché de prompts y
  límites por plan.
- **Pagos del comerciante**: cada pasarela requiere onboarding/KYC; para MVP
  podemos soportar solo Stripe + manual y agregar el resto después.
- **Dominio propio**: requiere wildcard SSL y verificación, mejor en fase
  avanzada.
- **Blog**: ¿lo montamos dentro de la app (MDX) o lo dejamos en subdominio?
- **WhatsApp Cloud API vs wa.me**: empezamos con `wa.me` (sin API oficial,
  gratis). Upgrade a Cloud API solo si hace falta envíos automatizados.

---

## 10.B — Flujo de onboarding post-registro (observado)

Después de crear la cuenta, el usuario entra a un wizard "Primeros Pasos"
con una barra de progreso (0% → 100%) visible en la esquina. Cada paso se
replicará en nuestro clon.

> Este apéndice se va completando mientras recorremos el flujo real paso a
> paso. Marcar cada paso con capturas en `.research/` y con checklist aquí.

### Paso 1 — Elegir slug (URL de la tienda)
- Ruta: `/menus/create` (en nuestro clon: `/app/onboarding/slug` o
  `/app/catalogs/new`).
- Copy: "¡Empecemos a crear una nueva página! Crea un enlace único. Una vez
  seleccionado **no podrá cambiarse**. Puedes conectar tu propio dominio
  después."
- Input: subdominio `dominio.com/` + slug (placeholder `mipagina`), máx 30
  caracteres, contador visible `0/30`.
- CTA: "Continuar" (disabled hasta tener slug válido).
- UI extra: badge flotante "Primeros Pasos 0%".
- Implementación:
  - Validar slug en vivo (regex `^[a-z0-9-]{3,30}$`, sin guiones al inicio/fin).
  - Comprobar unicidad vs `catalogs.slug` con server action debounced.
  - Al confirmar: crear `catalogs` row con `slug`, `org_id`, `status='draft'`.
  - Emitir evento `onboarding.slug_selected` para analítica.
- Captura: `.research/06-onboarding-step1-slug.png`.

### Paso 2 — Prompt de negocio para la IA
- Copy: "¡Generemos un punto de partida! Escribe los detalles del negocio,
  incluido el nombre, qué vende, qué colores tiene y cualquier otra
  información relevante. Mientras más detallado, mejor."
- Input: textarea "¿De qué se trata este negocio?" máx 500 caracteres,
  contador visible, placeholder sugerente.
- CTA: "Continuar" (disabled hasta tener texto).
- Implementación:
  - Guardar el prompt como `catalogs.ai_prompt` para auditoría.
  - Este texto alimenta luego a la generación con Claude.
- Captura: `.research/07-onboarding-step2-business-desc.png`.

### Paso 3 — Método de recepción de pedidos
- Copy: "¿A dónde se deben enviar los pedidos? La página generará un mensaje
  prellenado que los clientes podrán enviar con los detalles."
- Radios (card-style): **WhatsApp** (default, "Abre WhatsApp con un mensaje
  prellenado") vs **Email** ("Los pedidos se envían a esta dirección").
- Si WhatsApp: selector de país (bandera + `+XX`) + input de teléfono con
  validación por país (libphonenumber-js).
- Si Email: input email con validación.
- CTAs: "Atrás" y "Crear" (disabled hasta que el campo contacto sea válido).
- Implementación:
  - Guardar `catalogs.order_channel` (`whatsapp`|`email`), `contact_phone`,
    `contact_country_code`, `contact_email`.
  - Default país desde IP geo (aquí salió `+57` Colombia).
- Captura: `.research/08-onboarding-step3-delivery-method.png`.

### Paso 4 — Generación automática del catálogo con IA
- Al clic en "Crear" aparece loader a pantalla completa:
  "Guardando todo lo necesario y construyendo la estructura de tu página 🌊"
  con avatar "AI".
- En background, llamada a IA que entrega:
  - Nombre comercial, tagline, descripción.
  - Lista de categorías iniciales (en la demo: Almuerzos, Platos Típicos,
    Hamburguesas, Jugos, Postres).
  - 1+ productos ejemplo con nombre, descripción, precio, imagen.
  - Esquema de colores sugerido.
  - Copys de bloques (hero, footer cta).
- Implementación:
  - Server Action `ai.generateCatalog({ prompt, locale, currency })` →
    Claude con tool-use para devolver JSON estricto (zod schema).
  - Persistir `catalogs`, `categories[]`, `products[]`, `blocks[]` en una
    sola transacción.
  - Caché de prompt-system (Anthropic prompt caching) para reducir costos.
  - Timeout + fallback a plantilla si falla.
- Redirige a `/menus/block-editor?menuId=:id&onboarding=new`.
- Captura: `.research/09-onboarding-step4-ai-generating.png`.

### Paso 5 — Editor de bloques (primera vista)
- URL: `/menus/block-editor?menuId=:id&onboarding=new`.
- **Sidebar izquierdo** (navegación del catálogo):
  `Detalles` · `Productos` · `Diseño` · `Estadísticas` · `Pedidos` ·
  `Carrito` · `Avanzado`.
- **Panel central**: "Diseño de Página" con tabs `Bloques` / `Global`,
  banner "¿Necesitas ayuda con el editor?" con video tutorial y botón
  "Agregar Bloque". Lista de bloques con drag-to-reorder y menú opciones.
- **Panel derecho**: preview iframe en vivo del storefront.
- **Header**: botón "Publicar" + avatar del usuario.
- **Modal de bienvenida** (tour): "Bienvenido al Editor de Bloques",
  progreso `1/4 pasos`, CTA "Entendido, voy a publicar".
- **Spotlight tour**: overlay oscuro con tooltip apuntando al botón
  "Publicar": "Haz clic en 'Publicar' aquí para que tu página esté en línea
  y continuar tu incorporación".
- Progreso global sube a **40%**.
- Bloques iniciales autogenerados (demo): Sección de Presentación · Catálogo
  de Productos · Botón de Carrito · Texto.
- Implementación:
  - `blocks` con `type`, `position`, `config_json` (ver §5).
  - Tour con librería tipo `shepherd.js` / `driver.js` o custom.
  - Preview sandboxed en iframe con mensajes postMessage para hot-reload.
- Captura: `.research/10-editor-bloques.png`.

### Paso 6 — Publicar
- Clic en "Publicar" dispara endpoint que marca `catalogs.published_at =
  now()` y hace accesible la URL pública `dominio/slug`.
- Modal de confirmación: "¡Cambios Publicados! Tu diseño ya está en vivo"
  con check ✓ "¿Qué acaba de pasar?" + "Siguiente paso: ¡Pruébalo!".
- Progreso `2/4 pasos`, barra global **60%**.
- CTA: "Ver código QR y enlace para probar".
- Implementación:
  - Invalidate ISR cache del storefront.
  - Emitir evento `catalog.published` → email + actualiza sitemap.
- Captura: `.research/11-after-publish.png`.

### Paso 7 — Compartir (QR + enlace público)
- URL: `/menus/menu-detail?menuId=:id&...`.
- Panel "Comparte" con:
  - QR grande autogenerado del enlace.
  - Botón "Imprimir QR".
  - Enlace público (ej. `https://marea.pro/tienda-demo-clon`) + botón copiar.
  - Atajos: "Ir al editor de Diseño", "Visitar".
- Panel "Información": fecha de creación, última actualización, total de
  visitas.
- Panel "SEO y Vista Previa" con acceso a Logo/SEO.
- Modal secundario "¡Hora de probar tu página!" con instrucciones de
  prueba, progreso `2/4 pasos`, CTA "Entendido, voy a probar".
- Implementación:
  - QR vía `qrcode` server-side + download PNG/SVG.
  - Track `total_visits` desde analytics_events.
- Captura: `.research/12-step5-qr-enlace.png`.

### Paso 8 — Pedido de prueba (flujo del cliente)

El usuario hace click en "Visitar" y se abre el storefront público en
`https://<dominio>/<slug>`. Flujo observado (URLs con query `?step=...`):

**8.1 `/:slug` (vitrina pública)**
- Hero con título + descripción autogenerada.
- Barra sticky con categorías (chips horizontales), botón ☰ para menú
  completo y botón 🔍 búsqueda.
- Toolbar con `Ordenar` y `Filtrar`.
- Grid de productos (card: imagen, nombre, descripción, precio, botón
  "Agregar a carrito").
- Footer con mensaje CTA + créditos "Creado con …" (reemplazar por marca
  propia; ocultable en planes Pro+).
- Al agregar, aparece barra flotante inferior con contador + "Ver carrito".
- Captura: `.research/14-storefront-publico.png` y
  `.research/15-cart-agregado.png`.

**8.2 `?step=products` (mini-carrito lateral)**
- Drawer derecho "Tu carrito – N Elementos".
- Lista con miniatura, nombre, descripción, precio, stepper `- 1 +`, basura.
- Totales parciales + CTA "Ver carrito".
- Captura: `.research/16-checkout-paso1.png`.

**8.3 `?step=products` vista completa (cart)**
- Pantalla completa "Carrito" con items editables.
- Panel derecho "Resumen del pedido": Elementos · Total parcial · CTA
  "Continuar".
- Captura: `.research/17-checkout-step-products.png`.

**8.4 `?step=delivery` (opciones de entrega)**
- Cards grandes: **Recoger en tienda** (default) / **A domicilio**.
- Si "A domicilio": pide dirección, zona, indicaciones, costo de envío según
  configuración del catálogo (pendiente de capturar).
- Panel derecho con resumen de elección + CTA "Continuar".
- Captura: `.research/18-checkout-step-delivery.png`.

**8.5 `?step=customer-data` (datos del cliente)**
- Header "Datos" con botón atrás.
- Sección "Información de contacto": Nombre + Teléfono (libphonenumber
  según país).
- Panel derecho muestra datos ingresados + CTA "Continuar".
- Dependiendo del método de pago / entrega, puede pedir email, dirección,
  NIT/CC, notas.
- Captura: `.research/19-checkout-customer-data.png`.

**8.6 `?step=summary` (resumen final)**
- "Resumen del pedido" con Información de contacto, Elementos (con cantidad
  y precio), Total parcial, **COSTO TOTAL** destacado en color de marca.
- CTA "Crear Pedido".
- Captura: `.research/20-checkout-summary.png`.

**8.7 "Pedido Generado" (confirmación + envío a WhatsApp)**
- Mensaje "Pedido Generado – Continúa para enviar tu orden".
- Botón grande **Enviar** que abre `https://api.whatsapp.com/send?phone=...&text=...`
  con mensaje prellenado.
- Formato del mensaje capturado (plantilla a replicar):
  ```
  ¡Hola! Vengo de  {storefront_url}

  Número de pedido:  {YYYYMMDD###}

  🗓️ Fecha:  {DD/MM/YYYY}
  🕐 Hora:  {HH:MM}

  👤 Información del cliente
  Nombre: {name}
  Teléfono: {phone}

  {delivery_line}          // "El pedido se recogerá en tienda" | "Dirección: ..."

  📝 Pedido

  xN {product_name}   $ {subtotal} {currency}

  💲 Costos

  Total parcial $ {subtotal} {currency}
  {shipping_line?}
  {discount_line?}

  Costo total:  $ {total} {currency}

  👆 Envía este mensaje para crear tu pedido.
  ```
- Implementación (nuestro clon):
  - Generar número de pedido tipo `YYYYMMDD###` (reinicio diario por
    catálogo).
  - Persistir `orders` con `status='pending_send'` antes de redirigir.
  - Construir URL `wa.me` con `encodeURIComponent` del mensaje.
  - Al enviar, emitir evento `order.sent_whatsapp` y mostrar pantalla de
    gracias con número de pedido, resumen y CTA "Volver a la tienda".
  - Si el método es Email → enviar por Resend en vez de WhatsApp.
  - Si es Stripe/MP/PayPal → insertar paso de pago antes de la confirmación
    y disparar WhatsApp solo tras `payment_status=succeeded`.
- Captura: `.research/21-order-created.png`.

### Paso 9 — "Hora de probar" y progreso 60% → 100%
Hasta aquí el progreso del onboarding cliente llega a **60% (2/4 pasos)** y
requiere completar: hacer un pedido de prueba (vimos 8.1–8.7) y pasos
finales del wizard que suelen incluir invitar equipo, conectar dominio o
elegir plan. (Pendientes de capturar si los exponen en tu cuenta.)

---

### Plantilla del mensaje WhatsApp (a usar en nuestro clon)

Archivo: `lib/whatsapp/order-template.ts`

```ts
export function buildWhatsAppOrderMessage(order: Order, catalog: Catalog) {
  const lines = [
    `¡Hola! Vengo de ${catalog.publicUrl}`,
    ``,
    `Número de pedido: ${order.code}`,
    ``,
    `🗓️ Fecha: ${fmtDate(order.createdAt)}`,
    `🕐 Hora: ${fmtTime(order.createdAt)}`,
    ``,
    `👤 Información del cliente`,
    `Nombre: ${order.customer.name}`,
    `Teléfono: ${order.customer.phone}`,
    ``,
    order.delivery.type === 'pickup'
      ? `El pedido se recogerá en tienda`
      : `📍 Dirección: ${order.delivery.address}`,
    ``,
    `📝 Pedido`,
    ``,
    ...order.items.map(i => `x${i.qty} ${i.name}   ${fmtMoney(i.subtotal, catalog.currency)}`),
    ``,
    `💲 Costos`,
    ``,
    `Total parcial ${fmtMoney(order.subtotal, catalog.currency)}`,
    order.shipping ? `Envío ${fmtMoney(order.shipping, catalog.currency)}` : null,
    order.discount ? `Descuento -${fmtMoney(order.discount, catalog.currency)}` : null,
    ``,
    `Costo total: ${fmtMoney(order.total, catalog.currency)}`,
    ``,
    `👆 Envía este mensaje para crear tu pedido.`,
  ].filter(Boolean).join('\n');

  return `https://api.whatsapp.com/send?phone=${catalog.whatsappPhone}&text=${encodeURIComponent(lines)}`;
}
```

### Modelo de datos impactado por el checkout

- `orders`:
  - `id`, `code` (`YYYYMMDD###`), `catalog_id`, `status`
    (`draft`|`pending_send`|`sent`|`paid`|`preparing`|`shipped`|`delivered`|
    `cancelled`).
  - `customer_json` (`{name, phone, email?, address?}`).
  - `items_json` (snapshot con `product_id`, `name`, `qty`, `unit_price`,
    `subtotal`, `variant`).
  - `delivery_json` (`{type: 'pickup'|'delivery', address?, zone?, fee?}`).
  - `payment_json` (`{method, status, provider_ref?}`).
  - `totals_json` (`{subtotal, shipping, discount, total, currency}`).
  - `whatsapp_sent_at`, `email_sent_at`.
  - timestamps.

### Rutas del storefront (clon)

- `/s/[slug]` vitrina.
- `/s/[slug]/c/[categorySlug]`.
- `/s/[slug]/p/[productSlug]` (ficha con variantes, stock).
- `/s/[slug]/cart` equivalente a `?step=products`.
- `/s/[slug]/checkout/delivery`.
- `/s/[slug]/checkout/contact`.
- `/s/[slug]/checkout/summary`.
- `/s/[slug]/checkout/confirm` (Pedido Generado + Enviar).
- `/s/[slug]/order/[code]` página pública del pedido (tracking).

### Paso 9 — Gestionar el pedido en el dashboard (cierre del onboarding)

**9.1 Widget "Primeros Pasos" (sticky, top-right)**
- Card colapsable con barra de progreso y checklist:
  1. ✓ Página creada y configurada
  2. ✓ Publicar cambios
  3. ✓ Realiza un pedido de prueba
  4. Gestiona tu pedido (paso activo, CTA →)
- Botón "Lo terminaré después".
- Capturas: `.research/23-primeros-pasos-panel.png`,
  `.research/25-primeros-pasos-expandido.png`.

**9.2 Bandeja de pedidos (`/menus/orders`)**
- Título "Pedidos y Formularios" con tabs: **Pedidos** / **Formularios**.
- Card de cuota: "Pedidos este mes 1/30" con barra de progreso (según plan).
- Filtros: `Estado` (select Todos), `Buscar` por # pedido, rango `Desde` /
  `Hasta`.
- Badge "Recibiendo pedidos en tiempo real" (websocket / SSE).
- Botón "Exportar" (CSV/XLSX).
- Tabla: # Número, Fecha, Total, Estado (combo editable), Detalles.
- Paginación configurable (20 por página default).
- Captura: `.research/26-orders-dashboard.png`.

**9.3 Detalle de pedido (drawer/modal)**
- Header: `Pedido #20260419001` · botón "Editar pedido" · cerrar.
- **Stepper de estados** (horizontal): `Recibido` → `En Preparación` →
  `Listo` → `Entregado`. Botón CTA grande para avanzar al siguiente estado.
- **Información General**: Fecha/hora, Precio Total, Fuente
  (`whatsApp`|`email`), Estado de Pago (`Pago Pendiente`|`Pagado`).
- **Información del cliente**: Nombre, Teléfono (click-to-WhatsApp).
- **Detalles de Entrega**: Tipo (`Recoger en sucursal`|`A domicilio` +
  dirección).
- **Productos**: lista con miniatura, nombre, descripción, cantidad,
  precio unitario.
- **Totales**: Subtotal, envío (si aplica), descuento (si aplica), Total.
- Acciones: **Imprimir Ticket** (PDF 80mm para impresora térmica),
  **Cerrar Detalles**, **Eliminar Pedido** (rojo, requiere confirmación).
- Capturas: `.research/29-order-detail-full.png`,
  `.research/30-order-detail-scrolled.png`.

**9.4 Cierre del onboarding (modal "Felicidades 100%")**
- Dispara al abrir por primera vez el detalle del pedido.
- Contenido: trofeo 🏆, "¡Felicidades! Has dominado los fundamentos",
  badge "100% Completado 🎉".
- Checklist "Lo Que Has Logrado": Creaste tu primera página · Publicaste ·
  Pedido de prueba · Gestionaste tu primer pedido.
- Bloque "¿Qué Sigue?": compartir, personalizar, explorar cupones.
- CTA "¡Empezar a Vender!" (cierra modal y marca onboarding como completo).
- Captura: `.research/27-order-detail.png`.

**Implementación (clon):**
- Tabla `user_onboarding_progress` (user_id, step, completed_at).
- Hook server-side que marca cada paso al dispararse su evento de dominio
  (`catalog.created`, `catalog.published`, `order.created`, `order.viewed`).
- Estados del pedido en enum: `received` · `preparing` · `ready` ·
  `delivered` · `cancelled`.
- Botón "Avanzar a …" aplica optimistic update y manda server action
  `orders.updateStatus`.
- Impresión de ticket con formato 80mm (`react-thermal-printer` o HTML
  imprimible).
- Badge realtime: Supabase Realtime / Pusher para listar nuevos pedidos sin
  recargar.

---

### Sidebar completo del catálogo (observado tras completar onboarding)

`Detalles` · `Productos` · `Diseño` · `Pedidos` · **`Pagos`** ·
`Estadísticas` · **`Checkout`** · `Avanzado`.

(Los módulos `Pagos` y `Checkout` aparecen al completar más del 40% del
onboarding; pueden ser features gating.)

Mapeo clon:
- `/app/catalogs/[id]/payments` — configurar Stripe / MP / PayPal / manual.
- `/app/catalogs/[id]/checkout` — configurar pasos del checkout, campos
  requeridos, métodos de entrega por zona, costos de envío.

---

### Paso 9 anterior — Completar perfil / invitar equipo / plan (aún pendiente de observar)

---

### Resumen de módulos del dashboard (observados)

`/menus/menu-detail?menuId=…` — Detalles: QR, enlace, SEO, logo, info.
`/menus/menu-products?menuId=…` — Productos.
`/menus/block-editor?menuId=…` — Diseño (editor de bloques).
`/menus/menu-analytics?menuId=…` — Estadísticas.
`/menus/orders?menuId=…` — Pedidos.
`/menus/shopping-cart?menuId=…` — Carrito (config).
`/menus/menu-advanced-config?menuId=…` — Avanzado.

Mapeo en nuestro clon (reemplazar `menus` por `catalogs`):
- `/app/catalogs/[id]` (overview/detalles)
- `/app/catalogs/[id]/products`
- `/app/catalogs/[id]/design`
- `/app/catalogs/[id]/analytics`
- `/app/catalogs/[id]/orders`
- `/app/catalogs/[id]/cart-settings`
- `/app/catalogs/[id]/advanced`

---

## 11. Siguiente paso

Cuando apruebes este documento, arrancamos por **Fase 0 — Fundaciones**:
crear el proyecto Next.js, paleta, layout y 404.

Decisiones que necesito confirmar antes:

1. ¿Nombre final? — **Resuelto: WaCommerce**.
2. ¿Paleta propuesta ok o cambiamos?
3. ¿Stack Next.js + Supabase + Stripe ok?
4. ¿País / idioma de arranque? (propuesto: español — Colombia por defecto,
   multi-moneda habilitada).
5. ¿Monorepo o app única? (propuesto: app única).
