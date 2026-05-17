# ✅ PHASE 14 COMPLETADA: Quality Alerts & Notifications

## 📢 Funcionalidades Nuevas

### Sistema Inteligente de Alertas y Notificaciones

**Objetivo:** Alertar automáticamente a los usuarios cuando la calidad de sus catálogos disminuye o alcanza niveles críticos, permitiéndoles responder rápidamente.

---

## 🎯 Implementación

### 1. Tabla de Base de Datos: `quality_alerts`

**Ubicación: `/db/schema.ts`** (Nuevo)

#### Enum: `quality_alert_type`
```typescript
type = 'score_drop' | 'low_score' | 'dimension_drop' | 'critical_issue'
```

#### Estructura:
```sql
CREATE TABLE quality_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  type QUALITY_ALERT_TYPE NOT NULL,
  severity VARCHAR(32) DEFAULT 'medium' NOT NULL,  -- low, medium, high, critical
  previous_score INTEGER,
  current_score INTEGER,
  score_drop INTEGER,
  affected_dimension TEXT,  -- completeness, seo, consistency, sellability
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE NOT NULL,
  dismissed BOOLEAN DEFAULT FALSE NOT NULL,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  INDEX quality_alerts_catalog_id_idx ON catalog_id,
  INDEX quality_alerts_dismissed_idx ON dismissed
);
```

#### Características:
- ✅ Tipo de alerta específica
- ✅ Niveles de severidad (low/medium/high/critical)
- ✅ Comparación antes/después
- ✅ Información de dimensión afectada
- ✅ Mensaje personalizado
- ✅ Track de email enviado
- ✅ Puede ser descartada por usuario
- ✅ Timestamp de descarte

---

### 2. Server Actions: `/lib/actions/quality-alerts.ts`

**Archivo Nuevo (300+ líneas)**

#### Función: `detectQualityAlerts(catalogId)`

**Detecta automáticamente 4 tipos de alertas:**

1. **Score Drop** 🔻
   - Si score actual < score anterior
   - Severidad basada en magnitud (≥20 = crítica, ≥10 = alta)
   - Almacena anterior y actual para comparación

2. **Low Score** ⚠️
   - Si score < 50/100
   - Severidad: CRÍTICA
   - Una alerta por catálogo (no duplicadas)
   - Mensaje enfatiza revisión inmediata

3. **Dimension Drop** 📊
   - Caída en cualquiera de 4 dimensiones ≥10 puntos
   - Menciona dimensión específica (Completitud, SEO, etc)
   - Severidad: alta si drop ≥20, media si <20

4. **Critical Issue** 🚨
   - Disponible para alertas manuales futuras
   - Framework preparado para extensión

**Flujo:**
```typescript
const [latest, previous] = await getLastTwoAnalyses()
if (latest.score < previous.score) {
  await createAlert({
    type: 'score_drop',
    severity: calculateSeverity(drop),
    scoreDrop: drop,
    message: `Score: ${previous} → ${latest}`
  })
}
```

#### Función: `getQualityAlerts(catalogId, onlyUndismissed?)`
- Retorna todas las alertas activas (no descartadas)
- Ordenadas por fecha más reciente primero
- Parámetro para incluir/excluir descartadas

#### Función: `dismissAlert(alertId)`
- Marca una alerta como descartada
- Registra timestamp de descarte
- Usuario puede volver a ver si recarga

#### Función: `dismissAllAlerts(catalogId)`
- Descarta todas las alertas activas de un catálogo
- Batch operation eficiente
- Útil para limpiar multiples alertas

#### Función: `getCatalogAlertsSummary(catalogId)`
- Retorna conteo por severidad
- Retorna conteo por tipo
- Indica si hay alertas críticas o altas
- Usado en dashboards y resúmenes

---

### 3. Componente UI: `quality-alerts-panel.tsx`

**Ubicación: `/app/(app)/app/_components/analytics/quality-alerts-panel.tsx`** (Nuevo - 280+ líneas)

