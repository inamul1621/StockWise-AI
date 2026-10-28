# StockWise AI

StockWise AI is an inventory management system designed for small businesses. It provides robust inventory tracking, stock movements with audit ledgers, low-stock alerts, and supplier management.

---

## Tech Stack (Backend - Phase 1)

- **Python**: 3.11+ (running 3.13)
- **FastAPI**: Modern, high-performance web framework
- **Pydantic v2 & Pydantic Settings**: Data validation and type-safe configuration management
- **Uvicorn**: ASGI web server
- **pytest & httpx**: Automated testing framework and HTTP client

---

## Project Structure

```
stockwise-ai/
├── .gitignore               # Root Git ignore rules (secrets, venv, caches)
├── README.md                # Project documentation and setup guide
└── backend/
    ├── .env                 # Local environment variables (not committed)
    ├── .env.example         # Template for environment configuration
    ├── requirements.txt     # Python dependencies
    ├── pytest.ini           # Pytest configuration
    ├── app/
    │   ├── __init__.py
    │   ├── main.py          # FastAPI application entry point
    │   ├── config.py        # Pydantic Settings configuration loader
    │   └── api/
    │       ├── __init__.py
    │       └── v1/
    │           ├── __init__.py
    │           ├── router.py # Aggregated API v1 router
    │           └── health.py # Health check endpoint
    └── tests/
        ├── __init__.py
        ├── conftest.py      # Pytest fixtures (TestClient)
        ├── test_health.py   # Unit & endpoint tests
        └── probe_server.py  # Live server integration probe
```

---

## Getting Started

### 1. Prerequisites
- Python 3.11 or higher installed on your system.
- Git installed.

### 2. Set Up the Python Virtual Environment

From the project root:

**On Windows (PowerShell):**
```powershell
# Navigate into the project root
cd "c:\Users\Microsoft\Desktop\stockwise ai"

# Create a virtual environment (if not already created)
python -m venv backend\.venv

# Activate the virtual environment
.\backend\.venv\Scripts\Activate.ps1
```

**On Linux / macOS:**
```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

---

### 3. Install Dependencies

With the virtual environment activated:
```powershell
pip install -r backend/requirements.txt
```

---

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:
```powershell
Copy-Item backend\.env.example backend\.env
```

The default values in `.env` are suitable for local development:
```ini
PROJECT_NAME="StockWise AI"
ENVIRONMENT="development"
DEBUG=True
API_V1_STR="/api/v1"
HOST="0.0.0.0"
PORT=8000
```

---

### 5. Run the Development Server

Navigate to the `backend` folder and run `uvicorn`:
```powershell
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- **Base URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Health Check**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- **Swagger UI (Interactive API Docs)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 6. Run the Automated Tests

From the project root:
```powershell
.\backend\.venv\Scripts\pytest -c .\backend\pytest.ini .\backend\tests
```

All tests should pass:
```
backend\tests\test_health.py ....                                        [100%]
============================== 4 passed in 0.12s ==============================
```

---

## Next Steps
- **Step 02**: PostgreSQL database integration, SQLAlchemy 2.0 models (`Product`, `Supplier`, `InventoryTransaction`), and Alembic migrations.
