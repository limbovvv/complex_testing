from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "exam",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.beat_schedule = {
    "auto_submit_expired": {
        "task": "auto_submit_expired",
        "schedule": 60.0,
    }
}

celery_app.autodiscover_tasks(["app.worker.tasks"])
