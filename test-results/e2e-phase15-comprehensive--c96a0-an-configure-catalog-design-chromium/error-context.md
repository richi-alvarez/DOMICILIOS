# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/phase15-comprehensive.spec.ts >> Phase 15 - Advanced Reports Features E2E >> User: Carlos García (Gratis) >> 4. User can configure catalog design
- Location: tests/e2e/phase15-comprehensive.spec.ts:99:11

# Error details

```
Error: locator.isVisible: SyntaxError: Failed to execute 'querySelectorAll' on 'Document': '[data-testid*="template"]:first' is not a valid selector.
    at query (<anonymous>:5261:41)
    at <anonymous>:5271:7
    at SelectorEvaluatorImpl._cached (<anonymous>:5048:20)
    at SelectorEvaluatorImpl._queryCSS (<anonymous>:5258:17)
    at SelectorEvaluatorImpl._querySimple (<anonymous>:5138:19)
    at <anonymous>:5086:29
    at SelectorEvaluatorImpl._cached (<anonymous>:5048:20)
    at SelectorEvaluatorImpl.query (<anonymous>:5079:19)
    at Object.query (<anonymous>:5293:44)
    at <anonymous>:5251:21
Call log:
    - checking visibility of locator('[data-testid*="template"]:first, button:has-text("Selecciona un tema"):first')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "WaStore WaStore" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "WaStore" [ref=e5]
      - generic [ref=e6]: WaStore
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "Iniciar Sesión" [level=3] [ref=e10]
        - paragraph [ref=e11]: Accede a tu panel de WaStore
      - generic [ref=e13]:
        - button "Continuar con Google" [ref=e14]:
          - img
          - text: Continuar con Google
        - generic [ref=e17]: O continúa con email
        - generic [ref=e19]:
          - text: Correo electrónico
          - textbox "Correo electrónico" [ref=e20]:
            - /placeholder: tu@correo.com
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: Contraseña
            - link "¿Olvidaste tu contraseña?" [ref=e24] [cursor=pointer]:
              - /url: /password-forgot
          - generic [ref=e25]:
            - textbox "Contraseña" [ref=e26]:
              - /placeholder: Tu contraseña
            - button [ref=e27]:
              - img [ref=e28]
        - button "Iniciar Sesión" [disabled]
        - paragraph [ref=e31]:
          - text: ¿No tienes cuenta?
          - link "Crear cuenta gratis" [ref=e32] [cursor=pointer]:
            - /url: /signup
  - region "Notifications alt+T"
  - alert [ref=e33]
  - button "Open Next.js Dev Tools" [ref=e39] [cursor=pointer]:
    - img [ref=e40]
```