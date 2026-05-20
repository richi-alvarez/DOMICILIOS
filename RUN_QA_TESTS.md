# 🎯 QA E2E COMPLETE - AGENTE DE PRUEBAS

## Ejecución

Para ejecutar el agente de pruebas E2E completo:

```bash
npx tsx scripts/qa-e2e-complete.ts
```

## Flujo Automatizado

El agente de pruebas realiza el siguiente flujo:

1. **Paso 1: Registro de Nuevo Usuario**
   - Navega a `/signup`
   - Crea un nuevo usuario con email único y contraseña
   - Email: `qa-test-{timestamp}@example.com`
   - Verifica redirección después del registro

2. **Paso 2: Logout y Login**
   - Cierra la sesión del usuario registrado
   - Realiza login nuevamente con las credenciales creadas
   - Verifica autenticación exitosa

3. **Paso 3: Crear Catálogo (4-Step Wizard)**
   - Step 1: Nombre del negocio + Tipo (Tienda)
   - Step 2: Configurar slug/enlace único
   - Step 3: Moneda (COP) + Descripción
   - Step 4: Información de contacto (Teléfono)
   - Crea el catálogo con nombre único: `QA Shop {timestamp}`

4. **Paso 4: Crear Categorías**
   - Navega a página de categorías
   - Crea 3 categorías:
     - Electronics
     - Accessories
     - Software

5. **Paso 5: Crear Productos**
   - Navega a página de productos
   - Crea 3 productos:
     - Gaming PC ($2,499)
     - Wireless Headphones ($199)
     - Antivirus Suite ($49)

6. **Paso 6: Verificar Preview del Diseño**
   - Navega a `/design`
   - Verifica que productos y categorías se visualizan en el preview
   - Captura screenshot final

## Características

✅ Ventana Playwright abierta para inspección en tiempo real
✅ Captura de screenshots en cada paso crítico
✅ Reporte markdown detallado con resultados
✅ Test data único para cada ejecución (timestamp)
✅ Manejo de errores y logs detallados

## Reporte

El reporte se genera automáticamente en:
```
QA_REPORTS/QA_E2E_COMPLETE_REPORT.md
```

## Archivos

- **Script Principal**: `scripts/qa-e2e-complete.ts`
- **Reporte**: `QA_REPORTS/QA_E2E_COMPLETE_REPORT.md`
- **Screenshots**: `/tmp/qa-e2e-*.png`

---

**Status**: 🚀 Ready for Testing
**Last Updated**: 2026-05-20
