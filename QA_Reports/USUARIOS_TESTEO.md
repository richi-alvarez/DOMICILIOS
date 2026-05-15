# 👥 Listado de Usuarios de Prueba - QA Testing 2026-05-15

**Total de Usuarios Creados**: 4  
**Base de Datos**: PostgreSQL (domicilios)  
**Contraseña Común**: `Test@12345`  
**Estado**: ✅ Creados en BD | ⏹️ Autenticación en corrección

---

## 📊 Tabla de Usuarios

| # | Nombre | Email | Contraseña | Plan | Estado | UUID |
|---|--------|-------|-----------|------|--------|------|
| 1 | Carlos García | `carlos.garcia@test.com` | `Test@12345` | **Gratis** | ✅ Activo | `a971462d-3364-49fd-946c-253f38e38f49` |
| 2 | María López | `maria.lopez@test.com` | `Test@12345` | **Pro** | ✅ Activo | `f9ed9d5d-760f-4f62-9ba2-c0e6d03759ec` |
| 3 | Juan Rodríguez | `juan.rodriguez@test.com` | `Test@12345` | **Premium** | ✅ Activo | `1a96d908-e389-45d8-86c4-94c303e23fc9` |
| 4 | Ana Martínez | `ana.martinez@test.com` | `Test@12345` | **Gratis** | ✅ Activo | `751df6f4-e163-4b84-9d65-d7afc89a334c` |

---

## 🔐 Datos de Acceso

### Hash de Contraseña Bcrypt (para todos)
```
$2b$12$52645Zknw6WiSvOhoZCtOuf.Kyhs4tj8xNGFHggZc294.Ru6rQz0q
```
> Generado de: `Test@12345`

### URL de Acceso
- **Login**: http://localhost:3001/login
- **Signup**: http://localhost:3001/signup
- **App**: http://localhost:3001

---

## 💳 Descripción por Plan

### Usuario 1 & 4: Plan Gratis 🟢
- **Límites Esperados**:
  - 1 catálogo
  - Hasta 50 productos
  - Soporte por email
  - Sin dominio personalizado
  
### Usuario 2: Plan Pro 🔵  
- **Límites Esperados**:
  - 5 catálogos
  - Hasta 500 productos
  - Soporte prioritario
  - 1 dominio personalizado
  - Análisis avanzado

### Usuario 3: Plan Premium 🟣
- **Límites Esperados**:
  - Catálogos ilimitados
  - Productos ilimitados
  - Soporte VIP 24/7
  - Dominios personalizados ilimitados
  - API access
  - Análisis completo

---

## ✅ Checklist de Verificación

- [x] Usuarios creados en base de datos
- [x] Emails verificados
- [x] Contraseñas hasheadas correctamente
- [x] PostgreSQL corriendo en puerto 5432
- [x] Migraciones aplicadas
- [x] Next.js corriendo en puerto 3001
- [ ] Login funcional (en progreso)
- [ ] Logout funcional (pendiente)
- [ ] Re-login después de logout (pendiente)
- [ ] Creación de catálogos (pendiente)
- [ ] Validación de límites por plan (pendiente)

---

## 🔧 Comandos Útiles

### Conectar a PostgreSQL
```bash
PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d domicilios
```

### Ver todos los usuarios
```sql
SELECT id, name, email, email_verified, created_at FROM users ORDER BY created_at;
```

### Verificar hash de contraseña
```sql
SELECT email, password_hash FROM users WHERE email = 'carlos.garcia@test.com';
```

### Reiniciar servidor Next.js
```bash
npm run dev
```

---

## 📝 Notas

- Todos los usuarios tienen `email_verified` activado
- Las contraseñas están hasheadas con bcrypt (12 rounds)
- Los usuarios están listos para testing de flujos completos
- Próxima fase: Corregir endpoint de autenticación para permitir login

---

**Fecha de Creación**: 2026-05-15 19:38 UTC  
**Ambiente**: Localhost (Puerto 3001)  
**Base de Datos**: PostgreSQL 16 on Docker
