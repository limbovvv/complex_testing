# Entrance Exam (Docker + PostgreSQL)

## Quick start

1. Create env file:

```bash
cp .env.example .env
```

2. Build and start all services:

```bash
docker compose up -d --build
```

3. Open:

- User page: http://localhost:5173/user
- Admin login: http://localhost:5173/admin-login
- Admin panel: http://localhost:5173/admin-panel
- API docs: http://localhost:8000/docs

4. Stop services:

```bash
docker compose down
```

5. Stop and remove DB volume too:

```bash
docker compose down -v
```

## Services

- `postgres` - PostgreSQL 16
- `redis` - broker/result backend for Celery
- `backend` - FastAPI API + migrations + seed
- `worker` - Celery worker
- `frontend` - Vite frontend
