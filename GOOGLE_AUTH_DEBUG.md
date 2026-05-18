# Google OAuth Login Debug Guide

Se han agregado logs detallados en los siguientes lugares para debuguear por qué el login con Google no completa:

## 📝 Logs Agregados

### 1. `/auth.ts` - Callbacks y Events

**SignIn Callback** (`signIn`)
```
Logs:
- 👤 SignIn Callback Triggered: Cuando Google redirige con el usuario
- 🔐 Google OAuth Details: Tokens, scope, tipo de token
```

**JWT Callback** (`jwt`)
```
Logs:
- 🔑 JWT Callback: Cuando se crea el JWT
- ✅ Token updated with user ID: Si se agrega exitosamente
- 📊 Creating default organization: Cuando se crea org por defecto
- ✨ Default organization created successfully: Confirmación
- ❌ Failed to create default organization: Si hay error
```

**Session Callback** (`session`)
```
Logs:
- 📱 Session Callback: Cuando se crea la sesión
- ✅ Session ID set from token: Si se asigna ID correctamente
- ⚠️ Session token missing user ID: Si falta ID en token
```

**CreateUser Event** (`createUser`)
```
Logs:
- 👤 New User Created Event: Cuando se registra nuevo usuario
- 📊 Creating default organization for new user: Org creation
- ✨ Default organization created for new user: Success
- ❌ Failed to create organization for new user: Error
```

### 2. `middleware.ts` - Request Logging

```
Logs:
- 🔐 Auth Request in Middleware: Toda solicitud a /auth, /login, /signup
- Incluye: código, estado, errores, tokens
```

## 🚀 Cómo Ver Los Logs

### Opción 1: En la Terminal (Dev Server)
```bash
# Inicia el servidor con logs
npm run dev

# Los logs aparecerán en la terminal donde ejecutes este comando
# Busca líneas con: 👤 🔐 🔑 📱 📊 ✅ ❌ ⚠️ ✨
```

### Opción 2: En Producción (Cloudflare Tunnel)
```bash
# Los logs se escriben en los handlers del logger
# Revisa la salida de tu servidor Next.js cuando se ejecuta a través de Cloudflare Tunnel
```

### Opción 3: Archivo de Logs (si está configurado)
- El logger puede estar configurado para escribir en archivos
- Revisa: `/lib/monitoring/logger.ts`

## 📊 Flujo Esperado de Logs al Hacer Login

### Flujo Normal (Sin Errores)

1. **Usuario hace clic en "Continuar con Google"**
   ```
   🔐 Auth Request in Middleware: GET /api/auth/signin/google
   ```

2. **Google redirige con código de autorización**
   ```
   🔐 Auth Request in Middleware: GET /api/auth/callback/google?code=...&state=...
   ```

3. **NextAuth valida el código**
   ```
   👤 SignIn Callback Triggered
   🔐 Google OAuth Details: [tokens, scope]
   ```

4. **Se crea el JWT**
   ```
   🔑 JWT Callback
   ✅ Token updated with user ID
   ```

5. **Si es nuevo usuario, se crea organización**
   ```
   📊 Creating default organization for new user
   ✨ Default organization created for new user
   ```
   O si ya existe:
   ```
   ℹ️ Organization already exists
   ```

6. **Se crea la sesión**
   ```
   📱 Session Callback
   ✅ Session ID set from token
   ```

### Flujo con Error (Google Rechaza)

```
🔐 Auth Request in Middleware: 
  error: 'access_denied'
  errorDescription: 'Unsupported access type...'
```

## 🔍 Qué Buscar en Los Logs

### Señales de Éxito ✅
- ✅ Token updated with user ID
- ✅ Session ID set from token
- ✨ Default organization created

### Señales de Error ❌
- ❌ Failed to create default organization
- ⚠️ Session token missing user ID
- error: 'access_denied' (Google rechaza)
- error: 'invalid_request' (Parámetro inválido)

## 🛠️ Archivos Modificados

1. `/auth.ts` - Callbacks y events con logs
2. `/middleware.ts` - Request logging para endpoints de auth

## 📋 Pasos Para Debuguear

1. **Inicia el servidor dev:**
   ```bash
   npm run dev
   ```

2. **Abre la URL de Cloudflare:**
   ```
   https://energy-dominant-bush-you.trycloudflare.com/login
   ```

3. **Haz clic en "Continuar con Google"**

4. **Busca en los logs de la terminal:**
   - Si ve `👤 SignIn Callback Triggered` → Callback se ejecutó
   - Si ve `❌ Failed` → Hubo un error en createDefaultOrg
   - Si ve `error:` → Google rechazó el login

5. **Analiza el error específico** basado en el log

## 💡 Posibles Errores y Soluciones

### "Browser not secure"
- Google bloqueó navegador automatizado
- **Solución:** Usar navegador real (Chrome, Firefox, Safari)

### "access_denied"
- Usuario canceló el consentimiento
- Redirect URI no está registrado en Google Console
- **Solución:** Verifica Google Cloud Console → Credenciales

### "Organization creation failed"
- Base de datos no disponible
- Usuario ya existe con otro email
- **Solución:** Revisa logs de error específico

### "Session token missing user ID"
- JWT callback no asignó ID al token
- Provider no pasó user ID
- **Solución:** Revisa JWT callback logs

## 🔐 Datos Redactados en Logs

Los siguientes datos se muestran como `***REDACTED***` por seguridad:
- `code` (Authorization Code)
- `state` (CSRF Token)
- `access_token`
- `refresh_token`

## 📞 Próximos Pasos

Una vez que identifiques el error en los logs:

1. **Documenta el mensaje de error exacto**
2. **Comparte la línea de log con el error**
3. **Implementa la solución basada en el error**
4. **Verifica en los logs que se resolvió**

---

**Actualizado:** 2026-05-18
**Versión:** 1.0
