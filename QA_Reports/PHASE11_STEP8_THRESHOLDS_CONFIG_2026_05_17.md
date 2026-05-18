# Phase 11 - Step 8: Página de Configuración de Umbrales de Alertas

**Status**: ✅ **IMPLEMENTADO Y COMMITTED**  
**Date**: 2026-05-17 16:45 UTC  
**Commit**: `e65724e` - feat: Phase 11 Step 8 - Página de Configuración de Umbrales de Alertas

---

## 📋 Resumen

Se ha implementado una página de configuración que permite a administradores (Pro+ users) ajustar los 6 umbrales de alertas en runtime. Los cambios se persisten en un archivo JSON (`.monitoring-thresholds.json`) y se aplican inmediatamente sin reinicio del servidor. El sistema mantiene un fallback automático a valores predeterminados si la configuración es inválida.

---

## ✅ Lo Que Se Implementó

### 1. Módulo de Gestión de Umbrales (`/lib/monitoring/thresholds.ts`)

**Características:**
- ✅ `ThresholdConfig` interface con 6 umbrales configurables
- ✅ Persistencia en archivo JSON (`.monitoring-thresholds.json`)
- ✅ Cache en memoria con TTL de 1 minuto
- ✅ `getThresholds()` - async, para UI y operaciones administrativas
- ✅ `getThresholdsSync()` - sincrónico, para lógica de checking
- ✅ `saveThresholds(config)` - persiste cambios + actualiza cache
- ✅ `resetThresholds()` - restaura valores por defecto
- ✅ `getDefaultThresholds()` - retorna defaults de ALERT_THRESHOLDS
- ✅ Fallback automático a defaults si archivo inválido/no existe

**Interfaces:**
```typescript
interface ThresholdConfig {
  slowEndpoint: number       // > X ms = endpoint lento
  errorRate: number          // > X% = alerta warning
  cacheHitRate: number       // < X% = cache malo
  aiCostPerDay: number       // > $X/dia en AI
  highResponseTime: number   // > X ms promedio
  serviceDownThreshold: number  // N checks fallidos = alerta
}
```

### 2. Server Actions (`/lib/actions/monitoring-thresholds.ts`)

**Funciones:**
- ✅ `getThresholdConfig()` - lee config actual + defaults con access control
- ✅ `saveThresholdConfig(data: unknown)` - valida con Zod y guarda
- ✅ `resetThresholdConfig()` - restaura defaults desde UI

**Validación:**
```typescript
const ThresholdSchema = z.object({
  slowEndpoint: z.number().min(100).max(30000),
  errorRate: z.number().min(1).max(50),
  cacheHitRate: z.number().min(10).max(90),
  aiCostPerDay: z.number().min(1).max(1000),
  highResponseTime: z.number().min(100).max(10000),
  serviceDownThreshold: z.number().min(1).max(10),
})
```

### 3. Página Server Component (`/app/(app)/app/monitoring/thresholds/page.tsx`)

**Características:**
- ✅ Verificación de acceso (Pro+ only)
- ✅ Lock icon + mensaje para Free users
- ✅ Botón "Actualizar Plan" que redirige a /app/settings/billing
- ✅ Carga config inicial y la pasa al componente cliente

### 4. Formulario Client Component (`/app/(app)/app/monitoring/thresholds/_components/ThresholdsForm.tsx`)

**Características:**
- ✅ Grid responsive: 3 columnas en lg, 2 en md, 1 en sm
- ✅ 6 tarjetas con iconos (Clock, AlertTriangle, Database, TrendingUp, Zap, HardDrive)
- ✅ Inputs numéricos con min/max validation
- ✅ `useState` por cada threshold
- ✅ `useTransition` para pending state
- ✅ Botón "Restaurar predeterminados"
- ✅ Botón "Guardar cambios"
- ✅ Toast feedback (éxito/error)
- ✅ Info box con notas importantes
- ✅ Muestra default value si umbral cambió

