# QA Report: Database Setup & Plan-Based Product Validation

**Fecha**: 2026-05-16  
**Tester**: Claude Code  
**Ambiente**: Docker Local (PostgreSQL + Next.js)  
**Objetivo**: Configure database, implement plan-based product limits, and test validation logic

---

## 📋 Resumen Ejecutivo

Se completó la configuración de base de datos PostgreSQL y se implementó la validación de límites de productos basada en el plan del usuario (Free: 30, Basic: 100, Pro: 500, Business: unlimited).

**Status**: ✅ **COMPLETADO** — Database setup y plan validation ready for end-to-end testing

---

## ✅ Configuración de Base de Datos Completada

### 1. Docker Compose Setup
- **Servicios iniciados**: PostgreSQL 16, Redis, pgAdmin
- **Base de datos**: `domicilios` creada y accesible
- **Conexión**: `postgresql://postgres:postgres@localhost:5432/domicilios`
- **Verificación**: `psql` conecta exitosamente

### 2. Migraciones Aplicadas
- **Estado**: Todas las tablas creadas correctamente
- **Archivos migrados**:
  - `0000_numerous_penance.sql` - Tablas principales
  - `0001_complex_turbo.sql` - Relaciones y constraints
- **Índices**: Creados para performance
- **Resultado**: ✅ No hay errores

---

## ✅ Test Data Creado

### Usuario de Prueba
```
Email: carlos.garcia@test.com
Nombre: Carlos García
Plan: Pro
Contraseña: Test@12345
Estado: ✅ Autenticación funcional
```

### Plan Configuration
| Plan | Código | Productos | Catálogos | Límite |
|------|--------|-----------|-----------|--------|
| Gratis | `free` | 30 | 1 | Activo ✅ |
| Basic | `basic` | 100 | 1 | Activo ✅ |
| Pro | `pro` | 500 | 3 | Activo ✅ |
| Business | `business` | unlimited | 10 | Activo ✅ |

### Catálogo de Prueba
```
Nombre: Farmacia Ferrer+
Slug: farmacia-ferrer
Org: Farmacia Test
Status: Borrador
Categorías: 1 (General)
Productos: 0
```

---

## ✅ Validación de Plan en Code

### Implementación en `/lib/actions/menu-scan.ts`

```typescript
// Línea 132-167: addProductsFromScan() - Plan Validation Logic

1. Get catalog from database
2. Get organization that owns catalog
3. Get active subscription for organization
4. Get plan details from subscription
5. Extract product limit from plan.limitsJson
6. Get current product count in catalog
7. VALIDATE: (current_count + new_products_count) <= plan_limit
8. Return detailed error if exceeds limit
9. Otherwise, proceed with import
```

**Mensajes de Error Personalizados**:
```
"No puedes agregar 25 productos. Tu plan permite 30 productos 
en total y ya tienes 10. Puedes agregar 20 más."
```

### Importaciones Agregadas
```typescript
import { 
  db, 
  products, 
  catalogs, 
  organizations,      // ← NUEVO
  subscriptions,      // ← NUEVO
  plans,             // ← NUEVO
  categories 
} from '@/db'
```

**Status**: ✅ All imports verified in db/index.ts exports

---

## ✅ Verificación de Base de Datos

### Query: Plan Limits Configuration

```sql
SELECT 
  u.email,
  o.name as org_name,
  p.code as plan_code,
  (p.limits_json->>'products')::text as product_limit,
  COUNT(pr.id) as current_products
FROM users u
JOIN memberships m ON u.id = m.user_id
JOIN organizations o ON m.organization_id = o.id
JOIN subscriptions s ON o.id = s.organization_id
JOIN plans p ON s.plan_id = p.id
LEFT JOIN catalogs c ON o.id = c.org_id
LEFT JOIN products pr ON c.id = pr.catalog_id
WHERE u.email = 'carlos.garcia@test.com'
GROUP BY u.email, o.name, p.code, p.limits_json;
```

**Resultado**:
```
email                  | org_name      | plan_code | product_limit | current_products
carlos.garcia@test.com | Farmacia Test | pro       | 500           | 0
```

✅ **Validación exitosa**: Pro plan correctly shows 500 product limit

---

## ✅ Testing Manual con Playwright

### Flow Ejecutado

```
[1] Home page → Iniciar Sesión
    ↓ ✅
[2] Login form carga (email + password inputs)
    ↓ ✅
[3] Ingreso credenciales: carlos.garcia@test.com / Test@12345
    ↓ ✅ (bcrypt hash generado y verificado)
[4] Click en "Iniciar Sesión"
    ↓ ✅ Redirect a /app
[5] Dashboard "Mis catálogos" carga
    ↓ ✅ Muestra: "Pro" plan, "1 catálogo", "1 / 3" catalogs
[6] Click en "Farmacia Ferrer+"
    ↓ ✅ Abre detalles del catálogo
[7] Click en "Productos"
    ↓ ✅ Abre página de productos
[8] Click en "Escanear menú"
    ↓ ✅ Modal abre en estado "initial"
    - Muestra: Área drag & drop
    - Botones: "Tomar foto", "Elegir archivo"
    - Mensaje: "Arrastra fotos de tu menú aquí"
    - Especificación: "Imágenes JPG o PNG (máx 10MB por archivo)"
```

