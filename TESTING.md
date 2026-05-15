# Testing con Playwright - Google Auth

## Configuración

### 1. Prerequisitos
- Tener la aplicación corriendo en `http://localhost:3000`
- Credenciales de una cuenta Google de prueba

### 2. Configurar variables de entorno

Copia las credenciales en `.env.test`:

```bash
cp .env.test .env.test.local
```

Edita `.env.test.local` y rellena:
```env
GOOGLE_TEST_EMAIL=tu_email@gmail.com
GOOGLE_TEST_PASSWORD=tu_password
```

## Ejecutar Pruebas

### Opción 1: Prueba básica (sin credenciales)
```bash
# Prueba que el botón de Google existe
npm run test:auth
```

### Opción 2: Prueba completa (requiere credenciales)
```bash
# Carga variables de entorno y ejecuta tests
export GOOGLE_TEST_EMAIL="tu_email@gmail.com"
export GOOGLE_TEST_PASSWORD="tu_password"
npm run test:auth
```

### Opción 3: Modo interactivo
```bash
npm run test:ui
```

### Opción 4: Modo debug
```bash
npm run test:debug
```

## Plan de Pruebas

### Test 1: Navegación a login
✓ Verifica que la página de login carga correctamente
✓ Verifica que el botón de Google Auth está visible

### Test 2: Iniciar flujo OAuth
✓ Hace clic en el botón de Google
✓ Verifica que se abre popup de Google
✓ Confirma que se navega a `accounts.google.com`

### Test 3: Login completo (requiere credenciales)
✓ Completa el flujo de autenticación
✓ Ingresa email de Google
✓ Ingresa contraseña
✓ Maneja autenticación de 2FA (si aplica)
✓ Verifica que se redirige a `/app`

### Test 4: Verificación post-login
✓ Confirma que el usuario está autenticado
✓ Verifica que el dashboard es accesible

## Notas Importantes

⚠️ **Credenciales de prueba:**
- Usa una cuenta Google de prueba dedicada (no tu cuenta personal)
- Puedes crear una en https://accounts.google.com/

⚠️ **2FA:**
- Si tu cuenta tiene 2FA habilitado, el test lo detectará y se saltará
- Para pruebas automatizadas, desactiva 2FA en la cuenta de prueba

⚠️ **Seguridad:**
- Nunca commits `.env.test.local` con credenciales reales
- Agrega a `.gitignore` si no está

## Resultados

Los reportes de pruebas se guardan en:
```
playwright-report/index.html
```

Abre en navegador para ver detalles de cada test.

## Troubleshooting

**Problema: "Usuario no autenticado"**
- Verifica que las credenciales sean correctas
- Asegúrate que la cuenta no tiene 2FA
- Intenta login manual en la app primero

**Problema: Timeout en Google popup**
- Google puede ser más lento en algunos momentos
- Aumenta timeouts en `playwright.config.ts`

**Problema: "Element not found"**
- Los selectores pueden variar según cambios en el UI
- Usa `test:debug` para inspeccionar elementos
