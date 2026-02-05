# Complex Testing — Вступительный экзамен (monorepo)

Онлайн-платформа вступительного экзамена с mini-judge:
- регистрация/логин пользователей;
- одна попытка экзамена на пользователя;
- таймер 60 минут и автосдача;
- 3 блока заданий: Информатика (код), Математика (тесты), Русский (тесты);
- проверка в Celery worker через sandbox-контейнеры;
- админка для управления заданиями, тест-кейсами и просмотра статистики/результатов.

## Стек
- Frontend: React + Vite + TypeScript + Monaco Editor
- Backend: FastAPI (Python 3.12)
- ORM: SQLAlchemy 2.0 (async) + asyncpg
- Миграции: Alembic
- БД: PostgreSQL
- Очередь: Redis + Celery + Celery Beat
- Judge: sandbox-контейнеры (python/node/cpp) без сети, лимиты по времени/памяти
- Оркестрация: Podman Compose

## Где хранятся данные
Все пользователи, админы, попытки, ответы, черновики кода, результаты и статистика хранятся в PostgreSQL.

Конкретно в БД лежат:
- `users` — пользователи и админы;
- `exam_attempts` — попытки и итоговые баллы;
- `attempt_answers`, `attempt_prog` — ответы и решения;
- `questions`, `prog_tasks`, `prog_testcases` — контент экзамена.

Данные сохраняются между перезапусками контейнеров через volume `nikolaev_pgdata`.

## Запуск (Podman)
Требования:
- `podman`
- `podman-compose`

### 1) Поднять Podman socket (один раз)
```bash
systemctl --user start podman.socket
```

### 2) Запустить проект
```bash
podman-compose up --build -d
```

### 3) Открыть в браузере
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Админка: http://localhost:5173/admin

Админ из seed:
- email: `admin@example.com`
- password: `admin123`

## Полезные команды
Проверить контейнеры:
```bash
podman ps | rg nikolaev
```

Логи backend:
```bash
podman logs -f nikolaev_backend_1
```

Логи worker:
```bash
podman logs -f nikolaev_worker_1
```

Остановить проект:
```bash
podman-compose down
```

Остановить с удалением volume БД (сбросить данные):
```bash
podman-compose down -v
```

## API
### Auth
- `POST /auth/register`
- `POST /auth/login`

### Exam
- `POST /exam/start`
- `GET /exam/state`
- `PUT /exam/answer/{question_id}`
- `PUT /exam/draft/{task_id}`
- `POST /exam/submit`
- `GET /exam/result`

### Admin
- CRUD ` /admin/questions`
- CRUD ` /admin/prog_tasks`
- CRUD ` /admin/prog_testcases`
- `POST /admin/publish/{entity}/{id}`
- `GET /admin/stats`
- `GET /admin/attempts`
