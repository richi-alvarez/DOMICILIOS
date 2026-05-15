# 📋 QA Report: Catálogos Creados por Plan (2026-05-14)

**Fecha**: 2026-05-14  
**Objetivo**: Crear catálogos de prueba respetando los límites de cada plan  
**Estado**: ✅ COMPLETADO

---

## 📊 Resumen Ejecutivo

Se han creado **15 catálogos de prueba** distribuidos según los límites de cada plan de suscripción. Cada usuario ahora puede testear creación, edición y validación de catálogos dentro de sus límites permitidos.

| Usuario | Plan | Catálogos Permitidos | Catálogos Creados | Status |
|---------|------|---------------------|-------------------|--------|
| carlos.garcia@test.com | GRATIS | 1 | 1 | ✅ |
| ana.martinez@test.com | GRATIS | 1 | 1 | ✅ |
| maria.lopez@test.com | PRO | 3 | 3 | ✅ |
| juan.rodriguez@test.com | PREMIUM | 10 | 10 | ✅ |
| **TOTAL** | — | **15** | **15** | ✅ |

---

## 👤 Catálogos por Usuario

### 1️⃣ Carlos García (GRATIS - 1 catálogo)
**Email**: `carlos.garcia@test.com`  
**Límite Plan**: 1 catálogo

| # | Nombre | Slug | Status | Contacto |
|---|--------|------|--------|----------|
| 1 | Tienda Principal de Carlos | `carlos-tienda-principal` | draft | +57 3001234567 |

**Testing**: Verificar que NO permite crear un segundo catálogo

---

### 2️⃣ Ana Martínez (GRATIS - 1 catálogo)
**Email**: `ana.martinez@test.com`  
**Límite Plan**: 1 catálogo

| # | Nombre | Slug | Status | Contacto |
|---|--------|------|--------|----------|
| 1 | Tienda de Ana Martínez | `ana-tienda` | draft | +57 3007654321 |

**Testing**: Verificar que respeta límite de 1 catálogo

---

### 3️⃣ María López (PRO - 3 catálogos)
**Email**: `maria.lopez@test.com`  
**Límite Plan**: 3 catálogos

| # | Nombre | Slug | Status | Contacto |
|---|--------|------|--------|----------|
| 1 | Restaurante María López | `maria-restaurante` | draft | +57 3009876543 |
| 2 | Pastelería María | `maria-pasteleria` | draft | +57 3009876543 |
| 3 | Bebidas y Refrescos María | `maria-bebidas` | draft | +57 3009876543 |

**Testing**: Crear catálogo #4 y verificar mensaje de límite alcanzado

---

### 4️⃣ Juan Rodríguez (PREMIUM - 10 catálogos)
**Email**: `juan.rodriguez@test.com`  
**Límite Plan**: 10 catálogos

| # | Nombre | Slug | Status |
|---|--------|------|--------|
| 1 | Comida Principal - Juan | `juan-comida-principal` | draft |
| 2 | Desayunos Especiales | `juan-desayunos` | draft |
| 3 | Postres Gourmet | `juan-postres` | draft |
| 4 | Bebidas Premium | `juan-bebidas` | draft |
| 5 | Sopas y Caldos | `juan-sopas` | draft |
| 6 | Ensaladas Frescas | `juan-ensaladas` | draft |
| 7 | Sándwiches y Tortas | `juan-sandwiches` | draft |
| 8 | Carnes Asadas | `juan-carnes` | draft |
| 9 | Mariscos Frescos | `juan-mariscos` | draft |
| 10 | Platos Especiales | `juan-especiales` | draft |

**Testing**: Crear catálogo #11 y verificar mensaje de límite alcanzado

---

## 🔍 Datos Técnicos

### Catálogos Creados (SQL)
```sql
INSERT INTO catalogs (org_id, slug, name, description, status, language, currency, order_channel, contact_phone, contact_email)
VALUES (org_id, slug, name, description, status, language, currency, order_channel, phone, email);
```

