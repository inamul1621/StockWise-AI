# StockWise AI - Production Deployment & Operations Guide

This guide provides instructions for deploying, operating, backing up, and troubleshooting StockWise AI in staging and production environments.

---

## 1. Production Architecture Overview

```
                                  [ Client Browser ]
                                          │
                            HTTPS / 443   │   HTTP / 80
                                          ▼
                                ┌───────────────────┐
                                │   Nginx / Proxy   │ (Reverse proxy, SSL termination,
                                │   (Frontend SPA)  │  SPA routing & Gzip compression)
                                └─────────┬─────────┘
                                          │
                                 /api/*   │   Internal HTTP :8000
                                          ▼
                                ┌───────────────────┐
                                │  FastAPI Backend  │ (Uvicorn ASGI workers, Pydantic,
                                │   (StockWise)     │  Alembic & business service layer)
                                └─────────┬─────────┘
                                          │
                         SQLAlchemy 2.x   │   TCP Connection Pool :5432
                         Psycopg 3        │   (Atomic Transactions, Row Locking)
                                          ▼
                                ┌───────────────────┐
                                │   PostgreSQL 18   │ (Persistent volume: postgres_data,
                                │  Relational DB    │  ACID Ledger & Check Constraints)
                                └───────────────────┘
```

---

## 2. Environment Variables & Secrets Management

Store secrets exclusively in environment variables or cloud secret managers (e.g., AWS Secrets Manager, HashiCorp Vault, Doppler). **Never commit `.env` files to source control.**

### Backend Required Environment Variables

| Variable | Description | Production Example | Default / Dev |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Deployment environment mode | `production` | `development` |
| `DEBUG` | FastAPI debug mode (**Must be False in prod**) | `False` | `True` |
| `PROJECT_NAME` | Name of the service | `StockWise AI` | `StockWise AI` |
| `API_V1_STR` | API route prefix | `/api/v1` | `/api/v1` |
| `POSTGRES_SERVER` | PostgreSQL hostname or IP | `db` (or RDS endpoint) | `127.0.0.1` |
| `POSTGRES_PORT` | PostgreSQL TCP port | `5432` | `5433` |
| `POSTGRES_USER` | PostgreSQL username | `stockwise_prod_user` | `stockwise_user` |
| `POSTGRES_PASSWORD`| Strong database password | `vK8#mQ2$pL9!xZ4@` | `stockwise_pass` |
| `POSTGRES_DB` | Database name | `stockwise_prod_db` | `stockwise_db` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `https://app.stockwise.com` | `http://localhost:5173,...` |
| `API_KEY` | Optional API Key for protected endpoints | `sk_live_9a8b7c6d...` | None (Open dev mode) |

### Frontend Required Environment Variables

| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Full URL to the backend API v1 | `https://api.stockwise.com/api/v1` |
| `VITE_API_KEY` | API Key header value if configured | `sk_live_9a8b7c6d...` |

---

## 3. Database Initialization & Migrations

StockWise AI uses Alembic for declarative schema versioning.

### Step 1: Initialize Database
When launching a brand new database, ensure the database exists and user permissions are granted:
```sql
CREATE USER stockwise_user WITH PASSWORD 'strong_password_here';
CREATE DATABASE stockwise_db OWNER stockwise_user;
GRANT ALL PRIVILEGES ON DATABASE stockwise_db TO stockwise_user;
```

### Step 2: Apply Migrations
Always run migrations before starting the application web processes:
```bash
# Inside backend directory
alembic -c alembic.ini upgrade head
```

### Step 3: Verify Migration Revision
```bash
alembic -c alembic.ini current
```
Expected output includes the latest revision: `8591e30378c8 (head)`.

---

## 4. Reliable Health Checks & Monitoring

The backend exposes an automated health probe at:
```http
GET /api/v1/health
```

### Healthy Response (`HTTP 200 OK`)
```json
{
  "status": "ok",
  "app_name": "StockWise AI",
  "version": "0.1.0",
  "environment": "production",
  "database": "connected"
}
```

