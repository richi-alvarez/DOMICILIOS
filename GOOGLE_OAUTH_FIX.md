# Google OAuth - Diagnóstico y Solución

## Error Detectado

```
CallbackRouteError: OperationProcessingError: response parameter "iss" (issuer) missing
```

Esto ocurre cuando Google no devuelve el parámetro `iss` en la respuesta OpenID Connect.

## Causas Probables

1. **Credenciales expiradas o inválidas** - Los valores en `.env.local` pueden estar vencidos
2. **Redirect URI no coincide** - Google solo acepta redirects a URLs registradas
3. **Cliente OAuth no está configurado como web app** - Necesita ser tipo "Web application"

## Verificación en Google Cloud Console

### 1. Acceder a Google Cloud Console
```
https://console.cloud.google.com
- Proyecto: Domicilios (o tu proyecto actual)
- APIs & Services > Credentials
```

### 2. Verificar credenciales OAuth

Busca el Cliente OAuth con Client ID: `1038474471943-64n4tpt6a0pn2sctt6oq971qqs96aubv`

**Verificar:**
- ✓ Type: "Web application"
- ✓ Authorized redirect URIs contiene EXACTAMENTE:
  - `https://schemes-friday-confidential-she.trycloudflare.com/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google`
  - `http://localhost:3001/api/auth/callback/google`

### 3. Si falta el localhost
Edita el cliente OAuth y agrega:
```
http://localhost:3000/api/auth/callback/google
```

### 4. Obtener nuevas credenciales si está vencido

Si todo parece correcto pero sigue sin funcionar:

1. Crea nuevas credenciales OAuth:
   - Tipo: "Web application"
   - Name: "Domicilios Dev"
   - Authorized JavaScript origins: `http://localhost:3000`, `http://localhost:3001`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`

2. Copia el nuevo Client ID y Secret

3. Actualiza `.env.local`:
   ```
   AUTH_GOOGLE_ID=nuevo-client-id.apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=nuevo-client-secret
   ```

4. Reinicia Docker:
   ```bash
   docker-compose restart app
   ```

## Testing Workflow

Una vez verificado/actualizado:

```bash
# 1. Ver logs en tiempo real
docker logs -f domicilios-app | grep -E "(Auth|OAuth|error|Error)"

# 2. En navegador real (NO Playwright):
# http://localhost:3000/login
# Clic en "Continuar con Google"
# Completa el login en Google
# Verifica en logs que se ejecute:
#   - SignIn Callback
#   - JWT Callback
#   - Session Callback

# 3. Si funciona, deberías ver:
# ✅ Token updated with user ID
# ✅ Session ID set from token
# ✨ Default organization created successfully
```

## Logs a Monitorear

### ✅ Flujo correcto:
```
👤 SignIn Callback Triggered
🔐 Google OAuth Details: [tokens received]
🔑 JWT Callback [token created]
✅ Token updated with user ID
📊 Creating default organization
✨ Default organization created successfully
📱 Session Callback
✅ Session ID set from token
```

### ❌ Flujo con error:
```
[auth][error] CallbackRouteError
[auth][cause] OperationProcessingError: response parameter "iss" missing
```

## Alternativa: Debug Directo

Para ver exactamente qué responde Google:

```bash
# 1. Agregar logging en auth.ts:
logger.info('Google account response:', { account, profile })

# 2. Reiniciar Docker
docker-compose restart app

# 3. Intentar login y revisar logs
docker logs domicilios-app 2>&1 | grep -A20 "Google account"
```

---

**Estado:** 🔴 En diagnóstico  
**Acción requerida:** Verificar Google Cloud Console  
**Próximo paso:** Actualizar credenciales si es necesario