#### Modos:

**Modo Completo (compact=false)**
- Resumen con 4 columnas de severidades
- Lista detallada de todas las alertas
- Botón "Descartar todas"
- Colores por severidad (rojo/ámbar/azul)

**Modo Compacto (compact=true)**
- Indicador con conteo total
- Link "Ver detalles" a alerts
- Advertencia si hay críticas
- Perfecto para embedding en otras páginas

#### Características por Alerta:
- ✅ Ícono visual (AlertCircle/AlertTriangle/Info)
- ✅ Tipo y severidad claramente identificados
- ✅ Mensaje personalizado
- ✅ Valores anteriores/actuales si aplica
- ✅ Timestamp de creación
- ✅ Botón para descartar individual
- ✅ Color-coding por severidad

#### Estados Visuales:
```
CRÍTICA: Rojo (AlertCircle)        - Requiere acción inmediata
ALTA:    Ámbar (AlertTriangle)     - Requiere atención pronto
MEDIA:   Azul (Info)                - Revisar cuando sea posible
BAJA:    Gris (Info)                - Informativo
NINGUNA: Verde (Check) - Todo en orden
```

---

### 4. Integración en Quality Page

**Ubicación: `/app/(app)/app/catalogs/[id]/quality/page.tsx`** (Modificado)

#### Cambios:
- ✅ Importado `QualityAlertsPanel`
- ✅ Agregado en top de página (prominente)
- ✅ Antes de trends y scores
- ✅ Full width con ID para anchor links

#### Flujo Visual:
```
┌─────────────────────────────────────┐
│ 🚨 QUALITY ALERTS PANEL (Full)     │
│ ├─ Resumen por Severidad           │
│ └─ Lista Detallada de Alertas      │
├─────────────────────────────────────┤
│ [Analizar] [Descargar]              │
├─────────────────────────────────────┤
│ QUALITY TRENDS                      │
├─────────────────────────────────────┤
│ QUALITY SCORE                       │
└─────────────────────────────────────┘
```

---

### 5. Integración en Products Page

**Ubicación: `/app/(app)/app/catalogs/[id]/products/_components/products-list.tsx`** (Modificado)

#### Cambios:
- ✅ Importado `QualityAlertsPanel` en modo compacto
- ✅ Agregado al top de la página
- ✅ No interfiere con toolbar existing
- ✅ Link directo a `/quality#alerts`

#### Indicador Compacto:
```
┌─────────────────────────────────────┐
│ ⚠️ 3 alertas | Requiere atención    │
│    [Ver detalles →]                 │
├─────────────────────────────────────┤
│ [Escanear] [Analizar] [Importar]   │
│ [+ Crear nuevo]                     │
└─────────────────────────────────────┘
```

---

### 6. Auto-Detection en Quality Analysis

**Modificación: `/lib/actions/quality-analysis.ts`**

#### Cambios:
```typescript
// Después de guardar en quality_history:
try {
  const { detectQualityAlerts } = await import('@/lib/actions/quality-alerts')
  await detectQualityAlerts(catalogId)  // ← Automático
} catch (alertError) {
  // Warning silencioso, no interfiere con análisis
}
```

#### Flujo Automático:
```
User clicks "Analizar de Nuevo"
    ↓
analyzeeCatalogQuality() ejecuta
    ↓
Guarda en quality_history
    ↓
Automáticamente llama detectQualityAlerts()
    ↓
Crea registros en quality_alerts si aplica
    ↓
QualityAlertsPanel muestra alertas
```

---

## 📊 Tipos de Alertas Implementadas

### 1. Score Drop (Caída de Puntuación General)
```
Disparador: latest_score < previous_score
Severidad: 
  - CRÍTICA si drop >= 20
  - ALTA si drop >= 10
  - MEDIA si drop < 10
Mensaje: "Score: 75 → 58 (↓17 puntos)"
```

