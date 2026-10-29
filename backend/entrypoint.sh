#!/usr/bin/env sh
set -e

echo "[StockWise Startup] Checking database connection and applying migrations..."
alembic -c alembic.ini upgrade head

echo "[StockWise Startup] Database migrations up to date. Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
