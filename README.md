# Stock Management System

Full-stack stock and sales app: **Slim 4 (PHP)** REST API + **React (Vite)** + **MySQL** + **Bootstrap 5**.

## Quick start

### 1. Database

Create an empty MySQL database, then from `backend/`:

```bash
composer migrate
composer db:seed
```

(Uses `database/migrations/` and `scripts/seed.php`; see `backend/.env.example` for `SEED_ADMIN_*` / `SEED_MANAGER_*`.)

### 2. Backend

```bash
cd backend
copy .env.example .env
# Edit .env: DB_*, JWT_SECRET, FRONTEND_URL=http://localhost:5173
composer install
composer migrate
composer db:seed
cd public
php -S 127.0.0.1:8080
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://127.0.0.1:8080` (see `frontend/vite.config.js`).

### Demo login

After `composer db:seed` (defaults in `.env.example`):

- **Admin:** `admin@example.com` / `password`
- **Stock manager:** `manager@example.com` / `password`

## Project layout

- `backend/` — Slim API, `public/index.php` entry, `src/` controllers/models/middleware
- `frontend/` — React app, `src/pages`, `src/components`, Axios client with Bearer token from `localStorage` (`sms_token`)

## Documentation

- API details: `backend/README.md`
- Migrations: `backend/database/migrations/`
- Reference SQL dump: `backend/database/schema.sql`

## Features (summary)

- JWT auth (no cookies); token in `localStorage`; `/api/auth/me` for auto-login
- Roles: `admin` (items, sales, company settings, change password), `stock_manager` (inventory dashboard)
- Item names support comma-separated aliases; search matches any trimmed segment
- Sales: autocomplete item search (`GET /api/items/search`), stock deduction (shop first)
- Forgot/reset password (token in DB); reset link included in API only when `APP_DEBUG=true`
