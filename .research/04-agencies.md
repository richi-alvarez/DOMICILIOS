# 04 — Agencias

![captura](./04-agencies.png)

- **URL:** `https://mareaalcalina.com/agencies`
- **Momento del flujo:** landing para agencias / cadenas multi-marca.

## Acción realizada (Playwright)

1. `browser_navigate` a `/agencies`.
2. `browser_evaluate` para headings y contenido de secciones.
3. `browser_take_screenshot` full-page.

## Elementos de UI observados

- Hero con título + CTA "Agenda una demo" (externo a Zeeg/Cal.com).
- Sección **Planes de Crecimiento** con calculadora de inversión:
  slider 5–300 catálogos, toggle mensual/anual, multi-moneda.
- Tabla comparativa Gratis / Business / Agency Growth con grupos
  (Pedidos, Productos, Catálogos, Marca, Diseño, Idioma, Agencia).
- Badge "SIN COMISIONES SOBRE VENTAS".
- Video embed "¿Cómo funciona?".
- 4 casos de uso (agencia con restaurantes, marca multi-línea,
  distribuidor B2B, multi-sucursal).
- Beneficios clave (gestión multi-catálogo, pagos integrados, ingresos
  recurrentes).
- FAQ agencia + CTA demo.

## Qué construir en el clon

- Ruta `app/agencies/page.tsx`.
- Componentes: `AgencyHero`, `PricingCalculator` (slider +
  toggle + moneda), `FeatureComparisonTable`, `ValueBadge`,
  `VideoSection`, `UseCasesGrid`, `BenefitsGrid`, `AgencyFaq`,
  `BookDemoBlock`.
- Integración de calendario (Cal.com) para "Agendar demo".

## Módulo funcional asociado

- `/app/agency` en dashboard (multi-cliente).
- `organizations.type = 'agency'` + tabla `agency_clients`.
- Roles `agency_owner`, `agency_operator`, `client_owner`.
