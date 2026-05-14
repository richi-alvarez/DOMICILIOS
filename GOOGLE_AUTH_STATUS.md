# Estado del Google OAuth - Registro de Usuario

## ✅ Completado

1. **Flujo OAuth Funcional**
   - ✓ Test de Google OAuth completó exitosamente 
   - ✓ La autenticación con Google está configurada correctamente
   - ✓ Email: ric.slda.94@gmail.com se puede autenticar

2. **Configuración de NextAuth**
   - ✓ Google OAuth provider configurado en auth.ts
   - ✓ DrizzleAdapter agregado para crear usuarios en BD

3. **Base de Datos**
   - ✓ PostgreSQL 16 con pgvector configurado
   - ✓ Tabla `users` creada con campos: id, email, name, image, email_verified, password_hash, locale, created_at, updated_at
   - ✓ Tabla `accounts` creada para almacenar credenciales OAuth

4. **Driver de BD Actualizado**
   - ✓ Cambiado de `@neondatabase/serverless` a `pg` (node-postgres)
   - ✓ db/index.ts ahora usa Pool de node-postgres en lugar de Neon HTTP

## 🔄 En Progreso

- Contenedores Docker con puertos conflictivos (puertos 5432, 3000 ocupados)
- Configuración de puertos en docker-compose.yml ajustada a 5434 y 3000

## 📝 Cambios Realizados

### auth.ts
- Agregado `import { DrizzleAdapter } from '@auth/drizzle-adapter'`
- Agregado adaptador: `adapter: DrizzleAdapter(db),`
- El adaptador automáticamente crea usuarios en tabla `users` cuando se autentican con OAuth

### db/index.ts
- Reemplazado: `import { neon } from '@neondatabase/serverless'`
- Con: `import { Pool } from 'pg'`
- Reemplazado: `import { drizzle } from 'drizzle-orm/neon-http'`
- Con: `import { drizzle } from 'drizzle-orm/node-postgres'`
- Ahora usa `new Pool()` con `connectionString` en lugar de Neon HTTP

### package.json
- Agregado: `"pg": "^8.x"`

### docker-compose.yml
- Puerto PostgreSQL: `5434:5432` (interno 5432, externo 5434)
- Puerto App: `3000:3000` (interno 3000, externo 3000)
- Puerto pgAdmin: `5050:80`

## 🧪 Tests Creados

1. `tests/google-signup.spec.ts` - Test interactivo de signup con Google
2. `tests/google-login-interactive.spec.ts` - Test interactivo de login con Google
3. `verify-and-cleanup.sh` - Script para verificar BD y limpiar datos

## 📊 Próximos Pasos

1. Resolver conflictos de puertos
2. Ejecutar test de signup completo
3. Verificar que usuario se cree en tabla `users` con:
   - email
   - name (del perfil de Google)
   - image (foto de Google)
   - email_verified (timestamp)
4. Verificar que entrada se cree en tabla `accounts` con:
   - provider: 'google'
   - provider_account_id: ID de Google
   - access_token
   - id_token

## 🚀 Para Ejecutar los Tests

```bash
# Asegurar que los contenedores estén corriendo
docker-compose up -d

# Ejecutar test de signup con Google
PLAYWRIGHT_HEADLESS=false PLAYWRIGHT_TIMEOUT=300000 \
npx playwright test tests/google-signup.spec.ts --headed --project=chromium

# Verificar los datos en la BD
bash verify-and-cleanup.sh

# Acceder a la app
http://localhost:3000  # (o el puerto configurado)
```

## 🔧 Configuración de Puertos

| Servicio   | Puerto Interno | Puerto Externo | URL              |
|-----------|----------------|----------------|------------------|
| PostgreSQL | 5432          | 5434           | localhost:5434   |
| Next.js    | 3000          | 3000           | localhost:3000   |
| pgAdmin    | 80            | 5050           | localhost:5050   |

## 📌 Notas Importantes

- El DrizzleAdapter de NextAuth maneja automáticamente la creación de usuarios
- Los eventos `createUser` y callbacks JWT ahora son redundantes pero se mantienen por compatibilidad
- La BD está en una red Docker interna, accesible solo desde otros contenedores (excepto por los puertos mapeados)
