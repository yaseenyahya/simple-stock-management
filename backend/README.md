# Stock Management API (Slim 4)

## Setup

1. Install PHP 8.1+ and Composer.
2. Copy `.env.example` to `.env` and set `DB_*`, `JWT_SECRET` (≥32 chars recommended), `FRONTEND_URL`, `CORS_ORIGIN`, and optional `SEED_*` variables.
3. Create an empty MySQL database (same name as `DB_NAME`).
4. Run `composer install` in this folder.
5. Run migrations, then seeds:

```bash
composer migrate
composer db:seed
```

(Equivalent: `php scripts/migrate.php` and `php scripts/seed.php`.)

6. Start the built-in server from `public`:

```bash
cd public
php -S localhost:8080
```

Or point Apache/Nginx document root to `public/`.

## Database migrations

- Migration files live in `database/migrations/` as PHP files that return a `callable(PDO $pdo): void`.
- The `migrations` table tracks which files have run (by filename).
- Add new migrations with a later timestamp prefix, e.g. `20250402130000_add_column.php`.

## Demo users (after `composer db:seed`)

Defaults match `.env.example` (`SEED_ADMIN_*`, `SEED_MANAGER_*`):

| Email               | Password (default) | Role          |
|---------------------|--------------------|---------------|
| admin@example.com   | password           | admin         |
| manager@example.com | password           | stock_manager |

Passwords are hashed with PHP `password_hash` when seeding. To create **only** the admin user, set `SEED_MANAGER_EMAIL=` empty in `.env`.

## Legacy SQL dumps

`database/schema.sql` and `database/seed.sql` remain as references; prefer **migrate + seed** for new installs.

## API routes

Base URL: `http://localhost:8080` (adjust for your host).

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Body: `email`, `password` → `token`, `user` |
| POST | `/api/auth/forgot-password` | Body: `email` |
| POST | `/api/auth/reset-password` | Body: `token`, `password`, `password_confirm` |

### Auth (Bearer JWT)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/auth/me` | any | Current user |
| POST | `/api/auth/change-password` | **admin** | Body: `current_password`, `new_password`, `new_password_confirm` |

### Settings

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/settings` | admin, stock_manager | `company_name`, `logo_url` |
| PUT | `/api/settings` | admin | Body: `company_name`, `logo_url` (optional) |

### Items

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/items` | admin | List items |
| GET | `/api/items/search?query=` | admin | Search (comma-split / trim match on `item_name` parts) |
| GET | `/api/items/{id}` | admin | Single item |
| POST | `/api/items` | admin | Create item |
| PUT | `/api/items/{id}` | admin | Update item |

### Inventory (stock manager view)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/inventory?query=` | admin, stock_manager | Rows with `total_stock`, `sold_quantity`, `remaining_stock`, `average_price`, `value`, `last_sold`, plus `total_inventory_value` |

### Sales

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/sales` | admin | List sales with `item_name` |
| POST | `/api/sales` | admin | Body: `customer_name`, `item_id`, `quantity_machan`, `quantity_shop`, `price`, `date` (YYYY-MM-DD). Total quantity must be at least 50; stock is deducted from each location accordingly. |
| DELETE | `/api/sales/{id}` | admin | Removes the sale and adds quantity back to the item’s shop/machan stock (legacy rows without a split restore full qty to shop). |

All authenticated requests: `Authorization: Bearer <token>`.

JSON responses only.
