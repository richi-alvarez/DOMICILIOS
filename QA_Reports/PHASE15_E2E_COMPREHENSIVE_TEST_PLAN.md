# 🧪 Phase 15 E2E Comprehensive Testing Plan

**Fase**: Phase 15 — Advanced Reports Features  
**Fecha**: 2026-05-19  
**Ejecutor**: Playwright CLI  
**Usuarios**: 4 (diferentes planes)  
**Cobertura**: Full E2E + Reportes + Pagos

---

## 📋 Matriz de Testing

### Usuarios Asignados

| # | Usuario | Email | Plan | Catálogos | Productos | Reportes |
|---|---------|-------|------|-----------|-----------|----------|
| 1 | Carlos García | carlos.garcia@test.com | Gratis | 1 | 10 | ✅ |
| 2 | María López | maria.lopez@test.com | Pro | 2 | 25 | ✅ |
| 3 | Juan Rodríguez | juan.rodriguez@test.com | Premium | 3 | 40 | ✅ |
| 4 | Ana Martínez | ana.martinez@test.com | Gratis | 1 | 15 | ✅ |

---

## 🔄 Flujo Completo por Usuario

### Para cada usuario:

```
1. REGISTRO/LOGIN
   └─ Registrar o login con credenciales
   └─ Verificar acceso al dashboard

2. CREACIÓN DE CATÁLOGO(S)
   └─ Crear catálogo según plan
   └─ Configurar nombre, descripción, categorías

3. CREACIÓN DE PRODUCTOS
   └─ Agregar productos (cantidad según plan)
   └─ Completar detalles: nombre, precio, imagen, descripción
   └─ Asignar categorías

4. CONFIGURACIÓN DE DISEÑO
   └─ Acceder a página de diseño
   └─ Configurar opciones de visualización
   └─ Subir imagen de portada
   └─ Seleccionar plantilla de catálogo
   └─ Configurar colores/overlay
   └─ Guardar diseño

5. VISUALIZACIÓN DEL CATÁLOGO
   └─ Acceder a QR/enlace público
   └─ Verificar que productos se muestren correctamente
   └─ Probar filtros y búsqueda

6. PROCESO DE COMPRA (Simular como cliente)
   └─ Seleccionar productos del catálogo
   └─ Agregar al carrito
   └─ Aplicar opciones (talla, color, etc.)
   └─ Revisar resumen de pedido
   └─ Seleccionar método de pago: EFECTIVO (nuevo)
   └─ Confirmar pedido
   └─ Recibir confirmación/número de orden

7. GENERACIÓN DE REPORTES
   └─ Acceder a Analítica > Reportes
   └─ Crear reporte de ventas
   └─ Exportar en CSV/XLSX/PDF
   └─ Verificar historial de exportaciones
   └─ Probar date picker personalizado
   └─ Compartir reporte con guest link
   └─ Programar envío automático (daily/weekly)

8. VALIDACIÓN DE ARCHIVADO
   └─ Crear segundo reporte
   └─ Archivar reporte
   └─ Verificar que desaparece de lista
   └─ Restaurar desde Archivados
   └─ Verificar que reaparece
```

---

## 🔧 Prerequisitos

### Usuarios existentes (usar como base)
```
Password común: Test@12345
```

### Métodos de Pago
- ✅ WhatsApp (existente)
- ❌ Tarjeta Crédito (skip si no está disponible)
- **✨ EFECTIVO (agregar como nueva opción)**

---

## 🎯 Casos de Prueba Específicos para Phase 15

### Export History (Paso 1)
- [ ] Exportar reporte en 3 formatos (CSV, XLSX, PDF)
- [ ] Verificar que cada export aparece en historial
- [ ] Verificar metadata (formato, tamaño, fecha)

### Date Picker (Paso 2)
- [ ] Clic en "Personalizado"
- [ ] Seleccionar rango personalizado (ej: últimos 15 días)
- [ ] Verificar que datos del gráfico cambian
- [ ] Verificar que historial se filtra por fechas

