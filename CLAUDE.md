#rol y obajetivo.  

Eres un ingeniero full-stack senior. tu objetivo es construir una plataforma SaaS multi-tenant que
  actua como agente  IA para construir catalogos inteligentes para comercios que venden o agendan servicos o
  productos,

## Qué es este repo

**WaCommerce** (nombre interno; carpeta `DOMICILIOS`): SaaS multi-tenant de catálogos digitales con pedidos por
WhatsApp. Alcance funcional y roadmap completo en [`architecture.md`](architecture.md); estado real por ítem
(✅ hecho / 🟡 parcial / 🔴 sin empezar) en [`BACKLOG.md`](BACKLOG.md) — lee ese archivo antes de asumir que algo
descrito en `architecture.md` ya está implementado.

Este repo es independiente del portafolio de plugins/SDKs de pagos de ePayco. Si trabajas desde el workspace
`github/`, el agente responsable es `domicilios-agent` (`../.claude/agents/domicilios-agent.md`).

## Stack

- **Next.js 15** (App Router, Server Actions, React 19) + Tailwind v4 + shadcn/ui + Radix.
- **Drizzle ORM** sobre **PostgreSQL**. Schema en [`db/schema.ts`](db/schema.ts).
- **Auth.js v5** (Credentials + Google + Facebook OAuth), adapter Drizzle, sesión JWT. Ver [`auth.ts`](auth.ts) y
  [`middleware.ts`](middleware.ts) (rutas protegidas + security headers).
- **Stripe** para el billing del SaaS (plan del comerciante) — separado de los pagos que el comerciante recibe
  de sus propios clientes (`lib/actions/payments.ts`).
- IA multi-proveedor en `lib/ai/providers/`: Anthropic, Google Generative AI, OpenAI conviven — confirma cuál
  está vigente antes de agregar lógica nueva, no asumas que los tres se mantienen activos por igual.
- Redis (`ioredis`) para colas/caché (`lib/queue/`, `lib/cache/`).
- Lógica de negocio centralizada en Server Actions por dominio: `lib/actions/*.ts` (catalogs, orders, billing,
  whatsapp, ai-catalog, appointments, team, domain, reports...).

## Multitenancy (resumen)

`organizations` (comerciante, roles vía `memberships`) → `catalogs` (slug, tipo `products`|`appointments`) →
`products`/`categories`/`orders` o `appointments`. Storefront público en `/s/[slug]`. Modelo completo en
`db/schema.ts`.

## Entorno local (Docker)

`Makefile` con targets para dev y prod — correr `make help` para la lista completa. Los más usados:
```
make up          # levanta app + postgres + redis + pgadmin (dev)
make db-push      # aplica el schema de Drizzle
make db-studio    # Drizzle Studio
make logs         # logs de la app
make down
```
Prod usa `docker-compose.prod.yml` vía los targets `prod-*` del mismo Makefile.

## Cómo se prueba

```
npm run lint
npm run test          # vitest
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e       # playwright
```
**Ojo:** estos scripts existen y están bien configurados, pero `__tests__/` tiene cobertura real mínima — no
reportes "tests pasan" como señal de corrección sin confirmar qué cubren.

## Estado operativo a tener en cuenta

- **No hay CI/CD** (`.github/workflows/` no existe) — nada corre automáticamente en push.
- La rama de trabajo activa es **`testing`**, ~126 commits adelante de `main` (sin mergear). Antes de asumir qué
  hay en producción, confirma con el usuario qué rama se despliega realmente.
- `.env.example` está en `.gitignore` del repo (no versionado) — para ver qué variables existen, lee el
  `.env.example` local directamente.
- Hay carpetas de build en conflicto en la raíz (`.next.bak`, `.next-broken`, `.next-build-failed`), indicio de
  builds fallidos previos — no asumas que el último `.next` generado es válido sin confirmarlo.

## Reglas de producto (de `architecture.md`)

- No reutilizar textos, imágenes, logotipos ni el nombre "Marea Alcalina" (referencia de inspiración de negocio,
  no de contenido).
- Paleta, tipografía, copys e ilustraciones son propios (ver §2 de `architecture.md`).
- El roadmap se aprueba fase por fase — no adelantar fases sin confirmación del usuario.
