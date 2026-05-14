# 🐳 Docker Setup - Domicilios

Configuración completa de Docker con PostgreSQL + pgvector para RAG + Next.js app.

## 📋 Requisitos Previos

- **Docker Desktop** (Mac/Windows) o **Docker + Docker Compose** (Linux)
- **Make** (para usar Makefile - opcional, puedes ejecutar comandos de docker-compose directamente)

### Verificar instalación:
```bash
docker --version        # Docker 20.10+
docker-compose --version # Docker Compose 2.0+
make --version          # GNU Make 4.0+
```

---

## 🚀 Inicio Rápido

### 1. Configurar variables de entorno

```bash
make env-init
# O manualmente:
cp .env.example .env
cp .env.docker .env  # Para desarrollo con Docker
```

**Editar `.env` con:**
- `AUTH_SECRET` (genera uno: `openssl rand -base64 32`)
- `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`
- `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, etc.

### 2. Iniciar servicios (primera vez)

```bash
make dev-init
```

Esto hace:
- ✅ Crea `.env` si no existe
- ✅ Construye imágenes Docker
- ✅ Inicia contenedores
- ✅ Ejecuta migraciones de BD

**O paso a paso:**
```bash
make build      # Construir imágenes
make up         # Iniciar servicios
make db-push    # Migrar BD (crear tablas)
```

### 3. Acceder a los servicios

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **App** | http://localhost:3000 | — |
| **pgAdmin** | http://localhost:5050 | admin@domicilios.local / admin |
| **PostgreSQL** | localhost:5432 | postgres / postgres |

---

## 📚 Comandos del Makefile

### 🔴 Control de Servicios

```bash
make up              # ✅ Iniciar servicios
make down            # ❌ Detener y eliminar contenedores
make restart         # 🔄 Reiniciar servicios
make stop            # ⏸️  Pausar sin eliminar
make ps              # 📊 Ver estado de contenedores
```

### 🔧 Desarrollo

```bash
make logs            # Ver logs de todos los servicios
make logs-app        # Ver logs de la app
make logs-db         # Ver logs de PostgreSQL
make shell           # Abrir shell en el contenedor app
make build           # Reconstruir imágenes
make env-init        # Crear .env desde .env.example
```

### 🗄️ Base de Datos

```bash
make db-shell        # Conectar a PostgreSQL (psql)
make db-migrate      # Ejecutar migraciones (drizzle-kit migrate)
make db-push         # Enviar cambios de schema a BD
make db-reset        # ⚠️  Borrar y recrear BD
make db-studio       # Abrir Drizzle Studio (UI para BD)
make db-seed         # Llenar BD con datos iniciales
```

### 🧹 Limpieza

```bash
make clean-volumes   # ⚠️  Eliminar volúmenes de datos
make clean-images    # ⚠️  Eliminar imágenes Docker
make clean           # ⚠️  Limpieza COMPLETA (containers + volumes + images)
make prune           # Limpiar recursos no usados
```

---

## 📁 Estructura de Archivos Docker

```
domicilios/
├── Dockerfile              # Imagen de Next.js
├── docker-compose.yml      # Orquestación de servicios
├── Makefile               # Comandos automatizados
├── .dockerignore           # Excluir archivos en build
├── .env.docker             # Template de variables
├── DOCKER.md              # Este archivo
└── db/
    └── init.sql           # Script de inicialización PostgreSQL
```

---

## 🏗️ Servicios en Docker

### PostgreSQL con pgvector

```yaml
Service: postgres
Image: pgvector/pgvector:0.6.0-pg16
Port: 5432
Volume: postgres_data (persistente)
Features:
  - pgvector extension para RAG
  - UTF-8 encoding
  - Health checks
```

**Tablas RAG inicializadas:**
- `embeddings` — almacena vectores para búsqueda semántica
- Índices IVFFLAT para búsqueda rápida

### Next.js App

```yaml
Service: app
Build: Dockerfile (multi-stage)
Port: 3000
Depends on: postgres (healthy)
Volumes:
  - Código fuente (live reload en dev)
  - node_modules (aislado)
  - .next (build cache)
```

### pgAdmin (Opcional)

```yaml
Service: pgadmin
Image: dpage/pgadmin4:latest
Port: 5050
UI: http://localhost:5050
Auto-conecta a PostgreSQL
```

---

## 🔌 Variables de Entorno

### Archivos de configuración

| Archivo | Propósito | Guardar en Git |
|---------|-----------|----------------|
| `.env.example` | Template de variables | ✅ Sí |
| `.env.docker` | Template específico Docker | ✅ Sí |
| `.env` | Variables locales (secretos) | ❌ No |
| `.env.local` | Overrides locales | ❌ No |

### Variables Docker importantes

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/domicilios

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_URL=http://localhost:3000

# Servicios externos (obtener en producción)
AUTH_GOOGLE_ID=your_google_id
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re-...
```