### Degraded / Disconnected Response (`HTTP 503 Service Unavailable`)
```json
{
  "status": "degraded",
  "app_name": "StockWise AI",
  "version": "0.1.0",
  "environment": "production",
  "database": "disconnected"
}
```
*Note: Health check failures log detailed connection errors internally to `logger.error` while returning sanitized JSON to external probes to prevent credential and topology disclosure.*

### Container Healthcheck Configuration
Both `Dockerfile` and `docker-compose.yml` include automated health checks:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U stockwise_user -d stockwise_db"]
  interval: 10s
  timeout: 5s
  retries: 5
```

---

## 5. Database Backup and Disaster Recovery

### Creating a Full Database Backup (`pg_dump`)
Run a compressed custom-format backup:
```bash
# On host or inside container
pg_dump -h 127.0.0.1 -p 5432 -U stockwise_user -d stockwise_db -F c -b -v -f "stockwise_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Restoring from Backup (`pg_restore`)
To restore the backup into a clean database:
```bash
# 1. Terminate active connections (if restoring over existing database)
# 2. Restore schema and data
pg_restore -h 127.0.0.1 -p 5432 -U stockwise_user -d stockwise_db -v -c "stockwise_backup_20261029_120000.dump"
```

### Automated Backup Cron Job Example (Linux)
```bash
# Run daily at 02:00 AM UTC and prune backups older than 30 days
0 2 * * * pg_dump -h 127.0.0.1 -U stockwise_user -d stockwise_db -F c -f "/backups/stockwise_$(date +\%F).dump" && find /backups/ -type f -name "*.dump" -mtime +30 -delete
```

---

## 6. Hosting & Deployment Options

### Option A: Containerized Deployment with Docker Compose (Recommended for VPS / Small Business)
Best for: DigitalOcean Droplets, Linode, AWS EC2, or Hetzner VPS.

1. Clone repository on the server:
   ```bash
   git clone <repo_url> stockwise-ai
   cd stockwise-ai
   ```
2. Create `.env` file with production secrets.
3. Build and launch services in background:
   ```bash
   docker compose up -d --build
   ```
4. Verify running containers:
   ```bash
   docker compose ps
   ```
5. Tail logs:
   ```bash
   docker compose logs -f backend
   ```

### Option B: Cloud PaaS Deployment (Render / Railway / Fly.io)
Best for: Zero-ops deployments.

1. **Database**: Create a Managed PostgreSQL 16/18 instance on the platform.
2. **Backend**:
   - Build Command: `pip install -r backend/requirements.txt`
   - Pre-Deploy Command: `alembic -c backend/alembic.ini upgrade head`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`
   - Root Directory: `backend`
3. **Frontend**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Root Directory: `frontend`
   - Environment Variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1`

---

## 7. Troubleshooting Common Issues

| Issue / Error | Root Cause | Solution |
| :--- | :--- | :--- |
| **`Permission denied (10013)`** | Sandboxed execution blocking local loopback TCP port access | Ensure PostgreSQL server is running and commands connecting to localhost are granted network access. |
| **`HTTP 503 Service Unavailable on /health`** | PostgreSQL is unreachable or credentials in `.env` are invalid | Check `POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`. Verify server with `pg_isready`. |
| **`CORS Error in Browser`** | Frontend origin is missing from `CORS_ORIGINS` | Add the frontend domain (e.g., `https://app.stockwise.com`) to `CORS_ORIGINS` in `.env` and restart the backend. |
| **`Alembic Target database is not up to date`** | Unapplied schema migrations exist | Run `alembic -c alembic.ini upgrade head`. |
| **`Insufficient stock (HTTP 400)`** | Requested stock reduction exceeds available balance | Check product's current stock on the Dashboard before issuing a stock-out transaction. StockWise AI prohibits negative balances. |
| **`Cannot delete supplier with active products`** | Foreign key protection (`ON DELETE RESTRICT`) prevents orphan items | Reassign or delete the supplier's products before attempting supplier deletion. |

---

## 8. Verification & Execution Status

- **Automated Tests**: 44 passing backend tests (covering CRUD, inventory movements, ledger consistency, supplier restrictions, reports, security, and frontend integration).
- **Frontend Build**: Verified production build (`vite build` completes cleanly, producing optimized bundle in `frontend/dist`).
- **PostgreSQL Database**: Verified live connectivity and migrations on PostgreSQL 18.