### 2. Low Score (Puntuación Baja)
```
Disparador: current_score < 50
Severidad: CRÍTICA
Mensaje: "⚠️ CRÍTICO: Puntuación baja (42/100)"
Uno por catálogo (no duplicadas)
```

### 3. Dimension Drop (Caída en Dimensión)
```
Disparador: 
  - Completeness: 80 → 65 (↓15)
  - SEO: 70 → 55 (↓15)
  - Consistency: 75 → 60 (↓15)
  - Sellability: 75 → 60 (↓15)
Severidad:
  - ALTA si drop >= 20
  - MEDIA si 10 <= drop < 20
Mensaje: "Completitud disminuyó: 80 → 65"
```

### 4. Critical Issue (Para Futuro)
```
Disponible para:
- Múltiples dimensiones bajando
- Catálogo sin productos
- Cambios anormales detectados
```

---

## 🎨 Visualización por Severidad

### Critical (Rojo)
- Ícono: AlertCircle
- Border: border-red-200
- Background: bg-red-50
- Text: text-red-900
- Ejemplos: Score < 40, drop > 25

### High (Ámbar)
- Ícono: AlertTriangle
- Border: border-amber-200
- Background: bg-amber-50
- Text: text-amber-900
- Ejemplos: Score < 60, drop 15-25

### Medium (Azul)
- Ícono: Info
- Border: border-blue-200
- Background: bg-blue-50
- Text: text-blue-900
- Ejemplos: Score 60-70, drop 10-15

### Low (Gris)
- Ícono: Info
- Border: border-warm-200
- Background: bg-warm-50
- Text: text-warm-900
- Ejemplos: Score > 70

### None (Verde)
- Ícono: Check
- Border: border-lime-200
- Background: bg-lime-50
- Text: text-lime-900
- Cuando: Sin alertas activas

---

## 🔌 Flujo de Datos

### Creación de Alerta:
```
Quality Analysis Complete
    ↓
Auto-call detectQualityAlerts()
    ↓
Compare current vs previous
    ↓
Condition met?
    ├─ YES → INSERT into quality_alerts
    └─ NO → Continue
    ↓
Update UI (QualityAlertsPanel)
```

### Lectura de Alertas:
```
QualityAlertsPanel mounts
    ↓
getQualityAlerts(catalogId)
    ↓
Query: WHERE dismissed = false AND catalog_id = ?
    ↓
Order by created_at DESC
    ↓
Render con iconografía
```

### Descarte de Alerta:
```
User clicks X button
    ↓
dismissAlert(alertId)
    ↓
UPDATE quality_alerts SET dismissed = true, dismissed_at = NOW()
    ↓
Remove from local state
    ↓
UI updates (alert desaparece)
```

---

## 📁 Archivos Creados/Modificados

### Nuevos
```
db/schema.ts
├── qualityAlertsEnum        # ✅ Nuevo
├── qualityAlerts table      # ✅ Nuevo

lib/actions/quality-alerts.ts
├── detectQualityAlerts()    # ✅ Nuevo
├── getQualityAlerts()       # ✅ Nuevo
├── dismissAlert()           # ✅ Nuevo
├── dismissAllAlerts()       # ✅ Nuevo
└── getCatalogAlertsSummary()# ✅ Nuevo

app/(app)/app/_components/analytics/
├── quality-alerts-panel.tsx # ✅ Nuevo (280+ líneas)

lib/
├── PHASE_14.md             # ✅ Nueva (esta documentación)
```

### Modificados
```
lib/actions/quality-analysis.ts
├── Importado detectQualityAlerts
└── Llamada automática en analyzeeCatalogQuality()

app/(app)/app/catalogs/[id]/quality/page.tsx
├── Import QualityAlertsPanel
└── Render al top de página

app/(app)/app/catalogs/[id]/products/_components/products-list.tsx
├── Import QualityAlertsPanel
└── Render en modo compacto
```

---

## 🔗 Integración con Fases Anteriores

