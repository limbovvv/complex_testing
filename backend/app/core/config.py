from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "examdb"
    postgres_user: str = "exam"
    postgres_password: str = "exam"
    database_url: str = "postgresql+asyncpg://exam:exam@postgres:5432/examdb"

    secret_key: str = "change_me_secret"
    access_token_expire_minutes: int = 1440

    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"
    frontend_origin: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
