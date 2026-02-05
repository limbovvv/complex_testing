#!/bin/sh
set -e

python -m app.judge.build_images

exec celery -A app.worker.celery_app worker -l info