```
Phase 11 → Quality Analysis (Claude + Server Actions)
    ↓
Phase 12 → Quality UI Integration (User Interface)
    ↓
Phase 13 → Quality Score History & Trends
    ↓
Phase 14 → Quality Alerts & Notifications ← NEW
    ↓
Phase 15 → (Email Reports, Webhooks, Comparisons, etc)
```

**Flujo Completo:**
```
Analizar Catálogo (11)
    ↓
Visualizar Análisis (12)
    ↓
Ver Historial (13)
    ↓
🚨 Recibir Alertas (14) ← NEW
    ↓
Actuar sobre Alertas
    ↓
Re-analizar
    ↓
Alertas se actualizan automáticamente
```

---

## ✨ Capacidades Desbloqueadas

### Usuarios Ahora Pueden
- ✅ Ver inmediatamente si hay problemas
- ✅ Identificar qué cambió exactamente
- ✅ Recibir alertas en real-time
- ✅ Descartar alertas cuando se resuelven
- ✅ Ver resumen de severidades
- ✅ Navegar directamente a problemas

### Impacto en Comportamiento
- ✅ Respuesta rápida a problemas
- ✅ Menos time-to-resolution
- ✅ Mayor proactividad
- ✅ Conciencia de calidad
- ✅ Menos catálogos degradados

---

## 🔮 Próximas Mejoras (Phase 15+)

- [ ] Email notifications automáticas
- [ ] Webhooks para integraciones
- [ ] Alertas programadas (diarias/semanales)
- [ ] Comparación inter-catálogos
- [ ] Predicción de degradación
- [ ] Recomendaciones automáticas por alerta
- [ ] Integración con Slack/Discord
- [ ] Alertas por usuario preferences

---

## 🎯 Performance & Escalabilidad

### Query Performance
```sql
-- Obtener alertas activas (indexada)
SELECT * FROM quality_alerts 
WHERE catalog_id = ? AND dismissed = FALSE
ORDER BY created_at DESC;  -- O(log n)
```

### Índices
- `quality_alerts_catalog_id_idx` - búsquedas por catálogo
- `quality_alerts_dismissed_idx` - filtrado rápido

### Almacenamiento
- 1 alerta ≈ 200-500 bytes
- 100 alertas = ~25-50 KB
- Descartadas pueden archivarse

---

## 🎉 Status

✅ **Phase 14 Completada**

Implementado:
- Tabla `quality_alerts` con enum de tipos
- Detección automática de 4 tipos de alertas
- Severidades basadas en magnitud (low/medium/high/critical)
- UI panel completo y compacto
- Integración automática en quality analysis
- Botones para descartar alertas
- Resumen de severidades
- Color-coding visual
- Full error handling

**Los usuarios ahora reciben alertas inteligentes cuando sus catálogos tienen problemas, permitiendo respuesta inmediata.** 🚨✨

---

## 📊 Ejemplo de Alertas Generadas

```
Scenario: Usuario re-analiza catálogo

Análisis 1 (Hace 1 día):
- Score: 78
- Completeness: 80
- SEO: 75
- Consistency: 80
- Sellability: 75

Análisis 2 (Hoy):
- Score: 62 (↓16)
- Completeness: 65 (↓15)
- SEO: 60 (↓15) 
- Consistency: 65 (↓15)
- Sellability: 65 (↓10)

Alertas Generadas:
1. Score Drop (ALTA) - 16 points
   → "Score: 78 → 62"
2. Dimension Drop (MEDIA) - Completeness
   → "Completitud: 80 → 65"
3. Dimension Drop (MEDIA) - SEO
   → "SEO: 75 → 60"
4. Dimension Drop (MEDIA) - Consistency
   → "Consistencia: 80 → 65"
5. Dimension Drop (BAJA) - Sellability
   → "Vendibilidad: 75 → 65"

Total: 5 alertas (1 ALTA + 4 MEDIA)
Usuario ve resumen y puede actuar
```

Totalmente integrado. 🚀