### Archive (Paso 3)
- [ ] Crear 2 reportes
- [ ] Archivar el primero
- [ ] Verificar que desaparece de la lista normal
- [ ] Verificar que aparece en "Archivados"
- [ ] Restaurar desde Archivados
- [ ] Verificar que vuelve a la lista normal

### Guest Share Links (Paso 4)
- [ ] Generar share link en un reporte
- [ ] Copiar URL
- [ ] Abrir en navegador incógnito (sin auth)
- [ ] Descargar reporte público
- [ ] Verificar que archivo es válido
- [ ] Revocar link
- [ ] Verificar que ya no funciona (404)

### Scheduled Reports (Paso 5)
- [ ] Configurar envío diario a email test
- [ ] Verificar que aparece en sección de Schedule
- [ ] Verificar cálculo correcto de nextRunAt
- [ ] Trigger manual del cron (POST /api/cron/report-delivery)
- [ ] Verificar que email se envía

---

## 💳 Método de Pago en Efectivo

### Cambios necesarios:
1. **Backend**: Agregar opción "efectivo" en enum de métodos de pago
2. **Frontend**: Mostrar nuevo botón en checkout
3. **DB**: Registrar pedidos con tipo de pago = "efectivo"
4. **Confirmación**: Mostrar "Pedido pendiente de pago en efectivo"

### Flujo esperado:
```
Cliente selecciona "Pago en Efectivo"
  ↓
Servidor guarda order.paymentMethod = 'cash'
  ↓
Estado pedido = pending (esperando pago)
  ↓
Cliente recibe: "Número de orden: #12345
               Monto: $X
               Instrucciones: Pagar en efectivo al entregador"
  ↓
En reportes: Mostrar pedidos con pago pendiente
```

---

## 📊 Ejecución

### Herramientas
- **Playwright CLI**: Para E2E automatizado
- **Docker**: PostgreSQL + app local
- **Curl/Thunder Client**: Para APIs (cron, schedule)

### Comando de ejecución
```bash
playwright test --config playwright.config.ts tests/phase15-e2e.spec.ts
```

### Reportes generados
- ✅ Test results (HTML)
- ✅ Screenshots/videos de fallos
- ✅ Execution log con timestamps
- ✅ Coverage de features

---

## ✅ Criterios de Aceptación

### Por usuario:
- [ ] Login exitoso
- [ ] Catálogo(s) creado(s)
- [ ] Productos cargados (cantidad correcta por plan)
- [ ] Diseño configurado
- [ ] Catálogo público accesible
- [ ] Compra completada (con pago en efectivo)
- [ ] Orden guardada en DB
- [ ] Reporte generado
- [ ] Export history muestra registros
- [ ] Archive/Restore funciona
- [ ] Share link genera URL válida
- [ ] Schedule se crea correctamente

### General:
- [ ] 4 usuarios testeados ✓
- [ ] 20+ productos en total
- [ ] 4+ reportes generados
- [ ] 3 formatos de export probados (CSV, XLSX, PDF)
- [ ] Date picker probado
- [ ] Archive/restore probado
- [ ] Guest share links probados
- [ ] Cron simulado
- [ ] 0 errores críticos

---

## 📝 Documentación de Resultados

Archivo de salida: `PHASE15_E2E_EXECUTION_RESULTS_2026_05_19.md`

Contendrá:
- Resumen ejecutivo (passed/failed/skipped)
- Detalles por usuario
- Screenshots de cada paso
- Logs de errores
- Recomendaciones

---

## ⏱️ Estimación de Tiempo

- Registro/Login: 5 min
- Creación de catálogos: 10 min
- Carga de productos: 15 min
- Configuración de diseño: 10 min
- Compras simuladas: 10 min
- Generación de reportes: 10 min
- Testing de Phase 15 features: 15 min
- **Total por usuario**: ~75 min
- **Total 4 usuarios**: ~300 min (5 horas)

---

## 🚀 Ejecución

Cuando esté listo, ejecutar:
```bash
# 1. Iniciar servicios
docker-compose up -d

# 2. Ejecutar playwright
npx playwright test tests/phase15-e2e-comprehensive.spec.ts --reporter=html

# 3. Generar reporte
open playwright-report/index.html
```
