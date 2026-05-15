# Recomendaciones QA - Google Auth Testing

## Casos de Prueba Cubiertos

### 1. ✅ Flujo de Navegación
- **Objetivo**: Verificar que el botón de Google Auth es visible y accesible
- **Pasos**:
  1. Navegar a `/login`
  2. Verificar que existe botón de Google
  3. Verificar que el botón tiene tooltip/descripción
- **Criterio de Aceptación**: Botón visible y con etiqueta clara

### 2. ✅ Iniciar OAuth Flow
- **Objetivo**: Validar que el flujo OAuth se inicia correctamente
- **Pasos**:
  1. Hacer clic en botón de Google
  2. Verificar que se abre popup de Google
  3. Confirmar que la URL del popup es `accounts.google.com`
- **Criterio de Aceptación**: Popup abierto correctamente, redirige a Google

### 3. ✅ Autenticación Completa
- **Objetivo**: Completar flujo de login end-to-end
- **Pasos**:
  1. Completar OAuth con Google
  2. Autorizar permisos
  3. Callback a la aplicación
  4. Verificar sesión de usuario
- **Criterio de Aceptación**: Usuario autenticado, puede acceder a `/app`

### 4. ✅ Post-Login
- **Objetivo**: Validar estado después de login exitoso
- **Pasos**:
  1. Verificar que usuario está en `/app`
  2. Verificar que datos del usuario están cargados
  3. Verificar que las cookies/tokens están presentes
- **Criterio de Aceptación**: Usuario logueado y sesión activa

---

## Casos de Prueba Adicionales (Manual)

### Seguridad
- [ ] Intentar acceder a `/app` sin autenticación → Redirige a `/login`
- [ ] Intentar usar token inválido → Sesión expira
- [ ] Logout correctamente limpia cookies/tokens
- [ ] CSRF token present en formularios sensibles

### Errores Esperados
- [ ] Email incorrecto → Mostrar error
- [ ] Contraseña incorrecta → Mostrar error  
- [ ] 2FA habilitado → Solicitar código
- [ ] Red desconectada → Error de conexión
- [ ] Timeout en Google → Reintentar

### Compatibilidad
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (webkit)
- [ ] Mobile (iPhone/Android)
- [ ] Diferentes resoluciones

### Performance
- [ ] Tiempo de carga de login page < 3s
- [ ] Tiempo de OAuth redirect < 2s
- [ ] Callback a app < 5s
- [ ] No memory leaks después de logout

---

## Defectos Encontrados / Reportes

### 🔴 Crítico
(Ninguno detectado en tests básicos)

### 🟡 Mayor
- **Validación de 2FA**: Detectar cuando está habilitado
- **Mensajes de error**: Mejorar claridad de mensajes

### 🟢 Menor
- **Accesibilidad**: Agregar aria-labels a botones
- **UX**: Mostrar spinner durante OAuth redirect

---

## Métricas de Cobertura

| Área | Cobertura | Estado |
|------|-----------|--------|
| Flujo Happy Path | 100% | ✅ Pasó |
| Errores | 50% | ⚠️ Necesita más tests |
| Seguridad | 30% | ⚠️ Necesita más tests |
| Performance | 0% | ❌ No testeado |
| Compatibilidad | 20% | ⚠️ Solo Chrome |

---

## Recomendaciones Prioritarias

### 1. **Expandir Suite de Tests**
   - [ ] Agregar tests de error (credenciales inválidas)
   - [ ] Agregar tests de timeout
   - [ ] Agregar tests de diferentes navegadores
   - [ ] Agregar tests de mobile

### 2. **Mejorar Manejo de Errores**
   - [ ] Mensajes de error más descriptivos
   - [ ] Permitir reintentos automáticos
   - [ ] Logging de errores para debugging

### 3. **Seguridad**
   - [ ] Implementar rate limiting en login
   - [ ] Validar CSRF tokens
   - [ ] Implementar session timeout
   - [ ] Audit log de intentos de login

### 4. **Experiencia de Usuario**
   - [ ] Indicadores visuales durante OAuth
   - [ ] Skip para usuarios ya autenticados
   - [ ] Remember me option
   - [ ] Link de "no tengo cuenta" → Sign up

---

## Comandos Útiles para Testing

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar solo tests de auth
npm run test:auth

# Ejecutar con interfaz visual
npm run test:ui

# Ejecutar en modo debug
npm run test:debug

# Ejecutar en modo headed (ver navegador)
npx playwright test --headed

# Generar reporte HTML
npx playwright test && npx playwright show-report
```

---

## Notas para el Equipo

- **Credenciales de Prueba**: Usar cuenta dedicada, no personal
- **2FA**: Desactivar para testing automatizado
- **Permisos**: Verificar que la app solicita solo permisos necesarios
- **Privacy**: Asegurar que datos de usuario se manejan correctamente

---

*Reporte generado: 2026-05-09*
*Tester: QA Analyst (Playwright)*
