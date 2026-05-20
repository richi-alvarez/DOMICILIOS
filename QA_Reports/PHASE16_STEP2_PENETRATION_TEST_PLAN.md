# 🎯 Phase 16 — PASO 2: Penetration Testing Plan

**Fecha**: 2026-05-19  
**Fase**: 16 — Security Audit & Compliance  
**PASO**: 2 (Día 2-3)  
**Status**: 🚀 INICIANDO

---

## 📋 Descripción General

Penetration Testing simulará ataques realistas contra los endpoints de la API y funcionalidad de autenticación para verificar que los controles de seguridad funcionan como se esperado.

---

## 🎯 Objetivos

1. ✅ Verificar que endpoints requieren autenticación
2. ✅ Verificar que usuarios no pueden acceder datos de otras organizaciones
3. ✅ Verificar que rate limiting funciona correctamente
4. ✅ Verificar que input validation rechaza datos maliciosos
5. ✅ Verificar que error messages no filtran información sensible
6. ✅ Verificar que JWT tokens no pueden ser alterados
7. ✅ Verificar que HTTPS/TLS está configurado correctamente
8. ✅ Verificar que cookies tienen flags de seguridad

---

## 🔧 Herramientas a Usar

- **curl** - Testing de endpoints HTTP
- **Playwright** - Testing de autenticación y flujos de usuario
- **Node.js** - Scripts personalizados de testing
- **jq** - Parsing de JSON responses

---

## 📊 Test Matrix

### 2.1 API Endpoint Security Testing

**Objetivo**: Verificar que endpoints están protegidos

#### Endpoints a Probar

```
POST   /api/v1/orders              (crear orden)
GET    /api/v1/catalogs/[slug]/products
GET    /api/reports                 (ver reportes)
PATCH  /api/reports/[id]            (modificar reporte)
DELETE /api/reports/[id]            (eliminar reporte)
POST   /api/cron/report-delivery    (cron - requiere secret)
GET    /api/analytics/overview      (dashboard analytics)
```

#### Test Cases

| # | Escenario | Método | Esperado | Status |
|---|---|---|---|---|
| 2.1.1 | Access endpoint sin auth | GET /api/reports | 401 Unauthorized | ⏳ |
| 2.1.2 | Access endpoint con token inválido | GET /api/reports | 401 Unauthorized | ⏳ |
| 2.1.3 | Access endpoint con token expirado | GET /api/reports | 401 Unauthorized | ⏳ |
| 2.1.4 | Access endpoint con auth válida | GET /api/reports | 200 OK + data | ⏳ |
| 2.1.5 | Acceso cross-org (User A → Org B data) | GET /api/reports | 403 Forbidden | ⏳ |
| 2.1.6 | Delete con valid auth | DELETE /api/reports/[id] | 200 OK o 204 | ⏳ |
| 2.1.7 | Update con valid auth | PATCH /api/reports/[id] | 200 OK | ⏳ |
| 2.1.8 | POST order sin auth | POST /api/v1/orders | 401 Unauthorized | ⏳ |

---

### 2.2 Authentication Bypass Attempts

**Objetivo**: Verificar que JWT no puede ser comprometido

#### Test Cases

| # | Escenario | Método | Esperado | Status |
|---|---|---|---|---|
| 2.2.1 | Tamper JWT payload | Modify token, change user_id | 401 Unauthorized | ⏳ |
| 2.2.2 | Tamper JWT signature | Change signature | 401 Unauthorized | ⏳ |
| 2.2.3 | Use expired token | Send old token | 401 Unauthorized | ⏳ |
| 2.2.4 | Token missing from cookies | Send request | 401 Unauthorized | ⏳ |
| 2.2.5 | Cookie with wrong format | Inject malformed cookie | 401 Unauthorized | ⏳ |
| 2.2.6 | Replay expired token | Use old valid token | 401 Unauthorized | ⏳ |
| 2.2.7 | CSRF attack simulation | POST without session | 401 Unauthorized | ⏳ |
| 2.2.8 | Session fixation attempt | Use known token | 401 Unauthorized | ⏳ |

---

### 2.3 Authorization Level Verification

**Objetivo**: Verificar que users solo acceden su propia data

#### Test Cases

