# StockWise AI

StockWise AI is an inventory management system designed for small businesses. It provides robust inventory tracking, atomic stock movements with audit ledgers, low-stock alerts, supplier management, financial reports, and a responsive modern React frontend.

---

## Tech Stack

### Backend
- **Python**: 3.11+ (running Python 3.13)
- **FastAPI**: Modern, high-performance web framework
- **PostgreSQL 18**: Production-grade relational database
- **SQLAlchemy 2.x**: Declarative ORM and connection pooling
- **Alembic**: Database schema migration framework
- **Psycopg 3 (`psycopg[binary]`)**: Modern PostgreSQL driver
- **Pydantic v2 & Pydantic Settings**: Data validation and type-safe configuration management
- **Uvicorn**: ASGI web server
- **pytest & httpx**: 43 automated tests covering models, transactions, rollbacks, and security

### Frontend
- **React 18**: Component-based UI library
- **TypeScript**: Static typing with strict API contracts
- **Vite 6**: Fast modern build tool and dev server with API proxy
- **Tailwind CSS 3**: Utility-first responsive design
- **Lucide React**: Clean iconography for inventory states and KPIs

---

## Project Structure

```
stockwise-ai/
├── README.md                    # Project documentation and run guide
├── docker-compose.yml           # Docker Compose file for PostgreSQL container
├── .gitignore
│
├── backend/                     # FastAPI + SQLAlchemy backend
│   ├── .env                     # Local credentials (excluded from Git)
│   ├── .env.example             # Safe template committed to Git
│   ├── requirements.txt         # Pinned backend dependencies
│   ├── pytest.ini               # Pytest configuration
│   ├── alembic.ini              # Alembic migration configuration
│   ├── alembic/                 # Migration version scripts
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point, CORS, and error handlers
│   │   ├── config.py            # Pydantic Settings with startup security validation
│   │   ├── database.py          # SQLAlchemy Engine, SessionLocal, get_db dependency
│   │   ├── core/
│   │   │   └── security.py      # API key verification & PBKDF2 password hashing
│   │   ├── models/              # Product, InventoryTransaction, Supplier models
│   │   ├── schemas/             # Pydantic schemas for requests and responses
│   │   ├── services/            # Business logic (Product, Inventory, Supplier, Report)
│   │   └── api/v1/              # REST routers: /products, /inventory, /suppliers, /dashboard, /reports
│   └── tests/                   # 43 automated pytest cases
│
└── frontend/                    # React + TypeScript + Vite frontend
    ├── .env                     # Frontend environment variables (VITE_API_BASE_URL)
    ├── .env.example             # Environment template
    ├── package.json             # NPM dependencies & scripts
    ├── tsconfig.json            # TypeScript configuration
    ├── vite.config.ts           # Vite configuration with /api proxy
    ├── tailwind.config.js       # Tailwind CSS design system
    ├── index.html               # Entry HTML
    └── src/
        ├── main.tsx             # React DOM root entry
        ├── App.tsx              # Shell with navigation & common modals
        ├── index.css            # Tailwind directives
        ├── vite-env.d.ts        # Vite environment types
        ├── types/               # TypeScript interfaces matching backend schemas
        │   ├── product.ts
        │   ├── inventory.ts
        │   ├── supplier.ts
        │   ├── dashboard.ts
        │   └── reports.ts
        ├── api/                 # Centralized API client & domain modules
        │   ├── client.ts        # Typed fetch client with error normalization
        │   ├── products.ts
        │   ├── inventory.ts
        │   ├── suppliers.ts
        │   ├── dashboard.ts
        │   └── reports.ts
        ├── components/
        │   ├── layout/          # Navbar, Sidebar with low-stock badge
        │   ├── common/          # StatCard, Modal, Alert, Spinner, Pagination
        │   ├── products/        # ProductFormModal (create & edit)
        │   ├── inventory/       # StockMovementModal (stock in & out)
        │   └── suppliers/       # SupplierFormModal (create & edit)
        └── pages/
            ├── DashboardPage.tsx     # Real-time KPIs & low-stock priority list
            ├── ProductsPage.tsx      # Catalog with search, filters & pagination
            ├── InventoryPage.tsx     # Immutable transaction audit ledger
            ├── SuppliersPage.tsx     # Supplier directory with product links
            └── ReportsPage.tsx       # Stock valuation & movement analytics
```

---

## How to Run Backend and Frontend Together

### 1. Start the PostgreSQL Server
Ensure PostgreSQL is running locally on port `5433`:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "$env:USERPROFILE\.stockwise_pgdata" -p 5433
```
Or check readiness:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -p 5433 -h 127.0.0.1
```

### 2. Start the FastAPI Backend Server
In Terminal 1:
```powershell
cd "c:\Users\Microsoft\Desktop\stockwise ai\backend"
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 3. Start the Vite React Frontend
In Terminal 2:
```powershell
cd "c:\Users\Microsoft\Desktop\stockwise ai\frontend"
npm run dev
```
- Frontend UI: [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## Running Automated Backend Tests
```powershell
cd "c:\Users\Microsoft\Desktop\stockwise ai"
.\backend\.venv\Scripts\pytest.exe -c .\backend\pytest.ini .\backend\tests -v
```
All 43 tests pass against live PostgreSQL.

## Building Frontend for Production
```powershell
cd "c:\Users\Microsoft\Desktop\stockwise ai\frontend"
npm run build
```
Creates production-optimized assets in `frontend/dist/`.
