# 🚀 Docker Quick Start

## ⚡ 2-Minute Setup

```bash
# 1. Configure environment
cp .env.example .env

# 2. Initialize everything
make dev-init

# 3. Done! Access:
# - App: http://localhost:3000
# - pgAdmin: http://localhost:5050 (admin/admin)
```

---

## 📚 Essential Commands

| Command | What it does |
|---------|-------------|
| `make up` | Start all services |
| `make down` | Stop everything |
| `make logs` | Watch all logs |
| `make shell` | Terminal in app container |
| `make db-shell` | Connect to PostgreSQL |
| `make db-push` | Sync database schema |
| `make restart` | Restart all services |

---

## 🗄️ Database

```bash
# Connect to database
make db-shell

# Some useful psql commands:
\dt                           # List tables
\d embeddings                 # Describe embeddings table
SELECT COUNT(*) FROM users;   # Count users
```

---

## 🐛 Troubleshooting 30 Seconds

| Issue | Fix |
|-------|-----|
| "Port 5432 in use" | `make down` then `make up` |
| "DB connection refused" | Wait 15s, then `make db-shell` to verify |
| "Code changes not reflected" | `make restart` |
| "Need fresh DB" | `make clean-volumes && make up && make db-push` |
| "Something broken" | `make down && make up` (nuclear option: `make clean`) |

---

## 🔧 Common Workflows

### 🆕 New Feature with DB Changes

```bash
# Edit schema in db/schema.ts
# Then:
make db-push
make restart
```

### 🧪 Testing

```bash
make shell
npm test
```

### 📊 Database Admin

```bash
# Option 1: Web UI
open http://localhost:5050  # pgAdmin

# Option 2: CLI
make db-shell
```

### 🧹 Full Reset

```bash
make clean          # Remove everything
make dev-init       # Start fresh
```

---

## 📦 What's Included

- **PostgreSQL 16** with pgvector for RAG
- **pgAdmin** for database management (http://localhost:5050)
- **Next.js** app with hot reload
- **Health checks** and automatic restart
- **Persistent volumes** for data

---

## 📂 Files Created

```
├── Dockerfile              Next.js image
├── docker-compose.yml      Service orchestration
├── Makefile               Command shortcuts
├── .dockerignore           Build optimization
├── DOCKER.md              Full documentation
├── DOCKER-QUICKSTART.md   This file
└── db/init.sql            PostgreSQL initialization
```

---

## 🔗 Links

- **Full docs**: [DOCKER.md](./DOCKER.md)
- **App**: http://localhost:3000
- **Database UI**: http://localhost:5050
- **Health check**: http://localhost:3000/api/health

---

**Need help?** See [DOCKER.md](./DOCKER.md) for complete documentation.
