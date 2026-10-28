# StockWise AI

StockWise AI is an inventory management system designed for small businesses. It provides robust inventory tracking, stock movements with audit ledgers, low-stock alerts, and supplier management.

---

## Tech Stack (Backend - Phase 2)

- **Python**: 3.11+ (running Python 3.13)
- **FastAPI**: Modern, high-performance web framework
- **PostgreSQL**: Production-grade relational database
- **SQLAlchemy 2.x**: Declarative ORM and connection pooling
- **Alembic**: Database schema migration framework
- **Psycopg 3 (`psycopg[binary]`)**: Modern PostgreSQL driver
- **Pydantic v2 & Pydantic Settings**: Data validation and type-safe configuration management
- **Uvicorn**: ASGI web server
- **pytest & httpx**: Automated testing framework and HTTP client

---

## Project Structure

```
stockwise-ai/
├── .gitignore                   # Ignores .venv, .env, pg_data, caches
├── README.md                    # Project documentation and setup guide
├── docker-compose.yml           # Docker Compose file for PostgreSQL container
└── backend/
    ├── .env                     # Local environment credentials (excluded from Git)
    ├── .env.example             # Safe template committed to Git
    ├── requirements.txt         # Pinned backend dependencies
    ├── pytest.ini               # Pytest test discovery & PYTHONPATH setup
    ├── alembic.ini              # Alembic configuration
    ├── alembic/
    │   ├── env.py               # Migration environment (loads config & models)
    │   ├── script.py.mako       # Migration template
    │   └── versions/            # Version-controlled migration scripts
    │
    ├── app/
    │   ├── __init__.py
    │   ├── main.py              # FastAPI application entry point
    │   ├── config.py            # Pydantic Settings environment loader
    │   ├── database.py          # SQLAlchemy Engine, SessionLocal, get_db
    │   ├── models/              # SQLAlchemy declarative models
    │   │   └── __init__.py      # Declarative Base
    │   └── api/
    │       ├── __init__.py
    │       └── v1/
    │           ├── __init__.py
    │           ├── router.py    # Aggregated API v1 router
    │           └── health.py    # Health check & database probe
    │
    └── tests/
        ├── __init__.py
        ├── conftest.py          # Pytest fixtures (TestClient)
        ├── test_database.py     # Minimal PostgreSQL connectivity tests
        ├── test_health.py       # API health check tests
        └── probe_server.py      # Live server integration probe
```

---

## Database Setup (PostgreSQL)

You have two convenient options to run PostgreSQL locally:

### Option A: Dedicated Local PostgreSQL Instance (Already Configured)
If PostgreSQL is installed locally on Windows, start the server cluster on port `5433`:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "$env:USERPROFILE\.stockwise_pgdata" -p 5433
```

### Option B: Docker Compose (If Docker is Installed)
If you have Docker Desktop running:
```powershell
docker compose up -d
```
This starts a PostgreSQL 16 container mapped to port `5432`. Set `POSTGRES_PORT=5432` in your `backend/.env`.

---

## Getting Started

### 1. Set Up Virtual Environment & Dependencies

From the project root:
```powershell
cd "c:\Users\Microsoft\Desktop\stockwise ai"

# Activate virtual environment
.\backend\.venv\Scripts\Activate.ps1

# Install / update dependencies
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables

Ensure `backend/.env` exists (copied from `backend/.env.example`):
```ini
# Application
PROJECT_NAME="StockWise AI"
ENVIRONMENT="development"
DEBUG=True
API_V1_STR="/api/v1"

# Database Configuration
POSTGRES_SERVER="127.0.0.1"
POSTGRES_PORT=5433
POSTGRES_USER="stockwise_user"
POSTGRES_PASSWORD="stockwise_pass"
POSTGRES_DB="stockwise_db"
```

---

## Database Migrations (Alembic)

Migrations allow tracking and safely applying database schema changes over time.

### How to Run Migrations:

1. **Check current database revision**:
   ```powershell
   .\backend\.venv\Scripts\alembic.exe -c .\backend\alembic.ini current
   ```

2. **Generate a new migration script** (when models are updated):
   ```powershell
   .\backend\.venv\Scripts\alembic.exe -c .\backend\alembic.ini revision --autogenerate -m "describe_changes"
   ```

3. **Apply all pending migrations**:
   ```powershell
   .\backend\.venv\Scripts\alembic.exe -c .\backend\alembic.ini upgrade head
   ```

4. **Rollback the latest migration**:
   ```powershell
   .\backend\.venv\Scripts\alembic.exe -c .\backend\alembic.ini downgrade -1
   ```

---

## Running the Application & Tests

### Run Automated Tests
```powershell
.\backend\.venv\Scripts\pytest -c .\backend\pytest.ini .\backend\tests
```
Expected output:
```
backend\tests\test_database.py ...                                       [ 42%]
backend\tests\test_health.py ....                                        [100%]
======================== 7 passed in 0.28s ========================
```

### Run Live Server
```powershell
cd backend
..\backend\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify in your browser:
- Health & DB Probe: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) (reports `database: "connected"`)
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
