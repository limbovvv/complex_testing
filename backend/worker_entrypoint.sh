#!/bin/sh
set -e

if ! python -m app.judge.build_images; then
  echo "Warning: judge images were not prebuilt, continuing with worker startup"
fi

exec celery -A app.worker.celery_app worker -l info