### Tabla Catalogs Schema
- **id**: UUID (auto-generado)
- **org_id**: UUID (FK → organizations)
- **slug**: VARCHAR(64) - Identificador único por organización
- **name**: TEXT - Nombre del catálogo
- **description**: TEXT - Descripción
- **status**: ENUM (draft, published) - Por defecto: draft
- **language**: VARCHAR(10) - Por defecto: 'es'
- **currency**: VARCHAR(8) - Por defecto: 'COP'
- **order_channel**: ENUM (whatsapp, telegram, etc.) - Por defecto: 'whatsapp'
- **contact_phone**: TEXT - Teléfono de contacto
- **contact_email**: TEXT - Email de contacto
- **theme_json**: JSONB - Configuración de tema
- **settings_json**: JSONB - Configuración adicional
- **created_at**: TIMESTAMP - Auto-generada
- **updated_at**: TIMESTAMP - Auto-generada

---

## ✅ Casos de Test Realizables

### Test 1: Login y Verificación de Catálogos
**Usuario**: carlos.garcia@test.com (GRATIS)
**Pasos**:
1. Login con credenciales de QUICK_START.md
2. Navegar a `/app/catalogs`
3. Verificar que se muestra 1 catálogo
4. Verificar datos del catálogo (nombre, slug, estado)

**Resultado Esperado**: ✅ Se muestra el catálogo "Tienda Principal de Carlos"

---

### Test 2: Límite de Catálogos en Plan Gratis
**Usuario**: carlos.garcia@test.com (GRATIS)
**Pasos**:
1. Login
2. Ir a `/app/catalogs`
3. Intentar crear nuevo catálogo (botón "Nuevo Catálogo")
4. Rellenar formulario
5. Click "Guardar"

**Resultado Esperado**: ❌ Error: "Límite de 1 catálogo alcanzado en tu plan"

---

### Test 3: Catálogos Plan Pro
**Usuario**: maria.lopez@test.com (PRO)
**Pasos**:
1. Login
2. Ir a `/app/catalogs`
3. Verificar que se muestran 3 catálogos
4. Intentar crear catálogo #4

**Resultado Esperado**: ✅ Muestra 3 catálogos, bloquea #4

---

### Test 4: Catálogos Plan Premium
**Usuario**: juan.rodriguez@test.com (PREMIUM)
**Pasos**:
1. Login
2. Ir a `/app/catalogs`
3. Verificar que se muestran 10 catálogos
4. Intentar crear catálogo #11

**Resultado Esperado**: ✅ Muestra 10 catálogos, bloquea #11

---

## 🛠️ Cambios Necesarios en App

### API Endpoint: GET /api/catalogs
**Verifica**:
- ✅ Query filtra por org_id del usuario actual
- ✅ Respeta paginación (limit 50)
- ✅ Retorna fields: id, slug, name, status, created_at, contact_email

### API Endpoint: POST /api/catalogs
**Validaciones Requeridas**:
1. ✅ Usuario debe estar autenticado
2. ❌ **FALTA**: Verificar límite de catálogos según plan
3. ✅ Slug debe ser único dentro de la organización
4. ❌ **FALTA**: Validar datos de contacto (email, phone)

### Componente: CatalogsPage
**Cambios Necesarios**:
1. ❌ **FALTA**: Mostrar límite actual vs. máximo
2. ❌ **FALTA**: Deshabilitar botón "Nuevo" cuando se alcanza límite
3. ✅ Mostrar lista de catálogos

---

## 📋 Próximos Pasos

### QA Testing (Usuario como QA)
```
1. [ ] Ejecutar Test 1: Login y verificación
2. [ ] Ejecutar Test 2: Límite Gratis
3. [ ] Ejecutar Test 3: Límite Pro
4. [ ] Ejecutar Test 4: Límite Premium
5. [ ] Documentar resultados en QA_CATALOGS_LIMIT_TESTING.md
```

### Desarrollo (Usuario como Desarrollador)
```
1. [ ] Implementar validación de límites en POST /api/catalogs
2. [ ] Actualizar CatalogsPage para mostrar límite/contador
3. [ ] Deshabilitar botón cuando se alcanza límite
4. [ ] Agregar validación de contacto_email y contact_phone
5. [ ] Crear test unitario para límites de plan
6. [ ] Testing E2E con Playwright
```

---

## 📚 Referencias

- **Usuario Credentials**: [QUICK_START.md](./QUICK_START.md)
- **Plan Details**: [USUARIOS_Y_PLANES_FINAL.md](./USUARIOS_Y_PLANES_FINAL.md)
- **Previous QA Reports**: [INDEX.md](./INDEX.md)

---

**Creado por**: QA + Dev Flow  
**Fecha**: 2026-05-14  
**Status**: 📋 Catálogos Listos para Testing
