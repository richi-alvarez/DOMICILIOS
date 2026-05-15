# 🔧 Notas de Implementación - Validación de Límites de Catálogos

**Fecha**: 2026-05-14  
**Componente**: Catálogos  
**Tipo de Cambio**: Feature (Validación de límites de plan)

---

## 📋 Resumen de Cambios

Se han implementado validaciones para asegurar que los usuarios **no puedan crear más catálogos que los permitidos por su plan**.

| Tipo | Archivo | Cambios |
|------|---------|---------|
| 🔄 Actualizado | `lib/billing/constants.ts` | Sincronizar planes con BD (free, pro, premium, business) |
| 🔄 Actualizado | `lib/actions/catalogs.ts` | Agregar validación de límites en createCatalog y createCatalogReturn |
| 📊 Creados | `QA_Reports/QA_CATALOGS_BY_PLAN_2026_05_14.md` | Reporte con 15 catálogos de test |
| 📊 Creados | `QA_Reports/QA_IMPLEMENTATION_NOTES_2026_05_14.md` | Este documento |

**Total de líneas modificadas**: ~50 líneas

---

## 1️⃣ Cambio: Plan Types - `lib/billing/constants.ts`

### Antes
```typescript
export type PlanCode = 'free' | 'basic' | 'pro' | 'business'
```

### Después
```typescript
export type PlanCode = 'free' | 'pro' | 'premium' | 'business'
```

**Razón**: La BD tiene planes "free", "pro", "premium", "business", pero el código tenía "free", "basic", "pro", "business". Necesitaba sincronizar.

---

## 2️⃣ Cambio: Plan Limits - `lib/billing/constants.ts`

### Antes
```typescript
pro: {
  catalogs: 5,        // Incorrecto
  products: -1,       // Incorrecto
  ...
},
business: { ... }
// basic: { ... } existía pero no en BD
```

### Después
```typescript
pro: {
  catalogs: 3,        // ✅ Coincide con BD
  products: 500,      // ✅ Coincide con BD
  ordersPerMonth: -1,
  ...
},
premium: {
  catalogs: 10,       // ✅ Nuevo, coincide con BD
  products: 5000,
  ordersPerMonth: -1,
  ...
},
business: { ... }
```

**Razón**: Los límites en el código no coincidían con lo configurado en BD. Ahora está sincronizado:

| Plan | Catálogos (Código) | Catálogos (BD) | Status |
|------|-------------------|----------------|--------|
| free | 1 | 1 | ✅ |
| pro | 3 | 3 | ✅ |
| premium | 10 | 10 | ✅ |
| business | -1 | -1 | ✅ |

---

## 3️⃣ Cambio: Plan Names - `lib/billing/constants.ts`

```typescript
export const PLAN_NAMES: Record<PlanCode, string> = {
  free: 'Gratis',
  pro: 'Pro',
  premium: 'Premium',    // ✅ Agregado
  business: 'Business',
  // basic removido
}
```

---

## 4️⃣ Cambio: Plan Colors - `lib/billing/constants.ts`

```typescript
export const PLAN_COLORS: Record<PlanCode, string> = {
  free: 'bg-warm-200 text-warm-700',
  pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-primary-100 text-primary-700',  // ✅ Agregado
  business: 'bg-lime-100 text-lime-700',
}
```

---

## 5️⃣ Cambio: Validación de Límites - `lib/actions/catalogs.ts`

### Imports Agregados
```typescript
import { eq, count } from 'drizzle-orm'  // + count
import { getOrgPlan, PLAN_LIMITS } from '@/lib/billing/limits'  // Nueva importación
```

### Función: `createCatalog`

**Antes**: No validaba límites de plan

