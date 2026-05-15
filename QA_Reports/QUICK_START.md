# ⚡ Quick Start - Testing Rápido

**Tu guía de 2 minutos para empezar a testear**

---

## 🔐 Credenciales de Acceso (Todos usan la misma contraseña)

```
PASSWORD: Test@12345
URL: http://localhost:3001/login
```

---

## 👥 Usuarios Disponibles

### 1️⃣ Test Plan Gratis (Límites Básicos)
```
Email: carlos.garcia@test.com
Plan:  GRATIS
Límites: 1 catálogo, 30 productos, 30 pedidos/mes
```

### 2️⃣ Test Plan Pro (Features Avanzadas)
```
Email: maria.lopez@test.com
Plan:  PRO
Límites: 3 catálogos, 500 productos, ilimitados pedidos
```

### 3️⃣ Test Plan Premium (Todo Incluido)
```
Email: juan.rodriguez@test.com
Plan:  PREMIUM
Límites: 10 catálogos, 5000 productos, ilimitados pedidos
```

### 4️⃣ Test Plan Gratis (Duplicado)
```
Email: ana.martinez@test.com
Plan:  GRATIS
Límites: 1 catálogo, 30 productos, 30 pedidos/mes
```

---

## 📋 Pasos para Testing Rápido

### Paso 1: Login
1. Abre: http://localhost:3001/login
2. Pega un email de arriba
3. Password: `Test@12345`
4. Click "Iniciar Sesión"

### Paso 2: Verificar Plan
1. Ve a: http://localhost:3001/app/billing
2. Verifica que el plan correcto aparece (debe coincidir con el email)
3. Revisa los límites mostrados

### Paso 3: Logout & Cambiar Usuario
1. Click en perfil (arriba derecha)
2. Click "Logout"
3. Vuelve a Paso 1 con otro usuario

### Paso 4: Crear Catálogo
1. Ve a: http://localhost:3001/app/catalogs
2. Click "Nuevo Catálogo"
3. Llena los datos
4. Verifica que respeta límites del plan

---

## ✅ Checklist de Testing

- [ ] Login con usuario Gratis - Ver plan correcto
- [ ] Login con usuario Pro - Ver plan correcto  
- [ ] Login con usuario Premium - Ver plan correcto
- [ ] Logout desde un usuario
- [ ] Login nuevamente (mismo usuario)
- [ ] Crear catálogo (debe respetar límites)
- [ ] Verificar mensaje de límite alcanzado

---

## 🐛 Si Algo Falla

### Login No Funciona
- Verifica que PostgreSQL está corriendo: `docker ps`
- Verifica que Next.js está en puerto 3001: http://localhost:3001
- Revisa: [QA_TESTING_SESSION_2026_05_15.md](./QA_TESTING_SESSION_2026_05_15.md)

### Plan No Muestra Correcto
- Verifica que el usuario es el correcto
- Revisa: [USUARIOS_Y_PLANES_FINAL.md](./USUARIOS_Y_PLANES_FINAL.md)
- Documento técnico: [QA_USERS_CREATED_2026_05_15.md](./QA_USERS_CREATED_2026_05_15.md)

### Catálogo No Se Crea
- Verifica límites en [USUARIOS_Y_PLANES_FINAL.md](./USUARIOS_Y_PLANES_FINAL.md)
- Revisa: [QA_CATALOG_CREATION_REPORT.md](./QA_CATALOG_CREATION_REPORT.md)

---

## 📚 Documentación Completa

Más detalles disponibles en:
- [INDEX.md](./INDEX.md) - Índice de todos los archivos
- [USUARIOS_Y_PLANES_FINAL.md](./USUARIOS_Y_PLANES_FINAL.md) - Tabla completa

---

**¡Listo para testear! Abre http://localhost:3001/login y comienza** 🚀