**UI Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ⚙ Configuración de Umbrales de Alertas                 │
│  Ajusta los límites para activar alertas automáticas    │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🕐 Endpoint lento│  │ ⚠ Tasa de errores│  │ 💾 Cache hit rate│
│ [  2000  ] ms    │  │ [   5   ] %      │  │ [   50   ] %     │
│ > X ms = alerta  │  │ > X% = warning   │  │ < X% = warning   │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🤖 Costo IA/día  │  │ ⚡ Resp. time     │  │ 🔴 Serv. caído  │
│ [   50   ] USD   │  │ [  1000  ] ms    │  │ [   2   ] checks │
│ > $X = critical  │  │ > X ms = warning │  │ N+ fallos = alerta│
└──────────────────┘  └──────────────────┘  └──────────────────┘

📝 Notas importantes
💡 Los cambios se aplican inmediatamente...

[Restaurar predeterminados]  [Guardar cambios]
```

### 5. Integración en AlertManager (`/lib/monitoring/alerting.ts`)

**Cambios:**
- ✅ Import: `import { getThresholdsSync } from './thresholds'`
- ✅ `checkPerformanceAndAlert()` usa `getThresholdsSync()` en lugar de `ALERT_THRESHOLDS`
  - Error rate check: `if (errorRate > thresholds.errorRate)`
  - Response time check: `if (summary.performanceStats.avgResponseTime > thresholds.highResponseTime)`
- ✅ Thresholds se leen una sola vez por ciclo de checking

### 6. Exports (`/lib/monitoring/index.ts`)

**Nuevos exports:**
```typescript
export { getThresholds, getThresholdsSync, saveThresholds, resetThresholds, getDefaultThresholds } from './thresholds'
export type { ThresholdConfig } from './thresholds'
```

### 7. Git Ignore Update (`.gitignore`)

- ✅ Agregada línea: `.monitoring-thresholds.json`
- ✅ Config de runtime no se sube a repo

---

## 📊 Detalles Técnicos

### Flujo de Datos

**Lectura (UI → File):**
```
User navegua a /app/monitoring/thresholds
  ├── canAccessMonitoring() ← verifica Pro+ plan
  ├── getThresholdConfig() ← server action
  │   ├── getThresholds() ← lee del archivo/cache
  │   └── getDefaultThresholds() ← defaults para referencia
  └── ThresholdsForm recibe { config, defaults }
```

**Escritura (UI → File):**
```
User cambia errorRate (5 → 3) y clickea "Guardar"
  ├── saveThresholdConfig({ errorRate: 3, ... })
  │   ├── canAccessMonitoring() ← verifica Pro+ plan
  │   ├── ThresholdSchema.parse(data) ← Zod validation
  │   ├── saveThresholds(validated)
  │   │   ├── fs.writeFile('.monitoring-thresholds.json', json)
  │   │   ├── cachedConfig = config ← actualiza cache
  │   │   └── cacheTime = now()
  │   └── return { success: true }
  └── toast.success('Umbrales guardados...')
```

**Lectura en Checking (Memory):**
```
alertManager.checkPerformanceAndAlert()
  ├── getThresholdsSync()
  │   └── return cachedConfig (si TTL < 1 min) OR defaults
  └── if (errorRate > thresholds.errorRate) → createAlert()