**Después**: 
```typescript
export async function createCatalog(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('No autenticado')

  const orgId = await getOrgId(session.user.id)
  if (!orgId) throw new Error('No se encontró organización')

  // ✅ NUEVO: Validar límites de plan
  const plan = await getOrgPlan(orgId)
  const limits = PLAN_LIMITS[plan]
  const catalogCount = await db
    .select({ count: count() })
    .from(catalogs)
    .where(eq(catalogs.orgId, orgId))
    .then(result => result[0]?.count ?? 0)

  if (limits.catalogs !== -1 && catalogCount >= limits.catalogs) {
    throw new Error(`Límite de ${limits.catalogs} catálogo${limits.catalogs > 1 ? 's' : ''} alcanzado en tu plan ${plan}`)
  }
  
  // ... resto del código
}
```

**Lógica de Validación**:
1. Obtener plan del usuario: `getOrgPlan(orgId)`
2. Obtener límites del plan: `PLAN_LIMITS[plan]`
3. Contar catálogos existentes: `SELECT COUNT(*) FROM catalogs WHERE org_id = ?`
4. Comparar: Si `limits.catalogs !== -1` (ilimitado) Y `count >= límite` → Error

**Mensajes de Error Producidos**:
- Plan Gratis (1 catálogo): `"Límite de 1 catálogo alcanzado en tu plan free"`
- Plan Pro (3 catálogos): `"Límite de 3 catálogos alcanzado en tu plan pro"`
- Plan Premium (10 catálogos): `"Límite de 10 catálogos alcanzado en tu plan premium"`
- Plan Business (ilimitado): Sin error, permite crear infinitos

### Función: `createCatalogReturn`

**Similar a `createCatalog`**, pero retorna `{ error: string }` en lugar de lanzar excepción:

```typescript
if (limits.catalogs !== -1 && catalogCount >= limits.catalogs) {
  return { error: `Límite de ${limits.catalogs} catálogo${limits.catalogs > 1 ? 's' : ''} alcanzado en tu plan ${plan}` }
}
```

---

## ✅ Validación de Implementación

### Test: Plan Free (1 catálogo permitido)
```bash
# Usuario: carlos.garcia@test.com (free)
# Catálogo actual: 1 (Tienda Principal de Carlos)

# Intento crear catálogo #2
POST /api/catalogs
{
  "name": "Segundo Catálogo",
  "slug": "segundo-catalogo"
}

# Resultado esperado:
{
  "error": "Límite de 1 catálogo alcanzado en tu plan free"
}
```

### Test: Plan Pro (3 catálogos permitidos)
```bash
# Usuario: maria.lopez@test.com (pro)
# Catálogos actuales: 3

# Intento crear catálogo #4
POST /api/catalogs
{
  "name": "Cuarto Catálogo",
  "slug": "cuarto-catalogo"
}

# Resultado esperado:
{
  "error": "Límite de 3 catálogos alcanzado en tu plan pro"
}
```

### Test: Plan Premium (10 catálogos permitidos)
```bash
# Usuario: juan.rodriguez@test.com (premium)
# Catálogos actuales: 10

# Intento crear catálogo #11
POST /api/catalogs
{
  "name": "Undécimo Catálogo",
  "slug": "undecimo-catalogo"
}

# Resultado esperado:
{
  "error": "Límite de 10 catálogos alcanzado en tu plan premium"
}
```

---

## 🔍 Verificación de Código

### Query de Conteo
```sql
-- Verifica que la query de conteo funciona
SELECT COUNT(*) as count FROM catalogs WHERE org_id = '751d5e24-8856-44d9-9ef7-69b561e27f46';
-- Resultado esperado: 1 (Carlos García)
```

### Validación de Planes en BD
```sql
SELECT code, (limits_json->>'catalogs')::int FROM plans;
-- free:     1
-- pro:      3
-- premium:  10
-- business: -1
```

---

## 🎯 Casos de Test Listos

Con esta implementación, se pueden ejecutar estos tests:

