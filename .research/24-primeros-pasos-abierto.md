# 24 — Widget "Primeros Pasos" (intento 1 de expansión)

![captura](./24-primeros-pasos-abierto.png)

- **URL:** `/menus/menu-detail?menuId=:id`
- **Momento del flujo:** intento de abrir el widget (no se expandió en
  este intento; hubo que disparar eventos pointer manualmente).

## Acción realizada (Playwright)

1. `browser_evaluate` buscando el botón y llamando `.click()` directo.
2. El click no abrió el panel (probable por el framework Angular de la
   app y los handlers específicos).
3. Se requirió despachar pointer/mouse events con `dispatchEvent`
   para disparar el handler correctamente.

## Elementos de UI observados

- Igual que captura 23 — widget seguía colapsado.
- Log: 12 errores de consola (no impactan UX pero nos indican que el
  componente puede tener race conditions).

## Lección para el clon

- Usar un **botón estándar** (`<button>`) en lugar de `<div role=button>`
  para evitar necesitar handlers custom de pointer.
- Manejar estado con `useState` + callback directo (`onClick`) para
  comportamiento predecible.
- En pruebas E2E (Playwright) con el clon, basta `page.getByRole(
  'button', { name: 'Primeros Pasos' }).click()`.

## Qué construir

- `<button onClick={() => setOpen(!open)}>` con `aria-expanded`.
- Animación con `framer-motion` (`AnimatePresence`) para fade + slide.
