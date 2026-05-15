# 🚀 Guía de Desarrollo - Domicilios

## Requisitos Previos

- Docker & Docker Compose
- Node.js 18+
- npm o pnpm

## Setup Inicial

### 1. Configurar Docker Compose
```bash
# Copiar el archivo de ejemplo y ajustar según sea necesario
cp docker-compose.example.yml docker-compose.yml

# Iniciar servicios
docker-compose up -d
```

### 2. Verificar Servicios
```bash
# Ver estado de los servicios
docker-compose ps

# Logs de PostgreSQL
docker-compose logs postgres

# Logs de Redis
docker-compose logs redis
```

### 3. Configurar Base de Datos
```bash
# Ver las migraciones disponibles en db/migrations/
# Las migraciones se ejecutan automáticamente en el primer inicio

# Para resetear la BD (desarrollo)
docker-compose down -v
docker-compose up -d postgres
```

### 4. Configurar Variables de Entorno
```bash
# Copiar .env.example a .env.local
cp .env.example .env.local

# Valores necesarios:
AUTH_SECRET=wfqmn8ZMkh5lHxfRoof2oCRkSsTF5YTGXJWxsjoOJRc=
AUTH_URL=http://localhost:3000

# Google OAuth (opcional para dev local)
AUTH_GOOGLE_ID=<YOUR_GOOGLE_CLIENT_ID>
AUTH_GOOGLE_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>

# Base de Datos
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/domicilios

# Redis (para sesiones si lo necesitas)
REDIS_URL=redis://127.0.0.1:6379
```

### 5. Instalar Dependencias
```bash
npm install
# o
pnpm install
```

### 6. Iniciar Servidor de Desarrollo
```bash
npm run dev
# o
pnpm dev
```

El servidor estará disponible en: **http://localhost:3000**

## Servicios Disponibles en Desarrollo

### PostgreSQL
- **Host**: `localhost`
- **Puerto**: `5432`
- **Usuario**: `postgres`
- **Contraseña**: `postgres`
- **Base de Datos**: `domicilios`

**Conexión desde CLI:**
```bash
psql -h localhost -U postgres -d domicilios
```

### Redis
- **Host**: `localhost`
- **Puerto**: `6379`

**Verificar estado:**
```bash
docker-compose exec redis redis-cli ping
```

### pgAdmin (Gestor Visual de PostgreSQL)
- **URL**: http://localhost:5050
- **Email**: `admin@domicilios.local`
- **Contraseña**: `admin`

**Pasos para agregar servidor:**
1. Ir a http://localhost:5050
2. Login con credenciales anteriores
3. "Add New Server"
4. Tab "Connection":
   - Host: `postgres` (usar nombre del servicio)
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`
   - Database: `domicilios`

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f postgres

# Ejecutar comando en la BD
docker-compose exec postgres psql -U postgres -d domicilios

# Resetear todo (BD y caché)
docker-compose down -v

# Detener servicios sin eliminar datos
docker-compose stop

# Reanudar servicios
docker-compose start

# Ver estado de contenedores
docker-compose ps
```

## Debugging

### Verificar Conexión a BD
```bash
# Desde el contenedor de app
npm run dev

# Si hay error de conexión, verificar:
docker-compose ps postgres  # Debe estar running y healthy
```

### Verificar Migraciones
```bash
# Conectar a la BD
docker-compose exec postgres psql -U postgres -d domicilios

# Ver tablas existentes
\dt

# Ver extension pgvector
\dx
```

### Limpiar Datos de Desarrollo
```bash
# Resetear base de datos completamente
docker-compose down -v
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo (verificar logs)
docker-compose logs postgres | grep "database system is ready"
```

## Estructura de Servicios

```
┌─────────────────────────────────┐
│    Next.js App (localhost:3000) │
└────┬─────────────────┬──────────┘
     │                 │
     ▼                 ▼
┌─────────────┐   ┌──────────────┐
│ PostgreSQL  │   │   Redis      │
│ (5432)      │   │  (6379)      │
└─────────────┘   └──────────────┘
     │
     ▼
┌──────────────┐
│  pgAdmin     │
│  (5050)      │
└──────────────┘
```

## Notas

- **pgvector**: Extensión para embeddings de IA (catálogos generados con IA)
- **Redis**: Puede usarse para caché o sesiones en el futuro
- **pgAdmin**: Herramienta opcional para debugging visual de la BD

## Próximos Pasos

Después de setup inicial:
1. ✅ Verificar que servicios estén corriendo: `docker-compose ps`
2. ✅ Instalar dependencias: `npm install`
3. ✅ Iniciar servidor: `npm run dev`
4. ✅ Abrir http://localhost:3000 en el navegador
5. ✅ Testear flujos de autenticación