```

### Persistencia y Cache

- **Archivo:** `.monitoring-thresholds.json` en root del proyecto
- **Cache TTL:** 60 segundos (1 minuto)
- **Fallback:** Si archivo no existe o es inválido → defaults
- **Sincronización:** `getThresholdsSync()` usa cache en memoria
- **Gitignore:** Config de runtime no se versionea

### Thresholds por Defecto (desde ALERT_THRESHOLDS)

```typescript
{
  slowEndpoint: 2000,        // 2 segundos
  errorRate: 5,              // 5%
  cacheHitRate: 50,          // 50%
  aiCostPerDay: 50,          // $50 USD
  highResponseTime: 1000,    // 1 segundo
  serviceDownThreshold: 2,   // 2 checks fallidos
}
```

### Características de Seguridad

- ✅ Access control: `canAccessMonitoring()` antes de acceder
- ✅ Zod validation: schema estricto con min/max por campo
- ✅ Error handling: try/catch + logging en todos los lugares
- ✅ No blocking: operaciones asincrónicas no bloquean la UI
- ✅ Cache en memoria: evita lecturas repetidas de archivo

---

## 🔒 Control de Acceso

La página `/app/monitoring/thresholds` requiere:
- ✅ Usuario autenticado
- ✅ Plan Pro, Premium o Business
- ✅ Si es Free: ve "Configuración Bloqueada" + botón upgrade

Verificación en:
- ✅ `/lib/actions/monitoring-thresholds.ts` - canAccessMonitoring() en todas las server actions
- ✅ `/app/(app)/app/monitoring/thresholds/page.tsx` - canAccessMonitoring() en server component

---

## 📈 Archivos Creados/Modificados

| Archivo | Acción | Líneas | Descripción |
|---------|--------|--------|------------|
| `/lib/monitoring/thresholds.ts` | CREAR | ~160 | Módulo central de gestión |
| `/lib/actions/monitoring-thresholds.ts` | CREAR | ~75 | Server actions con Zod |
| `/app/(app)/app/monitoring/thresholds/page.tsx` | CREAR | ~50 | Server component |
| `/app/(app)/app/monitoring/thresholds/_components/ThresholdsForm.tsx` | CREAR | ~200 | Client form component |
| `/lib/monitoring/alerting.ts` | MODIFICAR | +8 | Integración getThresholdsSync() |
| `/lib/monitoring/index.ts` | MODIFICAR | +5 | Exports nuevos |
| `.gitignore` | MODIFICAR | +1 | Ignora config runtime |

**Total:** 7 archivos, ~500 líneas de código nuevo

---

## 🧪 Verificación

### Compilación TypeScript
- ✅ `npx tsc --noEmit` - sin errores nuevos introducidos
- ✅ Todos los tipos completos
- ✅ Zod schema validado

### Testing Manual (cuando app esté corriendo)

**1. Sin configuración personalizada:**
```bash
# Free user
# Navegar a /app/monitoring/thresholds
# Ver: Lock icon "Configuración Bloqueada"
# Clic "Actualizar Plan" → redirige a /app/settings/billing ✓

# Pro user
# Navegar a /app/monitoring/thresholds
# Ver: Formulario con valores por defecto
# errorRate: 5%
# highResponseTime: 1000ms
# etc.
```

**2. Cambiar y guardar um umbral:**
```bash
# Pro user en /app/monitoring/thresholds
# Cambiar errorRate de 5 a 3
# Clic "Guardar cambios"
# Ver: toast.success "Umbrales guardados correctamente"
# Verificar: .monitoring-thresholds.json contiene { errorRate: 3, ... }
```

**3. Restaurar predeterminados:**
```bash
# Pro user en /app/monitoring/thresholds
# Clic "Restaurar predeterminados"
# Ver: toast.success "Umbrales restaurados a valores predeterminados"
# Verificar: .monitoring-thresholds.json se elimina O valores vuelven a defaults
# Inputs vuelven a mostrar valores por defecto
```

**4. Validación de rangos:**
```bash
# Pro user intenta guardar valores fuera de rango
# errorRate: 0 (min 1) o 100 (max 50)
# Clic "Guardar cambios"
# Ver: toast.error "Invalid configuration data"
# Inputs quedan sin cambiar
```

**5. Nueva alerta con threshold personalizado:**
```bash
# Cambiar errorRate de 5 a 2
# Crear condición que genera 2.5% error rate
# AlertManager.checkPerformanceAndAlert() dispara check
# Compara: 2.5 > 2 (threshold personalizado)
# ✓ Alert se crea con nuevo threshold
```

**6. Regresión - sin cambios en thresholds:**
```bash
# Si no hay .monitoring-thresholds.json
# getThresholds() fallback a getDefaultThresholds()
# AlertManager usa defaults (5% errorRate, 1000ms responseTime)
# ✓ Sistema funciona idéntico a Phase 11 Step 7
```

---

## 🔄 Regresión

✅ **No hay breaking changes:**
- Config es opcional (defaults si no existe)
- alertManager.checkPerformanceAndAlert() sigue igual, solo cambia fuente de thresholds
- Endpoints existentes no touchados
- Dashboard de alertas sin cambios

**Verificación de regresión:**
- ✅ Sin `.monitoring-thresholds.json` → usa defaults automáticamente
- ✅ Dashboard `/app/monitoring` sin cambios
- ✅ API `/api/monitoring/health`, `/api/monitoring/metrics` sin cambios
- ✅ API `/api/monitoring/alerts` sin cambios
- ✅ Notificaciones email/slack sin cambios
- ✅ Health check y metrics persistence sin cambios

---

## 📋 Ejemplo de Ejecución

### Escenario 1: Cambiar umbral de error rate

```typescript
// UI: User cambia errorRate de 5% a 3%
// Click "Guardar cambios"