| # | Escenario | Método | Esperado | Status |
|---|---|---|---|---|
| 2.3.1 | Free user accede Pro feature | GET /api/reports/advanced | 403 Forbidden | ⏳ |
| 2.3.2 | User A accede Org B data | GET /api/reports?org=B | 403 Forbidden | ⏳ |
| 2.3.3 | User A modifica User B's report | PATCH /api/reports/B's-report-id | 403 Forbidden | ⏳ |
| 2.3.4 | User A elimina User B's report | DELETE /api/reports/B's-report-id | 403 Forbidden | ⏳ |
| 2.3.5 | Free user crea más de N catalogs | POST /api/catalogs (3rd) | 400 Limit Reached | ⏳ |
| 2.3.6 | Valid user accede su propia data | GET /api/reports (own) | 200 OK | ⏳ |
| 2.3.7 | Valid user modifica su reporte | PATCH /api/reports/[own-id] | 200 OK | ⏳ |
| 2.3.8 | Admin panel sin permisos | GET /api/admin/users | 403 Forbidden | ⏳ |

---

### 2.4 Data Integrity Checks

**Objetivo**: Verificar que data maliciosa es rechazada

#### Test Cases

| # | Escenario | Payload | Esperado | Status |
|---|---|---|---|---|
| 2.4.1 | Create order con precio negativo | price: -100 | 400 Bad Request | ⏳ |
| 2.4.2 | Create report con fechas inválidas | startDate > endDate | 400 Bad Request | ⏳ |
| 2.4.3 | Update product con description XSS | desc: `<script>alert()</script>` | 400 Bad Request | ⏳ |
| 2.4.4 | Crear catalog con nombre NULL | name: null | 400 Bad Request | ⏳ |
| 2.4.5 | Update con tipo de dato incorrecto | quantity: "string" | 400 Bad Request | ⏳ |
| 2.4.6 | Create con string 10MB | name: "A"*10000000 | 413 Payload Too Large | ⏳ |
| 2.4.7 | Create con caracteres unicode válidos | name: "Café" | 200 OK | ⏳ |
| 2.4.8 | Update con JSON injection | json: "{\"injected\": true}" | Validado | ⏳ |

---

### 2.5 Rate Limiting Effectiveness

**Objetivo**: Verificar que rate limiting previene abuso

#### Test Cases

| # | Escenario | Límite | Acción | Esperado | Status |
|---|---|---|---|---|---|
| 2.5.1 | API tier rate limit | 100/min | 101 requests en 60s | 429 Too Many | ⏳ |
| 2.5.2 | Sensitive tier rate limit | 3/min | 4 requests en 60s | 429 Too Many | ⏳ |
| 2.5.3 | Retry-After header | Rate limited | Check header | Tiene valor | ⏳ |
| 2.5.4 | Rate limit reset | Esperar 60s | Nuevo request | 200 OK | ⏳ |
| 2.5.5 | Rate limit por IP | Diferentes IPs | Cada IP tiene límite | 429 después de 100 | ⏳ |
| 2.5.6 | Bypass con header X-Forwarded-For | Cambiar XFF | Debería detectar | Sigue limitado | ⏳ |

---

### 2.6 Input Validation Testing

**Objetivo**: Verificar que todos los inputs se validan

#### Test Cases

| # | Escenario | Input | Esperado | Status |
|---|---|---|---|---|
| 2.6.1 | SQL Injection en search | name: "'; DROP TABLE--" | 400 Bad Request | ⏳ |
| 2.6.2 | XSS en título | title: "<img src=x onerror=alert()>" | 400 Bad Request | ⏳ |
| 2.6.3 | Very long string | name: "A"*10000 | 400 Bad Request | ⏳ |
| 2.6.4 | Invalid UTF-8 | Bytes inválidos | 400 Bad Request | ⏳ |
| 2.6.5 | Null bytes | "test\0payload" | 400 Bad Request | ⏳ |
| 2.6.6 | Double encoding | "%252e%252e/" | 400 Bad Request | ⏳ |
| 2.6.7 | Valid email | "user@example.com" | 200 OK | ⏳ |
| 2.6.8 | Invalid email | "not-an-email" | 400 Bad Request | ⏳ |

---

### 2.7 Error Message Leakage Check

**Objetivo**: Verificar que error messages no filtran info sensible

#### Test Cases