---

## 🐛 Troubleshooting

### ❌ "Permission denied" con Makefile

En Linux, dar permisos:
```bash
chmod +x /usr/bin/make  # O instalar: apt-get install make
```

O ejecutar directamente sin Make:
```bash
docker-compose up -d
docker-compose exec app npm run db:push
```

### ❌ Puerto 5432 ya en uso

Cambiar en `.env`:
```bash
DB_PORT=5433  # PostgreSQL escuchará en 5433
DATABASE_URL=postgresql://postgres:postgres@postgres:5433/domicilios
```

O detener el PostgreSQL local:
```bash
sudo systemctl stop postgresql  # Linux
brew services stop postgresql   # macOS
```

### ❌ Database connection refused

Verificar que PostgreSQL esté listo:
```bash
make ps  # Debe mostrar "healthy"
docker-compose logs postgres
```

Esperar 10-15 segundos después de `make up` para que la BD se inicialice.

### ❌ Next.js no inicia

Verificar logs:
```bash
make logs-app

# Si dice "DATABASE_URL is missing":
make db-push
```

### ❌ Cambios en código no se reflejan

En desarrollo, los volúmenes deben permitir hot-reload. Si no funciona:
```bash
make restart
```

---

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
make logs              # Todos los servicios
make logs-app          # Solo app
make logs-db           # Solo PostgreSQL

# Ver últimas 50 líneas:
docker-compose logs -n 50 app
```

### Conectarse a PostgreSQL

```bash
# Opción 1 (recomendado):
make db-shell

# Opción 2 (manual):
psql -h localhost -U postgres -d domicilios -p 5432

# Opción 3 (desde contenedor):
docker-compose exec postgres psql -U postgres -d domicilios
```

### Usar pgAdmin

1. Acceder a http://localhost:5050
2. Login: `admin@domicilios.local` / `admin`
3. Agregar servidor:
   - Host: `postgres`
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`

---

## 🔐 Seguridad para Producción

⚠️ **IMPORTANTE:** Esta configuración es para DESARROLLO.

Para PRODUCCIÓN:
1. **No usar contraseñas por defecto**
   ```bash
   DB_PASSWORD=$(openssl rand -base64 32)
   PGADMIN_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Usar volúmenes nombrados con backups**
   ```yaml
   volumes:
     postgres_data:
       driver: local
   # Hacer backup regularmente:
   docker-compose exec postgres pg_dump -U postgres domicilios > backup.sql
   ```

3. **Usar imagen base segura**
   - Reemplazar `node:20-alpine` por `node:20-alpine@sha256:...` (pin versión)

4. **Red privada**
   - Cambiar `networks.domicilios-network` a red privada
   - Exponer solo puerto 3000 (app)

5. **Variables de secretos**
   - Usar Docker secrets
   - O environment files seguros

6. **Healthchecks**
   - Ya incluidos en docker-compose.yml

---

## 🚀 Workflow Típico

### Día 1: Setup inicial

```bash
make dev-init  # Todo en uno

# Esperar a que la BD esté lista
make ps

# Verificar que todo funciona
curl http://localhost:3000
```

### Días posteriores: Desarrollo

```bash
# Iniciar servicios
make up

# Ver logs mientras trabajas
make logs -f

# Si cambias schema:
make db-push

# Cuando termines
make down
```

### Limpieza ocasional

```bash
# Limpiar volúmenes sin perder código
make clean-volumes

# Limpiar TODO (empezar desde cero)
make clean
make dev-init
```

---

## 📚 Recursos Adicionales

- **Docker Docs**: https://docs.docker.com
- **PostgreSQL + pgvector**: https://github.com/pgvector/pgvector
- **Next.js**: https://nextjs.org/docs
- **Drizzle ORM**: https://orm.drizzle.team

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar esto en producción?**
No tal cual. Requiere cambios de seguridad (ver sección "Seguridad para Producción").

**P: ¿Dónde guardar archivos subidos (S3)?**
En `.env` configura `S3_*` variables. En desarrollo, puedes usar Minio:
```yaml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"
```

**P: ¿Cómo integrar otra BD (Redis, MongoDB)?**
Agregar servicio en `docker-compose.yml`:
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

**P: ¿Puedo usar esto con GitHub Actions / CI?**
Sí, usa `docker-compose exec` en scripts de CI.

---

**Última actualización:** 2026-05-13
**Versiones:** PostgreSQL 16 | Node.js 20 | pgvector 0.6.0