// Backend:
await saveThresholdConfig({
  slowEndpoint: 2000,
  errorRate: 3,  // ← CAMBIADO
  cacheHitRate: 50,
  aiCostPerDay: 50,
  highResponseTime: 1000,
  serviceDownThreshold: 2,
})

// Resultado:
// 1. ✓ Validación Zod: 1 ≤ 3 ≤ 50 → OK
// 2. ✓ fs.writeFile('.monitoring-thresholds.json', json)
// 3. ✓ cachedConfig actualizado
// 4. ✓ toast.success('Umbrales guardados correctamente')
// 5. ✓ Siguiente checkPerformanceAndAlert() usa errorRate=3
```

### Escenario 2: Restaurar predeterminados

```typescript
// UI: User clic "Restaurar predeterminados"

// Backend:
await resetThresholdConfig()

// Resultado:
// 1. ✓ fs.unlink('.monitoring-thresholds.json')
// 2. ✓ cachedConfig = null
// 3. ✓ Siguiente getThresholds() retorna defaults
// 4. ✓ toast.success('Umbrales restaurados...')
// 5. ✓ Inputs en formulario muestran defaults nuevamente
```

### Escenario 3: Error rate personalizado dispara alerta

```typescript
// User cambió errorRate a 2%
// Sistema detecta 2.5% error rate

// checkPerformanceAndAlert():
const thresholds = getThresholdsSync()
// thresholds.errorRate = 2 (from .monitoring-thresholds.json)

if (errorRate > thresholds.errorRate) {  // 2.5 > 2 = TRUE
  await this.createAlert({
    severity: 'warning',
    title: 'High error rate detected',
    description: `Error rate: 2.50% (threshold: 2%)`
    // ↑ Usa threshold personalizado en descripción
  })
}

// Resultado:
// ✓ Alert creada en DB
// ✓ Notificación email/Slack enviada
// ✓ Cooldown de 5 minutos activo
```

---

## 🎯 Aceptación

✅ **Criterios cumplidos:**
- [x] Página de configuración de umbrales (6 thresholds)
- [x] Persistencia en JSON (no nueva tabla DB)
- [x] Cache en memoria con fallback a defaults
- [x] Server actions con Zod validation
- [x] Access control (Pro+ only)
- [x] UI responsivo con 6 inputs numéricos
- [x] Botones "Guardar cambios" y "Restaurar predeterminados"
- [x] Toast feedback (éxito/error)
- [x] Integración en AlertManager.checkPerformanceAndAlert()
- [x] Sin breaking changes
- [x] TypeScript strict mode
- [x] Gitignore config de runtime

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| Archivos nuevos | 4 |
| Archivos modificados | 3 |
| Líneas de código | ~500 |
| Thresholds configurables | 6 |
| Nuevos imports en alerting.ts | 1 |
| Nuevo código en checkPerformanceAndAlert | 2 líneas |
| Breaking changes | 0 |
| TypeScript errors nuevos | 0 |
| Dependencias npm nuevas | 0 |
| Config file path | `.monitoring-thresholds.json` |
| Cache TTL | 60 segundos |

---

## ✨ Destacados

🎯 **Sin nuevas dependencias** - Solo filesystem nativo  
💾 **Persistencia elegante** - JSON file + in-memory cache  
🔒 **Tipo-seguro** - Zod validation + TypeScript strict  
⚡ **Performante** - Cache evita I/O repetido  
🛡️ **Fallback automático** - Defaults si config inválida  
🎨 **UI responsivo** - Grid 3-2-1 columnas, iconos semánticos  
📊 **Configurable sin reinicio** - Cambios en runtime  
🔐 **Acceso controlado** - Pro+ only  

---

## 🚀 Siguiente: Phase 11 Step 9 (Opcional)

Posibles próximos pasos:
- **Step 9:** Dashboard de métricas específicas de IA (costos, uso, errores)
- **Step 10:** Alertas relacionadas con webhooks/integraciones externas
- **Phase 12:** Implementación de cuotas y rate limiting por plan

---

**Prepared by**: Claude Haiku 4.5  
**Branch**: testing  
**Commit**: `e65724e`  
**Status**: ✅ READY FOR QA