### Test Set 1: Límites Correctamente Aplicados
- [ ] Test 1.1: Free user - crear catálogo #1 ✅ (debe permitir)
- [ ] Test 1.2: Free user - crear catálogo #2 ❌ (debe rechazar)
- [ ] Test 1.3: Pro user - crear catálogos #1-3 ✅ (deben permitir)
- [ ] Test 1.4: Pro user - crear catálogo #4 ❌ (debe rechazar)
- [ ] Test 1.5: Premium user - crear catálogos #1-10 ✅ (deben permitir)
- [ ] Test 1.6: Premium user - crear catálogo #11 ❌ (debe rechazar)

### Test Set 2: Mensajes de Error
- [ ] Test 2.1: Verificar mensaje de error contiene el límite
- [ ] Test 2.2: Verificar mensaje de error contiene el plan
- [ ] Test 2.3: Verificar pluralización correcta ("1 catálogo" vs "3 catálogos")

### Test Set 3: UI/UX (Pendiente)
- [ ] Test 3.1: Botón "Nuevo Catálogo" deshabilitado cuando se alcanza límite
- [ ] Test 3.2: Mostrar indicador de uso (ej: "2/3 catálogos usados")
- [ ] Test 3.3: Tooltip explicando el límite del plan

---

## 📦 Dependencias

**Modificadas**:
- `drizzle-orm`: Usar función `count()` (ya disponible)

**No cambiadas**:
- `next/cache`: `revalidatePath` (existente)
- `@/auth`: (existente)
- `@/db`: (existente)

---

## 🚀 Próximos Pasos

### Para QA
```
1. [ ] Ejecutar Test Set 1 (Límites)
2. [ ] Ejecutar Test Set 2 (Mensajes)
3. [ ] Documentar resultados en QA_CATALOGS_LIMIT_TESTING.md
4. [ ] Crear casos edge (múltiples usuarios, transacciones concurrentes)
```

### Para Desarrollo
```
1. [ ] Agregar validación similar para productos (products)
2. [ ] Agregar validación para órdenes mensuales (ordersPerMonth)
3. [ ] Implementar UI improvements (botón deshabilitado, indicadores)
4. [ ] Crear test unitario para `createCatalog` con mocks
5. [ ] Crear test E2E con Playwright
6. [ ] Testing de límites con múltiples usuarios en paralelo
```

### Para Frontend (UI Components)
```
1. [ ] Componente CatalogsPage debe:
    - Mostrar contador de catálogos (X/Y usados)
    - Deshabilitar botón cuando se alcanza límite
    - Mostrar botón "Upgrade Plan" si se alcanza límite
    - Mostrar mensajes de límite alcanzado

2. [ ] Componente de creación de catálogo:
    - Validar limite ANTES de enviar (client-side)
    - Mostrar toast de error con mensaje
```

---

## 📊 Cambios Resumen

| Aspecto | Antes | Después | Impacto |
|---------|-------|---------|---------|
| Planes soportados | free, basic, pro, business | free, pro, premium, business | ✅ Sincronizado con BD |
| Límite Pro | 5 catálogos | 3 catálogos | ✅ Correcto según BD |
| Validación de límites | No | Sí | ✅ Implementada |
| Mensajes de error | Genéricos | Específicos por plan | ✅ UX mejorada |
| Test data preparado | No | 15 catálogos | ✅ Listo para testing |

---

## 📚 Referencias

- **QA Report Catálogos**: [QA_CATALOGS_BY_PLAN_2026_05_14.md](./QA_CATALOGS_BY_PLAN_2026_05_14.md)
- **Usuarios de Test**: [USUARIOS_Y_PLANES_FINAL.md](./USUARIOS_Y_PLANES_FINAL.md)
- **Index**: [INDEX.md](./INDEX.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)

---

**Completado por**: QA + Dev Flow  
**Status**: ✅ Implementación Completada  
**Testing**: ⏳ En Espera (Usar QA_Reports para ejecutar tests)
