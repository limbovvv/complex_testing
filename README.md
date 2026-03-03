# Entrance Exam (Podman + PostgreSQL + Redis + FastAPI + Vite)

Проект поднимается через `Podman` (`docker` не требуется).

## 1) Подготовка `.env`

Linux/macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## 2) Запуск (Linux/macOS/Windows)

Основной способ:

```bash
podman-compose up -d --build
```
На Windows используйте Podman Desktop + PowerShell:

```powershell
Copy-Item .env.example .env
podman-compose up -d --build
```

## 4) Проверка

Откройте:

- User page: `http://localhost:5173/user`
- Admin login: `http://localhost:5173/admin-login`
- Admin panel: `http://localhost:5173/admin-panel`
- API docs: `http://localhost:8000/docs`

Проверка контейнеров:

```bash
podman ps
```

## 5) Остановка

Podman:

```bash
podman-compose down
```

С удалением volume базы:

```bash
podman-compose down -v
```

## 6) Если был конфликт имен контейнеров

Иногда `up` может ругаться, что имя контейнера уже занято. Выполните:

```bash
podman-compose down
podman-compose up -d
```

## Services

- `postgres` - PostgreSQL 16
- `redis` - Redis 7 (broker/result backend для Celery)
- `backend` - FastAPI + Alembic migrations + seed
- `worker` - Celery worker
- `frontend` - Vite (React)
