# 23 — Widget "Primeros Pasos" (colapsado)

![captura](./23-primeros-pasos-panel.png)

- **URL:** `/menus/menu-detail?menuId=:id` (badge sticky visible en todo
  el dashboard).
- **Momento del flujo:** visualización del widget flotante con 80%.

## Acción realizada (Playwright)

1. `browser_take_screenshot` full-page.
2. Se observa el widget en esquina superior derecha como pill con
   porcentaje y texto "Primeros Pasos".

## Elementos de UI observados

- Pill flotante cyan/teal con:
  - Círculo con % y barra radial.
  - Texto "Primeros Pasos".
  - Chevron (▾) para expandir.
- Posicionamiento fixed top-right, z-index alto.

## Qué construir en el clon

- Componente `OnboardingProgressPill` (client component):
  - Se muestra mientras `user.onboarding_progress < 100`.
  - `useOnboardingProgress()` hook que calcula el % desde los eventos
    completados.
  - Al click → expande a panel detallado (ver captura 25).
  - Click fuera → colapsa.
- Z-index superior al contenido pero inferior a modales.
- Accesibilidad: `aria-expanded`, focus visible.