**Estado Modal**: ✅ **INITIAL** (Drag & drop area visible)

---

## 🔒 Seguridad de Contraseñas

### Implementación Bcrypt

```typescript
// auth.ts - Línea 46
const passwordMatch = await bcrypt.compare(
  credentials.password, 
  user.passwordHash
)
```

**Test User Hash**:
- Algoritmo: bcrypt (rounds: 10)
- Password: `Test@12345`
- Hash: `$2b$10$PXLECYL5KTcM5Hc3G26UfO6obkQHz9C78UihcaTVegSyz6lJaQS3q`
- **Status**: ✅ Verificado durante login

---

## ⚙️ Archivos Modificados/Creados

| Archivo | Cambios | Status |
|---------|---------|--------|
| `.env.local` | Agregado DATABASE_URL + DB_* variables | ✅ |
| `/lib/actions/menu-scan.ts` | Agregada plan validation en addProductsFromScan() | ✅ |
| Base de datos PostgreSQL | Tablas + test data + plan configs | ✅ |
| Docker | Servicios iniciados (postgres, redis, pgadmin) | ✅ |

---

## 📊 Validación de Límites de Productos

### Escenarios de Test Preparados

#### Escenario 1: Pro Plan (500 productos)
```
Usuario: carlos.garcia@test.com
Plan: Pro
Limit: 500
Productos actuales: 0
Test: Agregar 25 productos → ✅ Debe permitir (25 ≤ 500)
```

#### Escenario 2: Free Plan (30 productos)
```
Plan: Free
Limit: 30
Productos actuales: 10
Test: Agregar 25 → ❌ Error esperado (10 + 25 = 35 > 30)
Mensaje: "Puedes agregar 20 más"
```

#### Escenario 3: Business Plan (ilimitado)
```
Plan: Business
Limit: unlimited
Test: Agregar 10,000 → ✅ Debe permitir siempre
```

---

## 🧪 Pruebas Implementadas

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Resultado**: ✅ Sin errores en menu-scan.ts

### Server Running
```bash
npm run dev
```
**Status**: ✅ Server compila y corre sin errores (warning de dynamic import esperado)

### Database Connection
```bash
psql postgresql://postgres:postgres@localhost:5432/domicilios
```
**Status**: ✅ Conexión exitosa

---

## 🎯 Próximos Pasos

### Phase 1: End-to-End Testing (Listo)
1. ✅ Database setup completado
2. ✅ Plan validation implementado
3. ⏳ Test de upload de imagen real
4. ⏳ Test de procesamiento con Claude Vision
5. ⏳ Verificación de plan limits durante import

### Phase 2: UI Flow Testing
- [ ] Upload image → Processing state
- [ ] Processing → Success state (con contador)
- [ ] Success → Results state (tabla editable)
- [ ] Edición inline de campos
- [ ] Selección/deselección de productos
- [ ] Import con validación de plan

### Phase 3: Error Handling
- [ ] Archivo corrupto
- [ ] Plan limit exceeded
- [ ] Database error during import
- [ ] Claude Vision API error

---

## 🔍 Debugging Info

### Database Credentials
```
Host: localhost:5432
User: postgres
Password: postgres
Database: domicilios
```

### App URL
```
http://localhost:3000
```

### Test User
```
Email: carlos.garcia@test.com
Password: Test@12345
```

### Endpoints para Testing
```
Login:     http://localhost:3000/login
Dashboard: http://localhost:3000/app
Catalog:   http://localhost:3000/app/catalogs/b47ac10b-58cc-4372-a567-0e02b2c3d479
Products:  http://localhost:3000/app/catalogs/b47ac10b-58cc-4372-a567-0e02b2c3d479/products
```

---

## 📋 Checklist de Verificación

- [x] Database PostgreSQL iniciada (docker-compose)
- [x] Migraciones aplicadas exitosamente
- [x] Test data creado (user, org, plan, catalog)
- [x] Contraseña bcrypt hasheada y verificada
- [x] Plan configuration en database
- [x] Plan validation logic implementada en menu-scan.ts
- [x] Imports agregados y verificados
- [x] Login funcional
- [x] Navigation a scanner modal funcional
- [x] Modal inicial state visible
- [x] TypeScript sin errores
- [x] Server running sin errores
- [ ] Image upload y procesamiento con Claude Vision
- [ ] Product import con plan validation
- [ ] CSV export functionality
- [ ] Error messages personalizados

---

## 📸 Screenshots/Evidence

- ✅ Home page loads
- ✅ Login form visible
- ✅ Login succeeds (redirect a /app)
- ✅ Dashboard shows Pro plan
- ✅ Catalog visible en lista
- ✅ Products page accesible
- ✅ Scanner modal abre
- ✅ Scanner modal inicial state visible

---

**Reporte completado**: 2026-05-16 14:30 UTC

**Próximo paso**: Realizar test end-to-end con imagen real de Farmacia Ferrer+ para verificar:
1. Claude Vision processing
2. Product extraction (20+ items esperados)
3. Plan limit validation (Pro plan permite 500 → 25 items OK)
4. Editable table functionality
5. Final import success

