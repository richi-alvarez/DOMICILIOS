#!/usr/bin/env python3
"""Genera el documento Word con las recomendaciones de arquitectura
(separar frontend/backend + microservicios) para el proyecto WaCommerce."""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

PRIMARY = RGBColor(0x0B, 0x5C, 0xAB)   # azul
DARK = RGBColor(0x1A, 0x1A, 0x1A)
MUTED = RGBColor(0x55, 0x55, 0x55)
ACCENT = RGBColor(0x0E, 0x7A, 0x5A)    # verde


def set_cell_bg(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tc_pr.append(shd)


def add_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Light Grid Accent 1'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ''
        p = hdr[i].paragraphs[0]
        run = p.add_run(h)
        run.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_bg(hdr[i], '0B5CAB')
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ''
            p = cells[i].paragraphs[0]
            run = p.add_run(str(val))
            run.font.size = Pt(9.5)
    if col_widths:
        for i, w in enumerate(col_widths):
            for r in table.rows:
                r.cells[i].width = Inches(w)
    doc.add_paragraph()
    return table


def h1(doc, text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(16)
    run.font.color.rgb = PRIMARY
    p.space_after = Pt(6)
    # borde inferior
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '2')
    bottom.set(qn('w:color'), '0B5CAB')
    pbdr.append(bottom)
    pPr.append(pbdr)
    return p


def h2(doc, text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(12.5)
    run.font.color.rgb = DARK
    return p


def body(doc, text, italic=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    run.italic = italic
    if italic:
        run.font.color.rgb = MUTED
    return p


def bullet(doc, text, level=0):
    p = doc.add_paragraph(style='List Bullet' if level == 0 else 'List Bullet 2')
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    return p


def numbered(doc, text):
    p = doc.add_paragraph(style='List Number')
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    return p


doc = Document()

# Estilo base
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(10.5)

# ---------------- Portada ----------------
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = title.add_run('Separación Frontend / Backend\ny Estrategia de Microservicios')
r.bold = True
r.font.size = Pt(24)
r.font.color.rgb = PRIMARY

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub.add_run('Proyecto WaCommerce — Plataforma SaaS de catálogos y pedidos por WhatsApp')
r.font.size = Pt(12)
r.font.color.rgb = MUTED

meta = doc.add_paragraph()
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = meta.add_run('Documento de recomendaciones de arquitectura · Junio 2026')
r.font.size = Pt(10)
r.font.color.rgb = MUTED
r.italic = True

doc.add_paragraph()
body(doc, 'Este documento presenta opciones con sus ventajas y desventajas (no una única '
          'receta) para (1) separar el frontend del backend y (2) evolucionar el backend hacia '
          'una arquitectura de microservicios, partiendo del estado actual del código.', italic=True)

doc.add_page_break()

# ---------------- 1. Estado actual ----------------
h1(doc, '1. Dónde estás hoy')
bullet(doc, 'Monolito Next.js 15 (App Router) desplegado en Vercel (vercel.json) con opción de '
            'self-host (Dockerfile / docker-compose).')
bullet(doc, 'La lógica de negocio YA está separada por dominio en lib/: catalogs, products, orders, '
            'payments, ai, whatsapp, scanner, reports, analytics, billing, monitoring, rag, etc. '
            'Las "costuras" para dividir ya existen.')
bullet(doc, 'Esa lógica se expone de dos formas mezcladas: Server Actions (lib/actions/*) que acoplan '
            'negocio con Next, y rutas HTTP (app/api/*, incluido un v1/ ya estilo REST).')
bullet(doc, 'Una sola base de datos PostgreSQL: 32 tablas en un único schema Drizzle compartido.')
bullet(doc, 'Ya existe Redis + una cola (lib/queue, scanner-queue): hay infraestructura asíncrona y el '
            'scanner/OCR ya está parcialmente desacoplado (webhooks/scanner).')

body(doc, 'Conclusión clave: no se parte de cero. Es un "modular monolith" de facto. El trabajo no es '
          'romper todo, sino formalizar las fronteras y extraer 2-3 piezas que realmente tienen otro '
          'perfil de ejecución.')

# ---------------- 2. Dos decisiones ----------------
h1(doc, '2. Antes de decidir: ¿microservicios o "backend separado"?')
body(doc, 'Son dos decisiones distintas; conviene no confundirlas:')
add_table(
    doc,
    ['Enfoque', 'Qué resuelve', 'Costo'],
    [
        ['Separar frontend ↔ backend',
         'Deploy independiente del web, API reutilizable (móvil, terceros), escalar web aparte',
         'Bajo-medio'],
        ['Microservicios',
         'Escalar/desplegar/fallar de forma independiente por dominio, autonomía de equipos',
         'Alto (red, datos distribuidos, observabilidad, DevOps)'],
    ],
    col_widths=[1.9, 3.4, 1.4],
)
body(doc, 'Los microservicios pagan cuando hay equipos múltiples, perfiles de escala muy distintos o '
          'necesidad de aislar fallos. En esta etapa, "separar backend + extraer 2-3 servicios" suele dar '
          'el 80% del beneficio con el 20% del costo.')

# ---------------- 3. Decisión 1 ----------------
h1(doc, '3. Decisión 1 — Separar frontend de backend (hacerlo primero)')

h2(doc, 'Opción A — Monorepo + "backend separado" (recomendada como inicio)')
body(doc, 'Turborepo / pnpm workspaces con apps/web (Next.js como BFF), apps/api (un solo backend) y '
          'packages/* compartidos (schema Drizzle, tipos, validators Zod). Un solo backend al principio, '
          'no N servicios.')
bullet(doc, 'Reutilizas todo tu lib/ y el schema → cero reescritura del dominio, tipos compartidos '
            'de extremo a extremo.')
bullet(doc, 'Frontend y backend despliegan por separado; el web deja de cargar lógica pesada.')
bullet(doc, 'Es el paso 1 obligatorio hacia microservicios (te da el "monolito separado" que luego '
            'estrangulas).')

h2(doc, 'Opción B — Next.js como BFF y backend en otro framework')
body(doc, 'apps/api en NestJS (TypeScript, inyección de dependencias, módulos, soporte nativo a '
          'microservicios y colas — encaja con tu organización por dominios y permite reusar Drizzle) o '
          'Fastify (más liviano, menos opinado).')
bullet(doc, 'NestJS te da estructura lista para luego cortar módulos en servicios.')
bullet(doc, 'Migrar lib/actions → controladores tiene trabajo, pero es mecánico.')

h2(doc, 'Opción C — Quedarte en Next con frontera dura (hexagonal)')
body(doc, 'No separas repos todavía: refactorizas lib/ a puertos/adaptadores (dominio puro sin imports '
          'de Next) y dejas Server Actions / API como adaptadores delgados.')
bullet(doc, 'Costo bajísimo, prepara el terreno sin romper el deploy.')
bullet(doc, 'No logra el deploy independiente solicitado.')

body(doc, 'Recomendación: empezar con A (o A→B). El monorepo con schema/tipos compartidos es lo que hace '
          'viable TypeScript en microservicios sin duplicar el modelo de datos.', italic=True)

# ---------------- 4. Decisión 2 ----------------
h1(doc, '4. Decisión 2 — Qué microservicios extraer (y en qué orden)')
body(doc, 'Patrón: strangler-fig (estrangulamiento), no big-bang. Se extrae un servicio, se pone detrás '
          'de un gateway y el resto sigue en el core. Orden sugerido por facilidad × beneficio en tu código:')
add_table(
    doc,
    ['#', 'Servicio a extraer', 'Por qué es buen candidato', 'Riesgo'],
    [
        ['1', 'Scanner / OCR',
         'Ya es async (Redis queue + webhook), CPU/RAM intensivo, llama a vision providers, escala distinto al web',
         'Bajo'],
        ['2', 'AI (generación de catálogos, RAG, respuestas WhatsApp LLM)',
         'Bursty, rate-limited por proveedor, con reintentos; su latencia no debe bloquear el web',
         'Bajo-medio'],
        ['3', 'WhatsApp (webhook + envíos + conversaciones)',
         'Event-driven y always-on (webhooks no encajan en serverless), estado propio',
         'Medio'],
        ['4', 'Payments (Stripe intents + webhooks)',
         'Sensible a seguridad; conviene aislarlo con su propio surface',
         'Medio'],
        ['5', 'Reports / Export (PDF/Excel + cron)',
         'CPU pesado y agendado; ideal como worker aparte',
         'Bajo'],
        ['—', 'Core (catalogs, products, orders, analytics, billing, auth)',
         'El corazón, con datos muy acoplados → se deja de último o nunca se parte',
         'Alto si se toca pronto'],
    ],
    col_widths=[0.3, 1.7, 3.3, 0.8],
)
body(doc, 'Patrón recomendado: un core service (modular monolith) + workers alrededor (scanner, ai, '
          'reports) + servicios always-on en el borde (whatsapp, payments webhooks). No 12 microservicios; '
          '1 core + 3-4 satélites.')

# ---------------- 5. Transversales ----------------
h1(doc, '5. Temas transversales (donde se gana o se pierde)')

h2(doc, 'Datos (lo más delicado con 32 tablas en 1 DB)')
bullet(doc, 'Opción 1 — DB compartida con bounded contexts (recomendada al inicio): una sola Postgres, '
            'pero cada servicio es "dueño" de sus tablas y nadie más las escribe. Migración barata.')
bullet(doc, 'Opción 2 — DB-per-service solo donde hay poco acoplamiento: scanner y ai casi no comparten '
            'tablas → candidatos naturales. Orders/products/billing están muy entrelazados → no separar pronto.')
bullet(doc, 'Evitar transacciones distribuidas: usar patrón outbox + eventos para consistencia eventual '
            '(ej. order.created).')

h2(doc, 'Comunicación')
bullet(doc, 'Síncrona (request/response): REST o tRPC dentro del monorepo (tipos compartidos).')
bullet(doc, 'Asíncrona (eventos de dominio): ya tienes Redis → Redis Streams o BullMQ ahora; migrar a '
            'NATS/RabbitMQ/Kafka solo si el volumen lo exige. Ej.: order.created → whatsapp + email + '
            'analytics se suscriben.')

h2(doc, 'Autenticación')
body(doc, 'Hoy NextAuth v5 en el web. Para servicios: el BFF (Next) valida la sesión y emite un JWT/HMAC '
          'de servicio hacia el backend (o un pequeño auth service que firme tokens). Los servicios internos '
          'se comunican con tokens de servicio (o mTLS).')

h2(doc, 'Gateway')
body(doc, 'Un API gateway / reverse proxy (Traefik, Kong, o el propio BFF de Next) enruta /api/* al '
          'servicio correcto y centraliza rate-limit, CORS y autorización.')

h2(doc, 'Deploy / orquestación')
bullet(doc, 'Ahora: docker-compose (ya lo tienes) con N contenedores → suficiente para empezar.')
bullet(doc, 'Después: Kubernetes/Nomad solo cuando el número de servicios o el escalado lo justifique. '
            'No empezar por k8s.')
bullet(doc, 'Atención: Vercel es ideal para el frontend, pero los servicios always-on (webhook WhatsApp, '
            'colas) no encajan en serverless → necesitan un host con procesos persistentes (Railway, Render, '
            'Fly.io, VPS o k8s).')

h2(doc, 'Observabilidad (obligatoria antes de distribuir)')
body(doc, 'Logs estructurados + trazas distribuidas (OpenTelemetry) + health checks. Ya tienes '
          'lib/monitoring y /api/health como buena base; extiéndelo a correlación de requests entre '
          'servicios antes de cortar.')

# ---------------- 6. Roadmap ----------------
h1(doc, '6. Roadmap por fases recomendado')
numbered(doc, 'Fase 0 — Frontera dura (sin separar deploy): refactor de lib/ a dominio puro '
              '(puertos/adaptadores); Server Actions y API como adaptadores delgados. Esto vuelve trivial '
              'todo lo demás.')
numbered(doc, 'Fase 1 — Monorepo + backend separado: Turborepo, apps/web (BFF) + apps/api (core) + '
              'packages/db|types|validators. Un backend, deploy independiente.')
numbered(doc, 'Fase 2 — Primer microservicio: Scanner/OCR (ya async). Valida el patrón gateway + eventos '
              '+ token de servicio con bajo riesgo.')
numbered(doc, 'Fase 3 — AI service y Reports worker.')
numbered(doc, 'Fase 4 — WhatsApp y Payments como servicios always-on con su propio runtime.')
numbered(doc, 'Fase 5 — Eventos de dominio (outbox) y, solo si hace falta, DB-per-service en scanner/ai.')
body(doc, 'El core (catalogs/products/orders/billing) puede quedarse como modular monolith '
          'indefinidamente — no todo tiene que ser microservicio.', italic=True)

# ---------------- 7. Para aterrizar ----------------
h1(doc, '7. Para aterrizarlo a tu caso: 3 preguntas clave')
body(doc, 'Las recomendaciones cambian bastante según:')
numbered(doc, 'El driver real — ¿por qué microservicios? ¿Escalar tráfico, aislar fallos, varios equipos '
              'en paralelo, o vender la API a terceros?')
numbered(doc, 'Escala y equipo — ¿cuánta gente programa esto y qué volumen de tráfico/pedidos hay hoy?')
numbered(doc, 'Dónde correrlo — ¿seguir en Vercel para el web? ¿Presupuesto/gusto por k8s o algo simple '
              '(Railway/Render/Fly/VPS)?')

doc.add_paragraph()
closing = doc.add_paragraph()
r = closing.add_run('Con esas respuestas se puede pasar de este menú de opciones a un diseño concreto: '
                    'qué servicios, qué datos, qué tecnología por servicio y el plan de migración fase por fase.')
r.italic = True
r.font.color.rgb = MUTED
r.font.size = Pt(10.5)

import sys
out = sys.argv[1] if len(sys.argv) > 1 else 'Arquitectura_Microservicios_WaCommerce.docx'
doc.save(out)
print('Generado:', out)