| # | Escenario | Acción | Esperado | Status |
|---|---|---|---|---|
| 2.7.1 | 404 en endpoint inexistente | GET /api/nonexistent | No stack trace | ⏳ |
| 2.7.2 | 500 error | Trigger error | No database schema | ⏳ |
| 2.7.3 | 401 invalid auth | Bad credentials | No user info leak | ⏳ |
| 2.7.4 | 403 access denied | Wrong org | No org info leak | ⏳ |
| 2.7.5 | SQL error en prod | Bad query | No SQL visible | ⏳ |
| 2.7.6 | File not found | GET old endpoint | No directory listing | ⏳ |
| 2.7.7 | Validation error | Bad input | Generic message | ⏳ |
| 2.7.8 | 429 rate limited | Rate limit hit | No IP exposed | ⏳ |

---

### 2.8 Session Security

**Objetivo**: Verificar que sessions no pueden ser hijacked

#### Test Cases

| # | Escenario | Método | Esperado | Status |
|---|---|---|---|---|
| 2.8.1 | Session timeout | Esperar 24h | Require re-login | ⏳ |
| 2.8.2 | Session prediction | Adivinar token | Fail (random) | ⏳ |
| 2.8.3 | Session fixation | Inject known session | Fail (secure) | ⏳ |
| 2.8.4 | Cookie httpOnly | Access document.cookie | undefined | ⏳ |
| 2.8.5 | Cookie Secure flag | Over HTTP | Not sent | ⏳ |
| 2.8.6 | Cookie SameSite | Cross-site POST | Not sent | ⏳ |
| 2.8.7 | Logout clears session | POST /logout | Token invalided | ⏳ |
| 2.8.8 | Concurrent sessions | Login twice | Both valid (OK) | ⏳ |

---

### 2.9 HTTPS/TLS Configuration

**Objetivo**: Verificar que HTTPS está bien configurado

#### Test Cases

| # | Escenario | Check | Esperado | Status |
|---|---|---|---|---|
| 2.9.1 | HSTS header presente | curl -i | Tiene HSTS | ⏳ |
| 2.9.2 | TLS 1.2+ | openssl s_client | No SSL 3.0/TLS 1.0 | ⏳ |
| 2.9.3 | Certificado válido | openssl verify | Valid cert | ⏳ |
| 2.9.4 | Cipher suerte fuerte | openssl cipher | High strength | ⏳ |
| 2.9.5 | HTTP redirects a HTTPS | curl http:// | 301 redirect | ⏳ |
| 2.9.6 | X-Content-Type-Options | Check header | nosniff | ⏳ |
| 2.9.7 | X-Frame-Options | Check header | DENY | ⏳ |
| 2.9.8 | CSP header presente | Check header | Defined | ⏳ |

---

## 🛠️ Metodología de Testing

### Setup
1. Iniciar Docker containers con la aplicación
2. Crear usuarios de prueba (Free, Pro, Premium)
3. Obtener JWT tokens válidos para cada usuario
4. Documentar endpoints y comportamiento esperado

### Execution
1. Ejecutar cada test case de forma aislada
2. Capturar response (status, headers, body)
3. Comparar con comportamiento esperado
4. Documentar cualquier hallazgo

### Reporting
1. Test cases pasados ✅
2. Test cases fallados ❌
3. Vulnerabilidades encontradas 🔴
4. Recomendaciones

---

## 📈 Criterios de Éxito

```
✅ 100% de endpoints requieren auth (sin excepciones públicas)
✅ 100% de cross-org requests son rechazadas
✅ 100% de rate limits funcionan
✅ 100% de invalid input es rechazado
✅ 0% de información sensible leakada en errores
✅ 100% de sessions son secure
✅ HTTPS/TLS configurado correctamente
✅ Cero vulnerabilidades críticas encontradas
```

---

## 📅 Timeline

```
Hoy (2026-05-19):
  ✅ PASO 1: OWASP Audit (Completado)
  → PASO 2: Penetration Testing (Iniciando)

Mañana (2026-05-20):
  → Continuar Penetration Testing
  → Compilar resultados

Miércoles (2026-05-21):
  → PASO 3: GDPR Compliance Review
  → Documentar findings

Jueves (2026-05-22):
  → PASO 4: SOC 2 Preparation
  → Remediation de issues

Viernes (2026-05-23):
  → Final verification
  → Producción deployment
```

---

**Status**: 🚀 PLAN READY  
**Próximo**: Ejecutar test cases  
**Confianza**: 95%

